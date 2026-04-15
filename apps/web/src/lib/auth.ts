import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "edgerift_auth";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (session: AuthSession) => void;
  clearAuth: () => void;
};

const readStoredSession = (): AuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as {
      state?: { token?: unknown; user?: unknown };
    };
    const token = parsed.state?.token;
    const user = parsed.state?.user;

    if (
      typeof token === "string" &&
      user &&
      typeof user === "object" &&
      "id" in user &&
      "firstName" in user &&
      "lastName" in user &&
      "email" in user &&
      typeof user.id === "string" &&
      typeof user.firstName === "string" &&
      typeof user.lastName === "string" &&
      typeof user.email === "string"
    ) {
      return {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      };
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return null;
};

const storedSession = readStoredSession();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: storedSession?.token ?? null,
      user: storedSession?.user ?? null,
      setAuth: (session) =>
        set({
          token: session.token,
          user: session.user,
        }),
      clearAuth: () =>
        set({
          token: null,
          user: null,
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);

export const authStore = {
  getToken: () =>
    useAuthStore.getState().token ?? readStoredSession()?.token ?? null,
  getUser: () =>
    useAuthStore.getState().user ?? readStoredSession()?.user ?? null,
  isAuthenticated: () =>
    Boolean(useAuthStore.getState().token ?? readStoredSession()?.token),
  setAuth: (session: AuthSession) => useAuthStore.getState().setAuth(session),
  clearAuth: () => useAuthStore.getState().clearAuth(),
};
