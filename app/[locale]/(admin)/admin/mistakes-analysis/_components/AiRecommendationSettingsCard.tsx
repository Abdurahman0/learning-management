"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {RecommendationSettings} from "@/data/admin-mistakes-analysis";
import {cn} from "@/lib/utils";

type AiRecommendationSettingsCardProps = {
  settings: RecommendationSettings;
  onToggleEnabled: (value: boolean) => void;
  onThresholdChange: (value: number) => void;
};

export function AiRecommendationSettingsCard({
  settings,
  onToggleEnabled,
  onThresholdChange
}: AiRecommendationSettingsCardProps) {
  const t = useTranslations("adminMistakesAnalysis");

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-2">
        <CardTitle className="text-xl font-semibold tracking-tight">{t("aiRecommendationSettings")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg leading-tight font-semibold tracking-tight">{t("enableAiRecommendations")}</p>
            <p className="text-sm text-muted-foreground">{t("enableAiRecommendationsHint")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            onClick={() => onToggleEnabled(!settings.enabled)}
            className={cn(
              "relative inline-flex h-7 w-12 items-center rounded-full border transition-colors",
              settings.enabled ? "border-primary/45 bg-primary/80" : "border-border/80 bg-muted/65"
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow transition-all",
                settings.enabled ? "left-[24px]" : "left-[2px]"
              )}
            />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold">{t("weaknessDetectionThreshold")}</p>
            <p className="text-sm font-semibold text-primary">{settings.threshold}% {t("accuracyShort")}</p>
          </div>
          <input
            type="range"
            min={10}
            max={60}
            step={1}
            value={settings.threshold}
            onChange={(event) => onThresholdChange(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
          <div className="grid grid-cols-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <span>{t("threshold.strict")}</span>
            <span className="text-center">{t("threshold.moderate")}</span>
            <span className="text-right">{t("threshold.relaxed")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
