import type {ReactNode} from "react";

import {GuestSidebar} from "./GuestSidebar";

type GuestShellProps = {
  children: ReactNode;
};

export function GuestShell({children}: GuestShellProps) {
  // TODO: Replace with real guest usage counters from backend/session.
  const usedTests = 0;
  const totalTests = 4;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <GuestSidebar usedTests={usedTests} totalTests={totalTests} />
        <main className="min-h-screen flex-1 px-4 py-4 sm:px-5 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
