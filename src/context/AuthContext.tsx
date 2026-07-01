"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/auth";

export type AuthUser = {
  id: string;
  email?: string;
  isAdmin: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

async function resolveAuthUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email?: string
): Promise<AuthUser> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", userId)
    .maybeSingle();

  return {
    id: userId,
    email,
    isAdmin: isAdmin(profile),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      return;
    }

    setUser(await resolveAuthUser(supabase, authUser.id, authUser.email));
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    refresh()
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(await resolveAuthUser(supabase, session.user.id, session.user.email));
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, refresh]);

  useEffect(() => {
    refresh().catch(() => setUser(null));
  }, [pathname, refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
