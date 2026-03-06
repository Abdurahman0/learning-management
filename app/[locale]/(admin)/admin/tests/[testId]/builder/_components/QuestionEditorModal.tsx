"use client";

import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import type {BuilderQuestion} from "@/data/admin-test-builder";

import {QuestionTypeFields} from "./QuestionTypeFields";

type QuestionEditorModalProps = {
  open: boolean;
  question: BuilderQuestion | null;
  onOpenChange: (open: boolean) => void;
  onQuestionChange: (question: BuilderQuestion) => void;
};

export function QuestionEditorModal({open, question, onOpenChange, onQuestionChange}: QuestionEditorModalProps) {
  const t = useTranslations("adminTestBuilder");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-[560px] overflow-y-auto border-l border-border/70 bg-background/95 p-0">
        <SheetHeader className="border-b border-border/70 p-5">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base">{t("questions.editorTitle")}</SheetTitle>
            {question ? (
              <Badge className="rounded-md border border-border/70 bg-muted/35 px-2 py-0.5 text-[10px] tracking-wide uppercase">
                {t("questions.questionNumber", {number: question.number})}
              </Badge>
            ) : null}
          </div>
          <SheetDescription>{t("questions.editorDescription")}</SheetDescription>
        </SheetHeader>

        <div className="p-5">
          {question ? <QuestionTypeFields question={question} onChange={onQuestionChange} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

