"use client";

import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {MistakeTopic} from "@/data/admin-mistakes-analysis";
import {cn} from "@/lib/utils";

type CommonMistakeTopicsCardProps = {
  topics: MistakeTopic[];
  selectedTopic: string | null;
  onTopicSelect: (topicLabel: string | null) => void;
};

function compact(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `${value}`;
}

export function CommonMistakeTopicsCard({topics, selectedTopic, onTopicSelect}: CommonMistakeTopicsCardProps) {
  const t = useTranslations("adminMistakesAnalysis");

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-2">
        <CardTitle className="text-xl font-semibold tracking-tight">{t("commonMistakeTopics")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2.5 pb-5">
        {topics.length ? (
          topics.map((topic) => {
            const active = selectedTopic === topic.label;
            return (
              <button
                type="button"
                key={topic.id}
                onClick={() => onTopicSelect(active ? null : topic.label)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-primary/45 bg-primary/20 text-primary"
                    : "border-border/70 bg-background/30 text-muted-foreground hover:bg-muted/45 hover:text-foreground"
                )}
              >
                {topic.label} <span className="text-xs">{compact(topic.count)}</span>
              </button>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">{t("noTopics")}</p>
        )}
      </CardContent>
    </Card>
  );
}
