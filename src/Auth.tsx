import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "../supabase/supabase-client";
import { jwtDecode } from "jwt-decode";

type AuthContextType = {
  user: User | null | undefined;
  session: Session | null | undefined;
  userRole: string | null | undefined;
  registerUser: (email: string, password: string) => void;
  loginUser: (email: string, password: string) => void;
  logout: () => void;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

interface JwtPayload {
  user_role: string | null;
}

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
  const [userRole, setUserRole] = useState<string | null>();
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
      if (session) {
        const jwt = jwtDecode(session.access_token) as JwtPayload;
        setUserRole(jwt.user_role);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user);
        if (session) {
          const jwt = jwtDecode(session.access_token) as JwtPayload;
          setUserRole(jwt.user_role);
        }
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
      setSession(data.session);
      setUser(session?.user);
      if (session) {
        const jwt = jwtDecode(session.access_token) as JwtPayload;
        setUserRole(jwt.user_role);
      }
      console.log("successfully signed up!");
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
      // console.log(data);
      setSession(data.session);
      setUser(session?.user);
      if (session) {
        const jwt = jwtDecode(session.access_token) as JwtPayload;
        setUserRole(jwt.user_role);
      }
      console.log("successfully logged in!");
    } catch (error) {
      alert(error);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
      setUserRole(null);
      console.log("successfully logged out!");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, userRole, session, registerUser, loginUser, logout }}
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
