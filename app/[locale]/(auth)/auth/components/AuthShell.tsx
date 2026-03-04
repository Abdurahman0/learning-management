"use client";

import { Navbar } from "@/app/[locale]/(marketing)/_components/Navbar";

import { AuthCard } from "./AuthCard";
import { BenefitsPanel } from "./BenefitsPanel";

export type AuthMode = "signup" | "signin";

type AuthShellProps = {
  initialMode: AuthMode;
};

function resolveMode(mode: string | null | undefined): AuthMode {
  return mode === "signin" ? "signin" : "signup";
}

export function AuthShell({ initialMode }: AuthShellProps) {
  const mode = resolveMode(initialMode);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-muted/20 text-foreground">
      <Navbar />

      <main className="mx-auto grid w-full max-w-400 grid-cols-1 gap-8 px-4 py-8 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:items-center lg:gap-10 lg:py-12">
        <section className="order-2 min-w-0 lg:order-1">
          <BenefitsPanel mode={mode} />
        </section>
        <section className="order-1 min-w-0 lg:order-2">
          <AuthCard mode={mode} />
        </section>
      </main>
    </div>
  );
}
