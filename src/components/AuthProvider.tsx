import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

type SignUpResult = {
  /** False when Supabase requires email confirmation before a session exists. */
  sessionCreated: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<SignUpResult>;
  updateProfileName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session and subscribe to auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;
  }

  async function signUp(
    email: string,
    password: string,
    name: string
  ): Promise<SignUpResult> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Name is required.");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: trimmedName,
          name: trimmedName,
        },
      },
    });

    if (error) throw error;

    // Supabase can return a user with empty identities when the email
    // already exists and confirmation is required (anti-enumeration).
    if (
      data.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      throw new Error(
        "An account with this email may already exist. Try signing in instead."
      );
    }

    return { sessionCreated: Boolean(data.session) };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function updateProfileName(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Name is required.");
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        name: trimmedName,
      },
    });

    if (error) throw error;
    if (data.user) {
      setUser(data.user);
    }
  }

  // Wait for the initial session check before rendering the app
  if (loading) {
    return (
      <div style={{ padding: "2rem" }} role="status">
        Checking your session...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, updateProfileName, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
