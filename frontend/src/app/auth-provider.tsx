import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { getStoredToken, login, logout, me } from "../api/auth.api";
import type { User } from "../types/api";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: typeof login;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener("cinemind:unauthorized", handleUnauthorized);

    if (!getStoredToken()) {
      return () => window.removeEventListener("cinemind:unauthorized", handleUnauthorized);
    }

    me()
      .then(setUser)
      .catch(() => {
        logout();
        setUser(null);
      })
      .finally(() => setIsLoading(false));

    return () => window.removeEventListener("cinemind:unauthorized", handleUnauthorized);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      signIn: async (payload: Parameters<typeof login>[0]) => {
        const response = await login(payload);
        setUser(response.user);
        return response;
      },
      signOut: () => {
        logout();
        setUser(null);
      }
    }),
    [isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
