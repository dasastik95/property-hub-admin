import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, type AppRole } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
  rolesLoading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);

  // ✅ FIXED: Fetch role from profiles table
  const fetchRoles = async (userId: string) => {
    setRolesLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!error && data?.role) {
      setRoles([data.role]); // convert to array
      console.log("ROLE:", data.role); // 🔍 debug
    } else {
      console.log("ROLE ERROR:", error);
      setRoles([]);
    }

    setRolesLoading(false);
  };

  useEffect(() => {
    // 🔁 Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setTimeout(() => fetchRoles(newSession.user.id), 0);
        } else {
          setRoles([]);
        }
      }
    );

    // 🔍 Check existing session on load
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        fetchRoles(existingSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const refreshRoles = async () => {
    if (user) await fetchRoles(user.id);
  };

  // ✅ Role checks (based on profiles.role)
  const isSuperAdmin = roles.includes("super_admin");
  const isModerator = roles.includes("moderator");

  // 👉 You can customize this:
  const isAdmin = isSuperAdmin || roles.includes("admin");

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        isAdmin,
        isSuperAdmin,
        isModerator,
        loading,
        rolesLoading,
        signOut,
        refreshRoles
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
