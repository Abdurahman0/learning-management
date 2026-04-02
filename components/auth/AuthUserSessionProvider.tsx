"use client";

import type {ReactNode} from "react";
import {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";

import {authApi} from "@/lib/api/auth";
import type {AuthCurrentUser} from "@/lib/auth/current-user";

type UpdateUserResult = {
  ok: boolean;
  status: number;
  detail: string | null;
  user: AuthCurrentUser | null;
};

type AuthUserSessionContextValue = {
  user: AuthCurrentUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isRegularUser: boolean;
  isLoadingUser: boolean;
  userError: string | null;
  refreshCurrentUser: () => Promise<AuthCurrentUser | null>;
  updateCurrentUser: (payload: {full_name: string}) => Promise<UpdateUserResult>;
  clearCurrentUser: () => void;
};

const AuthUserSessionContext = createContext<AuthUserSessionContextValue | null>(null);

type AuthUserSessionProviderProps = {
  children: ReactNode;
};

export function AuthUserSessionProvider({children}: AuthUserSessionProviderProps) {
  const [user, setUser] = useState<AuthCurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  const refreshCurrentUser = useCallback(async () => {
    setIsLoadingUser(true);
    setUserError(null);

    const response = await authApi.me();
    if (response.ok && response.data) {
      setUser(response.data);
      setIsLoadingUser(false);
      return response.data;
    }

    if (response.status === 401) {
      setUser(null);
    }
    setUserError(response.detail ?? null);
    setIsLoadingUser(false);
    return null;
  }, []);

  const updateCurrentUser = useCallback(async (payload: {full_name: string}): Promise<UpdateUserResult> => {
    const response = await authApi.editCurrentUser(payload);

    if (response.ok && response.data) {
      setUser(response.data);
      setUserError(null);
      return {
        ok: true,
        status: response.status,
        detail: null,
        user: response.data
      };
    }

    return {
      ok: false,
      status: response.status,
      detail: response.detail,
      user: null
    };
  }, []);

  const clearCurrentUser = useCallback(() => {
    setUser(null);
    setUserError(null);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  const value = useMemo<AuthUserSessionContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.is_staff),
      isRegularUser: Boolean(user) && !Boolean(user?.is_staff),
      isLoadingUser,
      userError,
      refreshCurrentUser,
      updateCurrentUser,
      clearCurrentUser
    }),
    [user, isLoadingUser, userError, refreshCurrentUser, updateCurrentUser, clearCurrentUser]
  );

  return <AuthUserSessionContext.Provider value={value}>{children}</AuthUserSessionContext.Provider>;
}

export function useAuthUserSession() {
  const context = useContext(AuthUserSessionContext);
  if (!context) {
    throw new Error("useAuthUserSession must be used inside AuthUserSessionProvider.");
  }

  return context;
}
