import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    // Get initial user
    const getUser = async () => {
      try {
        // First try to get the session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (mounted) {
          if (session?.user) {
            setUser(session.user);
          } else {
            setUser(null);
            // If we're not on a public route, redirect to login
            if (
              !window.location.pathname.startsWith("/login") &&
              !window.location.pathname.startsWith("/auth/callback")
            ) {
              router.replace(`/login?redirectTo=${window.location.pathname}`);
            }
          }
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setError(error as Error);
          setUser(null);
          setLoading(false);
          // On error, redirect to login
          if (!window.location.pathname.startsWith("/login")) {
            router.replace(`/login?redirectTo=${window.location.pathname}`);
          }
        }
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
          // If we're not on a public route, redirect to login
          if (
            !window.location.pathname.startsWith("/login") &&
            !window.location.pathname.startsWith("/auth/callback")
          ) {
            router.replace(`/login?redirectTo=${window.location.pathname}`);
          }
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
  };
}
