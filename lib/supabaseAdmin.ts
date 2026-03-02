import { createClient } from "@supabase/supabase-js";

// Existing factory (чинь одоо байгаа хэлбэрээрээ үлдэнэ)
export const supabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
};

// ✅ Compatibility alias: зарим route/getSupabaseAdmin import-уудыг эвдэхгүй
export function getSupabaseAdmin() {
  return supabaseAdmin();
}
