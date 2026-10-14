'use client';
// A client component: it reads sessionStorage and holds state, which only exist in the browser.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from '@/lib/api';
import { clearToken, readToken, saveToken, setExpiredHandler } from '@/lib/session';
import type { User } from '@/lib/types';

// Three states, not two: on the first moment after a page load we don't know yet whether the
// saved token still works. Pages show a spinner for 'loading' instead of flashing the login page.
export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User };

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => ReturnType<typeof api.login>;
  register: (name: string, email: string, password: string) => ReturnType<typeof api.register>;
  logout: () => void;
};

// A context is a value that every component inside the provider can read, without passing it
// down through props page by page. Here: who is logged in, and how to log in or out.
const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const logout = useCallback(() => {
    clearToken();
    setState({ status: 'anonymous' });
  }, []);

  useEffect(() => {
    // When any API call finds the token expired, lib/api.ts rings this alarm.
    setExpiredHandler(logout);

    // On page load: is there a saved token, and does the API still accept it? /auth/me answers
    // both. If it doesn't work, forget it. (Wrapped in an async function because an effect
    // itself can't be async.)
    async function restore() {
      const result = readToken() ? await api.getMe() : null;
      if (result?.ok) {
        setState({ status: 'authenticated', user: result.data });
      } else {
        clearToken();
        setState({ status: 'anonymous' });
      }
    }
    void restore();

    return () => setExpiredHandler(null);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    if (result.ok) {
      saveToken(result.data.token);
      setState({ status: 'authenticated', user: result.data.user });
    }
    return result; // the login page shows errors from it
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await api.register(name, email, password);
    if (result.ok) {
      saveToken(result.data.token);
      setState({ status: 'authenticated', user: result.data.user });
    }
    return result;
  }, []);

  // useMemo hands out the same object until something changes, so components that read the
  // context don't redraw for nothing.
  const value = useMemo(() => ({ ...state, login, register, logout }), [state, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The one-line way for any client component to ask "who's logged in?":
//   const auth = useAuth();  if (auth.status === 'authenticated') auth.user.name ...
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
