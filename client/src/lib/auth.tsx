import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, setUnauthorizedHandler, tokenStore } from "./api";
import type { User } from "../types";

const USER_KEY = "subtrack.user";

type AuthContextValue = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const readStoredUser = (): User | null => {
  if (!tokenStore.get()) return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<User | null>(readStoredUser);

  const setUser = useCallback((next: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUserState(next);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    queryClient.clear();
    setUserState(null);
  }, [queryClient]);

  useEffect(() => setUnauthorizedHandler(signOut), [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser,
      signOut,
      signIn: async (email, password) => {
        const result = await api.signIn(email, password);
        tokenStore.set(result.token);
        setUser(result.user);
      },
      signUp: async (name, email, password) => {
        const result = await api.signUp(name, email, password);
        tokenStore.set(result.token);
        setUser(result.user);
      },
    }),
    [user, setUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
