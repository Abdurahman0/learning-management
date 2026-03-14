"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ListeningResultStatCardTone = "success" | "danger" | "neutral" | "info";

type ListeningResultStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: ListeningResultStatCardTone;
};

const toneStyles: Record<ListeningResultStatCardTone, { card: string; value: string }> = {
  success: {
    card: "border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-500/[0.07]",
    value: "text-emerald-700 dark:text-emerald-300",
  },
  danger: {
    card: "border-rose-200 bg-rose-50 dark:border-rose-400/25 dark:bg-rose-500/[0.08]",
    value: "text-rose-700 dark:text-rose-300",
  },
  neutral: {
    card: "border-slate-200 bg-white dark:border-border/65 dark:bg-background/45",
    value: "text-slate-800 dark:text-slate-200",
  },
  info: {
    card: "border-blue-200 bg-blue-50 dark:border-blue-400/25 dark:bg-blue-500/[0.09]",
    value: "text-blue-700 dark:text-blue-200",
  },
};

export function ListeningResultStatCard({ label, value, hint, tone = "neutral" }: ListeningResultStatCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card className={cn("gap-1.5 rounded-2xl p-3 shadow-none", styles.card)}>
      <p className="text-[11px] tracking-[0.06em] text-muted-foreground uppercase">{label}</p>
      <p className={cn("text-xl font-semibold leading-tight", styles.value)}>{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
