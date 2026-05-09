import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { getProfileById, updateProfile, upsertProfile } from "@/integrations/supabase/database";

type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  role: "buyer" | "seller" | "broker" | "admin";
  owner_type: "individual" | "broker" | null;
  city: string | null;
  bio: string | null;
  onboarded: boolean;
  preferences: Record<string, unknown>;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

function getUserMeta(user: User) {
  return (user as any).raw_user_meta_data ?? (user as any).user_metadata ?? {};
}

function normalizePhoneValue(phone?: unknown) {
  if (!phone) return "";
  return String(phone).replace(/[^\d+\-\s()]/g, "").trim();
}

async function ensureProfileRow(user: User) {
  const metadata = getUserMeta(user);
  const displayName = String(metadata.display_name ?? metadata.full_name ?? metadata.name ?? user.email?.split("@")[0] ?? "").trim();
  const phone = normalizePhoneValue(metadata.phone);
  const whatsapp = normalizePhoneValue(metadata.whatsapp);
  const role = ['buyer', 'seller', 'broker', 'admin'].includes(metadata.role)
    ? metadata.role
    : 'buyer';
  const ownerType = ['individual', 'broker'].includes(metadata.owner_type)
    ? metadata.owner_type
    : null;

  return upsertProfile({
    id: user.id,
    email: user.email,
    display_name: displayName || null,
    phone: phone || null,
    whatsapp: whatsapp || null,
    role: role as Profile['role'],
    owner_type: ownerType as Profile['owner_type'],
    onboarded: false,
  });
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (authUser: User) => {
    try {
      const { data, error } = await getProfileById(authUser.id);
      if (error) {
        console.error("Failed to load profile:", error);
        setProfile(null);
        return;
      }

      if (!data) {
        const { error: createError } = await ensureProfileRow(authUser);
        if (createError) {
          console.error("Failed to create missing profile row:", createError);
          setProfile(null);
          return;
        }

        const { data: newData, error: fetchError } = await getProfileById(authUser.id);
        if (fetchError) {
          console.error("Failed to load created profile:", fetchError);
          setProfile(null);
          return;
        }
        setProfile(newData as Profile | null);
        return;
      }

      const existingData = data as Profile;
      const metadata = getUserMeta(authUser);
      const phoneFromMeta = normalizePhoneValue(metadata.phone);
      const whatsappFromMeta = normalizePhoneValue(metadata.whatsapp);
      if (!existingData.phone && phoneFromMeta) {
        await updateProfile(authUser.id, { phone: phoneFromMeta });
        existingData.phone = phoneFromMeta;
      }
      if (!existingData.whatsapp && whatsappFromMeta) {
        await updateProfile(authUser.id, { whatsapp: whatsappFromMeta });
        existingData.whatsapp = whatsappFromMeta;
      }

      setProfile(existingData);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer profile load to avoid deadlocks
        setTimeout(() => loadProfile(newSession.user), 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession()
      .then(({ data: { session: existingSession }, error }) => {
        if (error) {
          console.error("Failed to get session:", error);
          setSession(null);
          setUser(null);
        } else {
          setSession(existingSession ?? null);
          setUser(existingSession?.user ?? null);
          if (existingSession?.user) {
            loadProfile(existingSession.user);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to get session:", err);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
