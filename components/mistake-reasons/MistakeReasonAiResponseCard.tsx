"use client";

import {useEffect, useMemo, useState} from "react";
import {Download, Sparkles} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {MistakeReasonDetail} from "@/src/services/student/types";

type MistakeReasonAiResponseCardProps = {
  selectedReason: MistakeReasonDetail | null;
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

export function MistakeReasonAiResponseCard({selectedReason}: MistakeReasonAiResponseCardProps) {
  const t = useTranslations("mistakeReasons");
  const solutionText = useMemo(() => {
    if (!selectedReason) return "";
    return [selectedReason.solution_1, selectedReason.solution_2, selectedReason.solution_3]
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n\n");
  }, [selectedReason]);
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
            {selectedReason ? t("aiAnswerTitle") : t("chooseReasonTitle")}
          </CardTitle>
          {selectedReason ? <p className="text-sm text-muted-foreground">{selectedReason.reason}</p> : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedReason ? (
            <>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {typedSolution || t("thinking")}
              </p>
              {isSafeDownloadUrl(selectedReason.file_url) ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={selectedReason.file_url ?? "#"} target="_blank" rel="noopener noreferrer">
                    <Download className="size-4" />
                    {t("downloadGuide")}
                  </a>
                </Button>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("chooseReasonDescription")}</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
