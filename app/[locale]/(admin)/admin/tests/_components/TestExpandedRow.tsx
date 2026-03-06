"use client";

import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import type {AdminTest} from "@/data/admin-tests";

type TestExpandedRowProps = {
  test: AdminTest;
  onEditPassage: (testId: string, passageId: string) => void;
};

export function TestExpandedRow({test, onEditPassage}: TestExpandedRowProps) {
  const t = useTranslations("adminTests");

  if (test.module === "reading") {
    if (!test.passages?.length) {
      return <p className="text-sm text-muted-foreground">{t("table.noPassages")}</p>;
    }

    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {test.passages.map((passage, index) => (
          <Card key={passage.id} className="rounded-2xl border-border/65 bg-background/45 py-0">
            <CardContent className="space-y-3 px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {t("table.passageLabel", {index: index + 1})}
                </p>
                <span className="rounded-full border border-primary/25 bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {passage.questionCount} {t("table.questionsShort")}
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="line-clamp-1 text-lg font-semibold leading-tight">{passage.title}</h4>
                <p className="line-clamp-2 text-sm text-muted-foreground">{passage.shortDescription}</p>
              </div>

              <Button
                variant="link"
                className="h-auto p-0 text-sm text-primary"
                onClick={() => onEditPassage(test.id, passage.id)}
              >
                {t("table.editPassage")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!test.sections?.length) {
    return <p className="text-sm text-muted-foreground">{t("table.noSections")}</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {test.sections.map((section, index) => (
        <Card key={section.id} className="rounded-2xl border-border/65 bg-background/45 py-0">
          <CardContent className="space-y-3 px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {t("table.sectionLabel", {index: index + 1})}
              </p>
              <span className="rounded-full border border-primary/25 bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-primary">
                {section.questionCount} {t("table.questionsShort")}
              </span>
            </div>

            <div className="space-y-1.5">
              <h4 className="line-clamp-1 text-base font-semibold leading-tight">{section.title}</h4>
              <p className="line-clamp-2 text-sm text-muted-foreground">{section.shortDescription}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
