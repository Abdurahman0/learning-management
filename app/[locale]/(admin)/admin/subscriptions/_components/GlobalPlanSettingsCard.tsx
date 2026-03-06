"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import type {GlobalPlanSettings, PlanDistributionItem} from "@/data/admin-subscriptions";
import {cn} from "@/lib/utils";

import {PlanDistributionChart} from "./PlanDistributionChart";

type GlobalPlanSettingsCardProps = {
  settings: GlobalPlanSettings;
  distribution: PlanDistributionItem[];
  onGuestTestLimitChange: (nextValue: number) => void;
  onAiRecommendationsToggle: (nextValue: boolean) => void;
  onPremiumExplanationsToggle: (nextValue: boolean) => void;
};

type SwitchRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function SwitchRow({title, description, checked, onChange}: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[22px] leading-tight font-semibold tracking-tight">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 items-center rounded-full border transition-colors",
          checked ? "border-primary/45 bg-primary/80" : "border-border/80 bg-muted/65"
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow transition-all",
            checked ? "left-[24px]" : "left-[2px]"
          )}
        />
      </button>
    </div>
  );
}

export function GlobalPlanSettingsCard({
  settings,
  distribution,
  onGuestTestLimitChange,
  onAiRecommendationsToggle,
  onPremiumExplanationsToggle
}: GlobalPlanSettingsCardProps) {
  const t = useTranslations("adminSubscriptions");

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-2">
        <CardTitle className="text-3xl font-semibold tracking-tight">{t("globalSettings.title")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 pb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[22px] leading-tight font-semibold tracking-tight">{t("globalSettings.guestTestLimit")}</p>
            <p className="text-sm text-muted-foreground">{t("globalSettings.guestTestLimitHint")}</p>
          </div>
          <Input
            type="number"
            min={0}
            value={settings.guestTestLimit}
            onChange={(event) => onGuestTestLimitChange(Math.max(0, Number(event.target.value || 0)))}
            className="h-11 w-[82px] rounded-xl border-border/70 bg-background/45 text-center text-base font-semibold"
          />
        </div>

        <SwitchRow
          title={t("globalSettings.aiRecommendationsAccess")}
          description={t("globalSettings.aiRecommendationsAccessHint")}
          checked={settings.aiRecommendationsAccess}
          onChange={onAiRecommendationsToggle}
        />

        <SwitchRow
          title={t("globalSettings.premiumExplanations")}
          description={t("globalSettings.premiumExplanationsHint")}
          checked={settings.premiumExplanations}
          onChange={onPremiumExplanationsToggle}
        />

        <Separator className="my-1" />

        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{t("distribution.title")}</p>
          <PlanDistributionChart items={distribution} />
        </div>
      </CardContent>
    </Card>
  );
}

