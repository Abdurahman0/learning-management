"use client";

import type {ReactNode} from "react";
import {createContext, useContext} from "react";

export type AppSessionRole = "guest" | "user" | "teacher" | "admin";

const AppSessionContext = createContext<AppSessionRole>("guest");

type AppSessionProviderProps = {
  role: AppSessionRole;
  children: ReactNode;
};

export function AppSessionProvider({role, children}: AppSessionProviderProps) {
  return <AppSessionContext.Provider value={role}>{children}</AppSessionContext.Provider>;
}

export function useAppSessionRole() {
  return useContext(AppSessionContext);
}
