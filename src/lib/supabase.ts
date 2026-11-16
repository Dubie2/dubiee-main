import { createClient } from "@supabase/supabase-js";

const defaultUrl = "https://udorhrfrqhwxcaiohgvu.supabase.co";
const defaultAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkb3JocmZycWh3eGNhaW9oZ3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NTc1NTIsImV4cCI6MjEwNTMzMzU1Mn0.mB22V38oAVrm0di2ZB_ZVP305GzYU4fLn0FqUL9oVN0";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_URL : undefined) ||
  defaultUrl;

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_ANON_KEY : undefined) ||
  defaultAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing!");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
