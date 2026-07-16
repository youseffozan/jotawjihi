import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "teacher" | "student";
export type GradeLevel = "11" | "12";

export type Profile = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  grade: GradeLevel | null;
  field: string | null;
  is_public: boolean;
  bio: string | null;
  avatar_url: string | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  roles: AppRole[];
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      if (!sess) {
        setRoles([]);
        setProfile(null);
        setLoading(false);
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const userId = session?.user?.id;

  const loadProfile = useCallback(async (uid: string) => {
    const [{ data: rolesData }, { data: prof }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("id, full_name, first_name, last_name, email, grade, field, is_public, bio, avatar_url").eq("id", uid).maybeSingle(),
    ]);
    setRoles(((rolesData ?? []).map((r) => r.role)) as AppRole[]);
    setProfile(prof ? (prof as Profile) : null);
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    loadProfile(userId).finally(() => setLoading(false));
  }, [userId, loadProfile]);

  // Presence heartbeat: mark this user online every 60s while signed in.
  useEffect(() => {
    if (!userId) return;
    const ping = () => {
      supabase.from("user_presence").upsert({ user_id: userId, last_seen: new Date().toISOString() }).then(() => {});
    };
    ping();
    const iv = setInterval(ping, 60_000);
    const onFocus = () => ping();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(iv); window.removeEventListener("focus", onFocus); };
  }, [userId]);

  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher");
  const role: AppRole | null = isAdmin ? "admin" : isTeacher ? "teacher" : session ? "student" : null;

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    role,
    roles,
    profile,
    loading,
    isAdmin,
    isTeacher,
    signOut: async () => { await supabase.auth.signOut(); },
    refreshProfile: async () => { if (userId) await loadProfile(userId); },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
