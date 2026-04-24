// Supabase client — uses publishable (anon) key. Safe to expose in frontend.
// Service role key must NEVER be added here.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sowjdkokhtrsboxjpvfz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fwHe7I0nTYebSmRtkktJKA_E08A3jQA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type AppRole = "super_admin" | "moderator" | "user";
export type PropertyStatus = "pending" | "active" | "rejected" | "sold" | "rented";
export type PropertyListingType = "sale" | "rent";
export type PropertyCategory = "residential" | "commercial" | "land";
