-- =====================================================================
--  Dubai Abaya — إعدادات الأمان المعتمدة (نسخة مطابقة لقاعدة البيانات الحية بتاريخ 2026-11-15)
--  هذا الملف هو المرجع الوحيد للصلاحيات. شغّله بعد supabase_schema.sql و update_schema.sql و lottery_schema.sql.
--  آمن للتكرار. لا تشغّل السياسات القديمة (USING (true)) من الملفات الأخرى.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1) جدول المدراء + أعمدة إضافية
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.system_settings add column if not exists is_public boolean not null default false;
alter table public.products add column if not exists stock int;
alter table public.products add column if not exists fabric text;
alter table public.products add column if not exists tag text;
alter table public.products add column if not exists reviews jsonb;
alter table public.products add column if not exists styles text[];

-- 2) حدّ الطلبات (Rate limit)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (bucket, window_start)
);

-- 3) الدوال
create or replace function public.is_admin()
 returns boolean language sql stable security definer set search_path to ''
as $function$ select exists (select 1 from public.admins a where a.user_id = (select auth.uid())) $function$;

create or replace function private.client_ip()
 returns text language sql stable set search_path to ''
as $function$ select coalesce(nullif(trim(split_part(nullif(current_setting('request.headers', true),'')::json->>'x-forwarded-for', ',', 1)),''), 'unknown') $function$;

create or replace function private.hit_rate_limit(p_bucket text, p_max integer, p_window_seconds integer)
 returns void language plpgsql security definer set search_path to ''
as $function$
declare v_win timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
        v_hits int;
begin
  insert into private.rate_limits as r (bucket, window_start, hits) values (p_bucket, v_win, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1 returning hits into v_hits;
  if v_hits > p_max then
    raise exception 'rate_limited' using errcode = 'P0429', hint = 'Too many requests, try again later';
  end if;
  if random() < 0.01 then delete from private.rate_limits where window_start < now() - interval '1 day'; end if;
end $function$;

create or replace function public.admin_generate_coupons(p_count integer)
 returns integer language plpgsql security definer set search_path to ''
as $function$
declare v_count int := 0; v_code text;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_count is null or p_count < 1 or p_count > 1000 then raise exception 'p_count must be 1..1000'; end if;
  for i in 1..p_count loop
    v_code := 'DA-' || upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 10));
    begin insert into public.lottery_coupons (coupon_code) values (v_code); v_count := v_count + 1;
    exception when unique_violation then null; end;
  end loop;
  return v_count;
end $function$;

drop function if exists public.claim_lottery_coupon(text, text, text, uuid);
create or replace function public.claim_lottery_coupon(p_coupon_code text, p_user_name text, p_phone text, p_round_id uuid default null::uuid)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare v_user_id uuid; v_coupon_id uuid; v_new_total int; v_round uuid; v_ip text := private.client_ip();
        v_code text := upper(trim(coalesce(p_coupon_code,''))); v_phone text := regexp_replace(coalesce(p_phone,''), '[^0-9+]', '', 'g');
        v_name text := trim(coalesce(p_user_name,''));
begin
  perform private.hit_rate_limit('claim:ip:'||v_ip, 20, 600);
  perform private.hit_rate_limit('claim:phone:'||v_phone, 30, 3600);
  if char_length(v_code) not between 4 and 32 or char_length(v_name) not between 2 and 100 or v_phone !~ '^\+?[0-9]{7,15}$' then
    return jsonb_build_object('success', false, 'message', 'بيانات غير صالحة');
  end if;
  select id into v_round from public.lottery_rounds where status = 'active'
    and (p_round_id is null or id = p_round_id) order by created_at desc limit 1;
  if v_round is null then return jsonb_build_object('success', false, 'message', 'لا يوجد سحب نشط حالياً'); end if;
  select id into v_coupon_id from public.lottery_coupons where coupon_code = v_code and is_claimed = false for update skip locked;
  if v_coupon_id is null then
    perform private.hit_rate_limit('claim:fail:'||v_ip, 10, 3600);
    return jsonb_build_object('success', false, 'message', 'الكوبون غير صحيح أو تم استخدامه مسبقاً');
  end if;
  insert into public.lottery_users (full_name, phone_number, total_coupons) values (v_name, v_phone, 1)
  on conflict (phone_number) do update set total_coupons = public.lottery_users.total_coupons + 1
  returning id, total_coupons into v_user_id, v_new_total;
  update public.lottery_coupons set is_claimed = true, claimed_by_user_id = v_user_id, round_id = v_round, claimed_at = now() where id = v_coupon_id;
  return jsonb_build_object('success', true, 'message', 'تم تسجيل الكوبون بنجاح!', 'total_coupons', v_new_total);
end $function$;

create or replace function public.create_order(p_name text, p_phone text, p_address_link text, p_address_text text, p_bank_ref text, p_items jsonb)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare v_total numeric := 0; v_item jsonb; v_clean jsonb := '[]'::jsonb; v_prod record; v_qty int; v_id uuid;
        v_phone text := regexp_replace(coalesce(p_phone,''), '[^0-9+]', '', 'g');
begin
  perform private.hit_rate_limit('order:ip:'||private.client_ip(), 10, 3600);
  perform private.hit_rate_limit('order:phone:'||v_phone, 5, 3600);
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'invalid items'; end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty not between 1 and 20 then raise exception 'invalid qty'; end if;
    select id, title, coalesce(discount_price, price) as unit, stock into v_prod
      from public.products where id = (v_item->>'product_id')::uuid and is_available = true;
    if v_prod.id is null then raise exception 'product unavailable'; end if;
    if v_prod.stock is not null and v_prod.stock < v_qty then raise exception 'insufficient stock'; end if;
    v_total := v_total + v_prod.unit * v_qty;
    v_clean := v_clean || jsonb_build_object('product_id', v_prod.id, 'title', v_prod.title, 'unit_price', v_prod.unit, 'qty', v_qty,
               'size', left(v_item->>'size', 20), 'color', left(v_item->>'color', 40));
  end loop;
  insert into public.orders (customer_name, customer_phone, delivery_address_link, delivery_address_text, bank_deposit_reference, total_amount, items)
  values (trim(p_name), v_phone, coalesce(p_address_link,''), p_address_text, coalesce(p_bank_ref,''), v_total, v_clean)
  returning id into v_id;
  return jsonb_build_object('success', true, 'order_id', v_id, 'total', v_total);
end $function$;

create or replace function public.execute_lottery_draw_v2(p_round_id uuid)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare v_most jsonb; v_rand jsonb; v_excl uuid; v_status text;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select status into v_status from public.lottery_rounds where id = p_round_id for update;
  if v_status is null then raise exception 'round not found'; end if;
  if v_status = 'completed' then raise exception 'round already drawn'; end if;
  select jsonb_build_object('user_id', u.id, 'name', u.full_name, 'phone', u.phone_number, 'coupon_count', count(c.id)), u.id
    into v_most, v_excl
  from public.lottery_coupons c join public.lottery_users u on c.claimed_by_user_id = u.id
  where c.round_id = p_round_id group by u.id, u.full_name, u.phone_number
  order by count(c.id) desc, min(c.claimed_at) asc limit 1;
  select jsonb_build_object('user_id', u.id, 'name', u.full_name, 'phone', u.phone_number, 'coupon_code', c.coupon_code)
    into v_rand
  from public.lottery_coupons c join public.lottery_users u on c.claimed_by_user_id = u.id
  where c.round_id = p_round_id and (v_excl is null or u.id <> v_excl)
  order by (('x' || encode(extensions.gen_random_bytes(8), 'hex'))::bit(64)::bigint) limit 1;
  update public.lottery_rounds set status = 'completed', actual_draw_at = now(), winner_most_coupons = v_most, winner_random = v_rand where id = p_round_id;
  return jsonb_build_object('success', true, 'winner_most', v_most, 'winner_random', v_rand);
end $function$;

-- الإعدادات العامة تُقرأ للزوار؛ إعدادات السحب (فيها مفتاح واتساب) للمدير فقط
create or replace function public.trg_settings_visibility()
 returns trigger language plpgsql set search_path to ''
as $function$
begin
  new.is_public := new.key_name not in ('lotterySettings');
  return new;
end $function$;
drop trigger if exists settings_visibility on public.system_settings;
create trigger settings_visibility before insert or update of key_name, is_public on public.system_settings
  for each row execute function public.trg_settings_visibility();

drop function if exists public.submit_lottery_tickets(text[], text, text);
drop function if exists public.execute_weekly_lottery_draw(uuid);

-- صلاحيات تنفيذ الدوال
revoke all on function private.client_ip() from public, anon, authenticated;
revoke all on function private.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_generate_coupons(integer) from public, anon, authenticated;
revoke all on function public.claim_lottery_coupon(text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.create_order(text, text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.execute_lottery_draw_v2(uuid) from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.trg_settings_visibility() from public, anon, authenticated;
grant execute on function public.admin_generate_coupons(integer) to authenticated;           -- تتحقق من is_admin داخلياً
grant execute on function public.execute_lottery_draw_v2(uuid) to authenticated;             -- تتحقق من is_admin داخلياً
grant execute on function public.claim_lottery_coupon(text, text, text, uuid) to anon, authenticated;
grant execute on function public.create_order(text, text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- 4) RLS على كل الجداول
alter table public.admins enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.categories enable row level security;
alter table public.lottery_coupons enable row level security;
alter table public.lottery_rounds enable row level security;
alter table public.lottery_users enable row level security;
alter table public.offers enable row level security;
alter table public.orders enable row level security;
alter table public.products enable row level security;
alter table public.system_settings enable row level security;

-- حذف السياسات القديمة المفتوحة (USING true) إن وُجدت
do $$ declare r record; begin
  for r in select policyname, schemaname, tablename from pg_policies
           where schemaname = 'public' or (schemaname = 'storage' and tablename = 'objects' and (qual like '%store_assets%' or with_check like '%store_assets%'))
  loop execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename); end loop;
end $$;

-- قراءة عامة لمحتوى المتجر
create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy products_read on public.products for select to anon, authenticated using ((is_available = true) or (select public.is_admin()));
create policy offers_read on public.offers for select to anon, authenticated using ((is_active = true) or (select public.is_admin()));
create policy banks_read on public.bank_accounts for select to anon, authenticated using ((is_active = true) or (select public.is_admin()));
create policy rounds_read on public.lottery_rounds for select to anon, authenticated using (true);
create policy settings_read on public.system_settings for select to anon, authenticated using ((is_public = true) or (select public.is_admin()));

-- بيانات حساسة: للمدير فقط (الطلبات وبيانات المشاركين وأرقامهم والكوبونات)
create policy orders_read_admin on public.orders for select to authenticated using ((select public.is_admin()));
create policy lusers_read_admin on public.lottery_users for select to authenticated using ((select public.is_admin()));
create policy coupons_read_admin on public.lottery_coupons for select to authenticated using ((select public.is_admin()));
create policy admins_select_self_or_admin on public.admins for select to authenticated using ((user_id = (select auth.uid())) or (select public.is_admin()));
create policy admins_write_admin on public.admins for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- الكتابة على كل الجداول: للمدير فقط
do $$ declare t text; begin
  foreach t in array array['bank_accounts','categories','lottery_coupons','lottery_rounds','lottery_users','offers','orders','products','system_settings'] loop
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.is_admin()))', t||'_admin_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t||'_admin_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select public.is_admin()))', t||'_admin_delete', t);
  end loop;
end $$;

-- 5) التخزين: قراءة عامة للصور، والرفع والتعديل والحذف للمدير فقط
insert into storage.buckets (id, name, public) values ('store_assets', 'store_assets', true) on conflict (id) do nothing;
create policy "Public Access" on storage.objects for select to public using (bucket_id = 'store_assets');
create policy store_assets_admin_insert on storage.objects for insert to authenticated with check ((bucket_id = 'store_assets') and (select public.is_admin()));
create policy store_assets_admin_update on storage.objects for update to authenticated using ((bucket_id = 'store_assets') and (select public.is_admin())) with check ((bucket_id = 'store_assets') and (select public.is_admin()));
create policy store_assets_admin_delete on storage.objects for delete to authenticated using ((bucket_id = 'store_assets') and (select public.is_admin()));

-- 6) إضافة مدير: أنشئ المستخدم من Supabase > Authentication ثم:
--    insert into public.admins (user_id) select id from auth.users where email = 'admin@example.com' on conflict do nothing;
