const clientSupabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const clientSupabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "";

console.log("Supabase config:", {
  url: clientSupabaseUrl,
  hasAnonKey: Boolean(clientSupabaseAnonKey),
  anonKeyPrefix: clientSupabaseAnonKey.substring(0, 10) + "..."
});

export function isSupabaseConfigured() {
  return Boolean(clientSupabaseUrl && clientSupabaseAnonKey);
}

export function getSupabaseClientConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.",
    );
  }

  return {
    url: clientSupabaseUrl,
    anonKey: clientSupabaseAnonKey,
  };
}

export function getSupabaseServerConfig() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    url,
    anonKey,
    serviceRoleKey,
    isConfigured: Boolean(url && anonKey),
    hasServiceRole: Boolean(url && serviceRoleKey),
  };
}
