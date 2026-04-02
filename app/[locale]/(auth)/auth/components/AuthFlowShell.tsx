import type {ReactNode} from "react";

import {Navbar} from "@/app/[locale]/(marketing)/_components/Navbar";
import {Card} from "@/components/ui/card";

type AuthFlowShellProps = {
  heading: string;
  description: string;
  sideBadge: string;
  sideTitle: string;
  sideDescription: string;
  sidePoints: string[];
  children: ReactNode;
};

export function AuthFlowShell({
  heading,
  description,
  sideBadge,
  sideTitle,
  sideDescription,
  sidePoints,
  children
}: AuthFlowShellProps) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-muted/20 text-foreground">
      <Navbar />

      <main className="mx-auto grid w-full max-w-400 grid-cols-1 gap-8 px-4 py-8 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:items-center lg:gap-10 lg:py-12">
        <section className="order-2 min-w-0 lg:order-1">
          <Card className="rounded-3xl border-border/80 bg-card/90 p-6 shadow-xl shadow-slate-950/5 sm:p-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-blue-700 uppercase dark:text-blue-300">{sideBadge}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{sideTitle}</h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{sideDescription}</p>

            <div className="mt-6 grid gap-2.5">
              {sidePoints.map((point) => (
                <div key={point} className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground/90">
                  {point}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="order-1 min-w-0 lg:order-2">
          <Card className="w-full max-w-155 rounded-3xl border-border/80 bg-card/95 px-5 py-6 shadow-xl shadow-slate-950/5 sm:px-8 sm:py-8">
            <div className="space-y-1">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">{heading}</h2>
              <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
            </div>
            {children}
          </Card>
        </section>
      </main>
    </div>
  );
}
