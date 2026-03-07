import type {ReactNode} from "react";
import {cookies} from "next/headers";

import {AUTH_COOKIE_NAME, parseSessionRole} from "@/lib/auth/session";

import {GuestShell} from "./_components/guest-tests/GuestShell";
import {AppSessionProvider, type AppSessionRole} from "./_components/session/AppSessionContext";

export default async function Layout({children}: { children: ReactNode }) {
  const cookieStore = await cookies();
  const role = (parseSessionRole(cookieStore.get(AUTH_COOKIE_NAME)?.value) ?? "guest") as AppSessionRole;

  return (
    <AppSessionProvider role={role}>
      <GuestShell>{children}</GuestShell>
    </AppSessionProvider>
  );
}
