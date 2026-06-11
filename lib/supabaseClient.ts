/**
 * Client-side Supabase replacement.
 * Browser components that previously used supabase.from("transactions")...
 * must now call API routes via fetch() instead.
 * This file exists only to prevent import errors during migration.
 * Do NOT add new usages of this client.
 */
export const supabase = {
  from(_table: string) {
    console.warn("supabaseClient: direct DB calls from browser are not supported. Use fetch() to API routes instead.");
    return {
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: { message: "Use API routes" } }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Use API routes" } }) }) }),
      delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
    };
  },
};
