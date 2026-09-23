import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Plus, Trash2, GripVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminButton, AdminCard } from "@/components/admin/AdminUI";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/announcements")({
  component: AdminAnnouncements,
});

function AdminAnnouncements() {
  const { state, refreshData } = useStore();
  const [items, setItems] = useState<string[]>(
    state.announcementBar?.length ? [...state.announcementBar] : [""]
  );
  const [isSaving, setIsSaving] = useState(false);

  const addItem = () => setItems((prev) => [...prev, ""]);

  const updateItem = (idx: number, value: string) =>
    setItems((prev) => prev.map((v, i) => (i === idx ? value : v)));

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const filtered = items.map((v) => v.trim()).filter(Boolean);
    if (filtered.length === 0) {
      toast.error("أضف إعلاناً واحداً على الأقل قبل الحفظ");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert(
          { key_name: "announcementBar", key_value: JSON.stringify(filtered) },
          { onConflict: "key_name" }
        );
      if (error) throw error;
      toast.success("تم حفظ شريط الإعلانات بنجاح! ✨");
      await refreshData();
    } catch (e: any) {
      toast.error("حدث خطأ أثناء الحفظ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("هل أنت متأكد من حذف جميع الإعلانات؟")) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert(
          { key_name: "announcementBar", key_value: JSON.stringify([]) },
          { onConflict: "key_name" }
        );
      if (error) throw error;
      setItems([""]);
      toast.success("تم مسح شريط الإعلانات");
      await refreshData();
    } catch (e: any) {
      toast.error("حدث خطأ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminCard title="شريط الإعلانات المتحرك">
      <div className="space-y-6">

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-2xl bg-primary/10 border border-primary/20 px-5 py-4">
          <Megaphone className="mt-0.5 shrink-0 size-5 text-primary" />
          <div>
            <p className="text-sm font-bold text-foreground">كيف يعمل الشريط؟</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              النصوص التي تضيفها هنا ستظهر في الشريط الداكن العلوي بالموقع وتتحرك من اليمين إلى اليسار بشكل مستمر.
              يُفصل بين كل إعلان وآخر بنجمة ★ تلقائياً.
            </p>
          </div>
        </div>

        {/* Live preview */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-widest">معاينة مباشرة</p>
          <div className="relative overflow-hidden rounded-2xl bg-foreground py-2.5 text-xs font-bold text-background select-none">
            {items.filter(Boolean).length > 0 ? (
              <div className="flex whitespace-nowrap animate-marquee">
                {[...items.filter(Boolean), ...items.filter(Boolean)].map((text, i) => (
                  <span key={i} className="mx-8 shrink-0">★ {text}</span>
                ))}
              </div>
            ) : (
              <p className="text-center text-background/50">أضف إعلانات لتظهر هنا…</p>
            )}
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Items list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">نصوص الإعلانات</h3>
            <span className="text-xs text-muted-foreground">{items.filter(Boolean).length} إعلان</span>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <GripVertical className="size-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                dir="rtl"
                value={item}
                placeholder={`نص الإعلان ${idx + 1}… مثال: شحن مجاني لجميع الطلبات`}
                onChange={(e) => updateItem(idx, e.target.value)}
                className="flex-1 rounded-2xl bg-background/50 border border-border px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="tap-pulse flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 py-3 text-sm font-semibold text-primary hover:border-primary hover:bg-primary/5 transition"
          >
            <Plus className="size-4" />
            إضافة إعلان جديد
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={handleClear}
            disabled={isSaving}
            className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
          >
            مسح الكل
          </button>
          <AdminButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </AdminButton>
        </div>
      </div>
    </AdminCard>
  );
}
