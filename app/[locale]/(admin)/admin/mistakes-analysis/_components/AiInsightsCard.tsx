"use client";

import {Sparkles} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {AiInsight} from "@/data/admin-mistakes-analysis";

type AiInsightsCardProps = {
  items: AiInsight[];
  onGenerateModules: () => void;
};

export function AiInsightsCard({items, onGenerateModules}: AiInsightsCardProps) {
  const t = useTranslations("adminMistakesAnalysis");

  return (
    <Card className="rounded-3xl border-primary/30 bg-gradient-to-br from-primary/30 via-card to-card py-0">
      <CardHeader className="pt-5 pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Sparkles className="size-5 text-primary" />
          {t("aiGeneratedInsights")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-5">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-primary/25 bg-background/35 px-4 py-3">
            <p className="text-sm font-semibold text-primary">{item.title}:</p>
            <p className="mt-1 text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}

        <Button type="button" className="h-11 w-full rounded-xl font-semibold" onClick={onGenerateModules}>
          {t("actionPlanGenerateModules")}
        </Button>
      </CardContent>
    </Card>
  );
}
