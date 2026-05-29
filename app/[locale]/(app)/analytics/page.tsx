import Link from "next/link";
import {useLocale} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

// import {StudentProgressAnalyticsClient} from "./_components/StudentProgressAnalyticsClient";

export default function AnalyticsPage() {
  const locale = useLocale();

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-10">
      <Card className="w-full rounded-2xl border-border/70 bg-card/70">
        <CardContent className="space-y-4 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-500">Analytics</p>
          <h1 className="text-2xl font-semibold tracking-tight">Student analytics is temporarily hidden</h1>
          <p className="mx-auto max-w-lg text-sm leading-6 text-muted-foreground">
            This page is currently paused while the student analytics experience is being adjusted.
          </p>
          <Button asChild className="rounded-xl">
            <Link href={`/${locale}/dashboard`}>Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
