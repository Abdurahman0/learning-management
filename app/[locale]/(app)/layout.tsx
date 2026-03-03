import type { ReactNode } from "react";
import { GuestShell } from "./_components/guest-tests/GuestShell";

export default function Layout({ children }: { children: ReactNode }) {
  return <GuestShell>{children}</GuestShell>;
}
