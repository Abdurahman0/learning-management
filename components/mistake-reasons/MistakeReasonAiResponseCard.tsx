"use client";

import {Sparkles} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {MistakeReasonSolutionList} from "@/components/mistake-reasons/MistakeReasonSolutionList";
import type {MistakeReasonDetail} from "@/src/services/student/types";

type MistakeReasonAiResponseCardProps = {
  selectedReason: MistakeReasonDetail | null;
  selectedReasons?: MistakeReasonDetail[];
};

export function MistakeReasonAiResponseCard({selectedReason, selectedReasons = []}: MistakeReasonAiResponseCardProps) {
  const t = useTranslations("mistakeReasons");
  const activeReasons = selectedReasons.length ? selectedReasons : (selectedReason ? [selectedReason] : []);

  return (
    <section id="ai-insights" className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{t("aiInsightsTitle")}</h2>
      {activeReasons.length ? (
        <MistakeReasonSolutionList reasons={activeReasons} />
      ) : (
      <Card className="rounded-2xl border-blue-300/70 bg-blue-100/70 shadow-none dark:border-blue-500/35 dark:bg-blue-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-blue-600 dark:text-blue-200" />
            {t("chooseReasonTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("chooseReasonDescription")}</p>
        </CardContent>
      </Card>
      )}
    </section>
  );
}
