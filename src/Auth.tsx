import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "../supabase/supabase-client";

type AuthContextType = {
  user: User | null | undefined;
  session: Session | null | undefined;
  registerUser: (email: string, password: string) => void;
  loginUser: (email: string, password: string) => void;
  logout: () => void;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/**
 * Provides authentication functionality to the application.
 *
 * @component
 * @param children - The child components to be wrapped by the `AuthProvider`.
 * @returns JSX.Element
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>();
  const [session, setSession] = useState<Session | null>();

  useEffect(() => {
    const setData = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(session);
      setUser(session?.user);
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user);
      }
    );

    setData();

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const registerUser = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      console.log(data);
      setSession(data.session);
    } catch (error) {
      alert(error);
    }
  };

  const loginUser = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      console.log(data);
      setSession(data.session);
    } catch (error) {
      alert(error);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      alert(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, registerUser, loginUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook that returns the authentication context.
 * @returns The authentication context.
 */
export const useAuth = () => {
  return useContext(AuthContext);
};
