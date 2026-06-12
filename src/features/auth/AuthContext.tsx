import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { useRevalidator } from "react-router";
import { supabase } from "@/lib/supabase";

// Sessions used to live in localStorage; the cookie-backed client can't see
// them. Restore once so existing users aren't signed out by the SSR migration.
const migrateLegacyLocalStorageSession = async (): Promise<void> => {
  const projectRef = new URL(
    import.meta.env.VITE_SUPABASE_URL
  ).hostname.split(".")[0];
  const legacyKey = `sb-${projectRef}-auth-token`;

  try {
    const stored = window.localStorage.getItem(legacyKey);
    if (!stored) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      window.localStorage.removeItem(legacyKey);
      return;
    }

    const parsed = JSON.parse(stored);
    if (parsed?.access_token && parsed?.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
      });
      // Only discard the legacy token once it's safely in cookies — a
      // transient setSession failure must stay retryable on the next load
      if (error) {
        console.warn("Failed to migrate legacy auth session:", error);
        return;
      }
    }
    window.localStorage.removeItem(legacyKey);
  } catch (error) {
    console.warn("Failed to migrate legacy auth session:", error);
  }
};

interface AuthContextType {
  user: User | null;
  signInWithGoogle: (response: { credential: string }) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const { revalidate } = useRevalidator();

  useEffect(() => {
    migrateLegacyLocalStorageSession().then(() =>
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      })
    );

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        // Re-run loaders so server-rendered data matches the new auth state
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          revalidate();
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInWithGoogle(response: { credential: string }) {
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: response.credential,
    });

    if (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  }

  async function signUpWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  }

  async function signInAnonymously() {
    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error("Error signing in anonymously: ", error);
      throw error;
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        signInAnonymously,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {" "}
      {children}{" "}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within the AuthProvider");
  }
  return context;
};
