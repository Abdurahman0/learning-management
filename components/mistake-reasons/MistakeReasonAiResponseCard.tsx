"use client";

import {useEffect, useMemo, useState} from "react";
import {Download, Sparkles} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {MistakeReasonDetail} from "@/src/services/student/types";

type MistakeReasonAiResponseCardProps = {
  selectedReason: MistakeReasonDetail | null;
  selectedReasons?: MistakeReasonDetail[];
};

function isSafeDownloadUrl(value: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function MistakeReasonAiResponseCard({selectedReason, selectedReasons = []}: MistakeReasonAiResponseCardProps) {
  const t = useTranslations("mistakeReasons");
  const activeReasons = selectedReasons.length ? selectedReasons : (selectedReason ? [selectedReason] : []);
  const solutionText = useMemo(() => {
    if (!activeReasons.length) return "";
    return activeReasons
      .flatMap((reason) => [reason.solution_1, reason.solution_2, reason.solution_3])
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n\n");
  }, [activeReasons]);
  const [typedSolution, setTypedSolution] = useState("");

  useEffect(() => {
    if (!solutionText) {
      setTypedSolution("");
      return;
    }

    setTypedSolution("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 4;
      setTypedSolution(solutionText.slice(0, index));
      if (index >= solutionText.length) {
        window.clearInterval(timer);
      }
    }, 16);

    return () => window.clearInterval(timer);
  }, [solutionText]);

  return (
    <section id="ai-insights" className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{t("aiInsightsTitle")}</h2>
      <Card className="rounded-2xl border-blue-300/70 bg-blue-100/70 shadow-none dark:border-blue-500/35 dark:bg-blue-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-blue-600 dark:text-blue-200" />
            {activeReasons.length ? t("aiAnswerTitle") : t("chooseReasonTitle")}
          </CardTitle>
          {activeReasons.length ? <p className="text-sm text-muted-foreground">{t("aiReasonsDescription")}</p> : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {activeReasons.length ? (
            <>
              <div className="rounded-xl border border-blue-300/60 bg-background/55 p-3">
                <p className="mb-2 text-sm font-semibold">{t("aiReasonsTitle")}</p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground/90">
                  {activeReasons.map((reason) => (
                    <li key={reason.id}>
                      <span className="font-semibold">{reason.mistake_category_display}:</span> {reason.reason}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm font-semibold">{t("improvementPlanTitle")}</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {typedSolution || t("thinking")}
              </p>
              <div className="flex flex-wrap gap-2">
                {activeReasons.filter((reason) => isSafeDownloadUrl(reason.file_url)).map((reason) => (
                  <Button key={reason.id} size="sm" variant="outline" asChild>
                    <a href={reason.file_url ?? "#"} target="_blank" rel="noopener noreferrer">
                      <Download className="size-4" />
                      {t("downloadGuide")}
                    </a>
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("chooseReasonDescription")}</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
