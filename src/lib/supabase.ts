import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://udorhrfrqhwxcaiohgvu.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkb3JocmZycWh3eGNhaW9oZ3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NTc1NTIsImV4cCI6MjEwNTMzMzU1Mn0.mB22V38oAVrm0di2ZB_ZVP305GzYU4fLn0FqUL9oVN0";

let rawUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_URL : undefined) ||
  DEFAULT_SUPABASE_URL;

// Ensure HTTPS protocol to prevent insecure WebSocket connections
rawUrl = rawUrl.trim();
if (!rawUrl || rawUrl === "" || rawUrl === "undefined") {
  rawUrl = DEFAULT_SUPABASE_URL;
}
if (rawUrl.startsWith("http://")) {
  rawUrl = rawUrl.replace("http://", "https://");
} else if (!rawUrl.startsWith("https://")) {
  rawUrl = `https://${rawUrl}`;
}

const rawKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_ANON_KEY : undefined) ||
  DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(
  rawUrl,
  rawKey || DEFAULT_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
