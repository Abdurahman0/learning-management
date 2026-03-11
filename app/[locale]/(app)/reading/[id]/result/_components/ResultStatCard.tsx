"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ResultStatCardTone = "success" | "danger" | "neutral" | "info";

type ResultStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: ResultStatCardTone;
};

const toneStyles: Record<ResultStatCardTone, { card: string; value: string }> = {
  success: {
    card: "border-emerald-400/20 bg-emerald-500/[0.07]",
    value: "text-emerald-300",
  },
  danger: {
    card: "border-rose-400/25 bg-rose-500/[0.08]",
    value: "text-rose-300",
  },
  neutral: {
    card: "border-border/65 bg-background/45",
    value: "text-slate-200",
  },
  info: {
    card: "border-blue-400/25 bg-blue-500/[0.09]",
    value: "text-blue-200",
  },
};

export function ResultStatCard({ label, value, hint, tone = "neutral" }: ResultStatCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card className={cn("gap-1.5 rounded-2xl p-3 shadow-none", styles.card)}>
      <p className="text-[11px] tracking-[0.06em] text-muted-foreground uppercase">{label}</p>
      <p className={cn("text-xl font-semibold leading-tight", styles.value)}>{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
