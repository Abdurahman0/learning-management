"use client";

import {Check, X} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import type {SubscriptionPlan} from "@/data/admin-subscriptions";
import {cn} from "@/lib/utils";

type PlanCardProps = {
  plan: SubscriptionPlan;
  highlighted?: boolean;
  onEdit: (plan: SubscriptionPlan) => void;
};

export function PlanCard({plan, highlighted = false, onEdit}: PlanCardProps) {
  const t = useTranslations("adminSubscriptions");

  return (
    <Card
      className={cn(
        "rounded-3xl border-border/70 bg-card/75 py-0",
        plan.highlight ? "border-primary/65 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]" : "",
        highlighted ? "ring-2 ring-primary/35" : ""
      )}
    >
      <CardContent className="flex min-h-[410px] flex-col px-5 py-5">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-4xl leading-tight font-semibold tracking-tight">{plan.name}</h3>
            {plan.badge ? (
              <Badge className="border-primary/30 bg-primary/20 px-2 py-0.5 text-[10px] tracking-wide uppercase text-primary">
                {plan.badge}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{plan.tagline}</p>
        </div>

        <div className="mt-5 flex items-end gap-2">
          <p className="text-5xl font-semibold tracking-tight">${plan.price}</p>
          <p className="pb-1 text-base text-muted-foreground">/ {plan.billingPeriod === "month" ? t("billing.month") : t("billing.forever")}</p>
        </div>

        <ul className="mt-6 space-y-3">
          {plan.features.map((feature) => (
            <li key={feature.id} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                  feature.included ? "border-primary/35 bg-primary/18 text-primary" : "border-border/80 bg-muted/55 text-muted-foreground"
                )}
              >
                {feature.included ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              </span>
              <span className={cn("text-[17px] leading-snug", feature.included ? "text-foreground" : "text-muted-foreground")}>{feature.label}</span>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          className={cn("mt-auto h-11 rounded-xl font-semibold", plan.highlight ? "" : "bg-background/35 text-foreground hover:bg-muted")}
          variant={plan.highlight ? "default" : "outline"}
          onClick={() => onEdit(plan)}
        >
          {t("editPlan")}
        </Button>
      </CardContent>
    </Card>
  );
}

