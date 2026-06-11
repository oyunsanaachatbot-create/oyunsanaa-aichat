/**
 * Replaced Supabase admin client with local PostgreSQL wrapper.
 * Existing imports of supabaseAdmin / getSupabaseAdmin continue to work.
 */
import { getPgAdmin } from "@/lib/db/pgClient";

export const supabaseAdmin = getPgAdmin;
export const getSupabaseAdmin = getPgAdmin;
