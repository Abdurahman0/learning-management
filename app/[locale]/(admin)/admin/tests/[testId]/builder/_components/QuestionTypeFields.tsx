"use client";

import {useMemo} from "react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {BuilderQuestion, TextInputQuestion} from "@/data/admin-test-builder";
import {BoldTextarea} from "./BoldTextarea";

type QuestionTypeFieldsProps = {
  question: BuilderQuestion;
  module?: "reading" | "listening";
  mcqMode?: "single" | "multiple";
  onChange: (question: BuilderQuestion) => void;
};

const fieldClassName =
  "min-h-[88px] w-full rounded-xl border border-border/70 bg-background/45 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

const inputClassName =
  "h-9 w-full rounded-lg border border-border/70 bg-background/45 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

function toArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isTextInputQuestion(question: BuilderQuestion): question is TextInputQuestion {
  return [
    "sentence_completion",
    "summary_completion",
    "table_completion",
    "flow_chart",
    "diagram_labeling",
    "form_completion",
    "note_completion",
    "short_answer"
  ].includes(question.type);
}

function isMatchingStyleQuestion(question: BuilderQuestion): question is Extract<BuilderQuestion, {type: "matching_information" | "matching_features" | "selecting_from_a_list" | "map"}> {
  return (
    question.type === "matching_information" ||
    question.type === "matching_features" ||
    question.type === "selecting_from_a_list" ||
    question.type === "map"
  );
}

function toOptionKey(index: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let value = index + 1;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = alphabet[value % 26] + result;
    value = Math.floor(value / 26);
  }
  return result || "A";
}

function isMatchingChoiceQuestion(question: BuilderQuestion): question is Extract<BuilderQuestion, {type: "matching_information" | "matching_features"}> {
  return question.type === "matching_information" || question.type === "matching_features";
}

export function QuestionTypeFields({question, module = "reading", mcqMode = "single", onChange}: QuestionTypeFieldsProps) {
  const t = useTranslations("adminTestBuilder");
  const showListeningMcqHint = module === "listening" && question.type === "multiple_choice";
  const autoListSelectionItem = question.type === "selecting_from_a_list"
    ? (question.prompt.trim() || `Question ${question.number}`)
    : "";
  const answerValue = useMemo(() => {
    if (!("correctAnswer" in question)) {
      return "";
    }
    return Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : String(question.correctAnswer ?? "");
  }, [question]);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.prompt")}</Label>
        <BoldTextarea
          value={question.prompt}
          onChange={(nextPrompt) => {
            if (question.type !== "selecting_from_a_list") {
              onChange({...question, prompt: nextPrompt});
              return;
            }

            const previousKey = question.items[0] ?? (question.prompt.trim() || `Question ${question.number}`);
            const nextKey = nextPrompt.trim() || `Question ${question.number}`;
            const preservedValue =
              question.correctAnswer[previousKey]
              ?? question.correctAnswer[nextKey]
              ?? Object.values(question.correctAnswer).find((value) => String(value ?? "").trim().length > 0)
                ?? "";

            onChange({
              ...question,
              prompt: nextPrompt,
              items: [nextKey],
              correctAnswer: preservedValue ? {[nextKey]: preservedValue} : {}
            });
          }}
          className={fieldClassName}
        />
      </div>

      {question.type === "tfng" ? (
        <div className="space-y-1.5">
          <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.correctAnswer")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["TRUE", "FALSE", "NOT GIVEN"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`h-9 rounded-lg border text-xs font-semibold tracking-wide ${
                  question.correctAnswer === option
                    ? "border-primary/60 bg-primary/20 text-primary"
                    : "border-border/70 bg-background/45 text-muted-foreground"
                }`}
                onClick={() => onChange({...question, correctAnswer: option})}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {question.type === "yes_no_not_given" ? (
        <div className="space-y-1.5">
          <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.correctAnswer")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["YES", "NO", "NOT GIVEN"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`h-9 rounded-lg border text-xs font-semibold tracking-wide ${
                  question.correctAnswer === option
                    ? "border-primary/60 bg-primary/20 text-primary"
                    : "border-border/70 bg-background/45 text-muted-foreground"
                }`}
                onClick={() => onChange({...question, correctAnswer: option})}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {question.type === "multiple_choice" ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.options")}</Label>
            {showListeningMcqHint ? (
              <p className="text-[10px] text-muted-foreground">
                You can set default/shared options in the group settings. Editing here overrides this question only.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            {question.options.map((option, index) => {
              const key = toOptionKey(index);
              return (
                <div key={`${question.id}-${key}`} className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{key}</span>
                  <input
                    value={option}
                    onChange={(event) =>
                      onChange({
                        ...question,
                        options: question.options.map((item, optionIndex) => (optionIndex === index ? event.target.value : item))
                      })
                    }
                    className={inputClassName}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="h-8 rounded-lg border border-border/70 px-3 text-xs font-semibold text-muted-foreground"
              onClick={() => onChange({...question, options: [...question.options, ""]})}
            >
              + Add option
            </button>
            <button
              type="button"
              className="h-8 rounded-lg border border-border/70 px-3 text-xs font-semibold text-muted-foreground disabled:opacity-50"
              disabled={question.options.length <= 2}
              onClick={() =>
                onChange({
                  ...question,
                  options: question.options.slice(0, -1)
                })
              }
            >
              Remove option
            </button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.correctOption")}</Label>
            {mcqMode === "multiple" ? (
              <div className="grid grid-cols-4 gap-2">
                {question.options.map((_, index) => {
                  const value = toOptionKey(index);
                  const selected = question.correctAnswer
                    .split(",")
                    .map((item) => item.trim().toUpperCase())
                    .filter(Boolean)
                    .includes(value);

                  return (
                    <button
                      key={value}
                      type="button"
                      title={question.options[index]?.trim() || value}
                      className={`h-9 rounded-lg border text-xs font-semibold tracking-wide ${
                        selected
                          ? "border-primary/60 bg-primary/20 text-primary"
                          : "border-border/70 bg-background/45 text-muted-foreground"
                      }`}
                      onClick={() => {
                        const current = question.correctAnswer
                          .split(",")
                          .map((item) => item.trim().toUpperCase())
                          .filter(Boolean);
                        const next = selected
                          ? current.filter((item) => item !== value)
                          : [...current, value];
                        onChange({...question, correctAnswer: next.join(", ")});
                      }}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Select value={question.correctAnswer} onValueChange={(value) => onChange({...question, correctAnswer: value})}>
                <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/45">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {question.options.map((_, index) => {
                    const value = toOptionKey(index);
                    return (
                    <SelectItem key={value} value={value}>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-border/70 bg-muted/35 px-2 text-[11px] font-semibold">
                          {value}
                        </span>
                        <span className="min-w-0 truncate">{question.options[index]?.trim() || value}</span>
                      </span>
                    </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      ) : null}

      {question.type === "matching_headings" ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.correctHeading")}</Label>
            <Select
              value={question.correctAnswer}
              onValueChange={(value) => onChange({...question, correctAnswer: value})}
            >
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/45">
                <SelectValue placeholder={t("questions.fields.selectChoice")} />
              </SelectTrigger>
              <SelectContent>
                {question.headings.map((heading, index) => (
                  <SelectItem key={`${question.id}-heading-${index}`} value={heading}>
                    {heading}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {t("questions.hints.groupWide")} ({t("groups.editTitle")})
            </p>
          </div>
        </div>
      ) : null}

      {isMatchingChoiceQuestion(question) ? (
        <div className="space-y-3">
          {(() => {
            const matchingQuestion = question as Extract<BuilderQuestion, {type: "matching_information" | "matching_features" | "selecting_from_a_list" | "map"}>;
            return (
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.correctAnswer")}</Label>
            <Select
              value={
                matchingQuestion.correctAnswer[matchingQuestion.prompt]
                ?? Object.values(matchingQuestion.correctAnswer).find((value) => String(value ?? "").trim().length > 0)
                ?? ""
              }
              onValueChange={(value) => onChange({...matchingQuestion, correctAnswer: {[matchingQuestion.prompt]: value}})}
            >
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/45">
                <SelectValue placeholder={t("questions.fields.selectChoice")} />
              </SelectTrigger>
              <SelectContent>
                {matchingQuestion.choices.map((choice, index) => (
                  <SelectItem key={`${matchingQuestion.id}-choice-${index}`} value={choice}>
                    {choice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {t("questions.hints.groupWide")} ({t("groups.editTitle")})
            </p>
          </div>
            );
          })()}
        </div>
      ) : null}

      {isMatchingStyleQuestion(question) && !isMatchingChoiceQuestion(question) ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.items")}</Label>
            {question.type === "selecting_from_a_list" ? (
              <div className="min-h-10 rounded-xl border border-border/70 bg-background/45 px-3 py-2 text-sm text-muted-foreground">
                {autoListSelectionItem}
              </div>
            ) : (
              <BoldTextarea
                value={question.items.join("\n")}
                onChange={(nextValue) => {
                  const items = nextValue.split("\n").map((item) => item.trim()).filter(Boolean);
                  const nextMapping: Record<string, string> = {};
                  for (const item of items) {
                    nextMapping[item] = question.correctAnswer[item] ?? "";
                  }
                  onChange({...question, items, correctAnswer: nextMapping});
                }}
                className={fieldClassName}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.choices")}</Label>
            <div className="min-h-10 rounded-xl border border-border/70 bg-background/45 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
              <span>{question.choices.length} {t("questions.fields.choices").toLowerCase()}</span>
              <Badge variant="outline" className="rounded-md border-primary/30 bg-primary/5 px-1.5 py-0 text-[10px] text-primary lowercase">
                {t("questions.hints.groupWide")}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.mapping")}</Label>
            {(question.type === "selecting_from_a_list" ? [autoListSelectionItem] : question.items).map((item) => (
              <div key={`${question.id}-mapping-${item}`} className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                <input value={item} readOnly className={`${inputClassName} text-muted-foreground`} />
                <Select
                  value={
                    question.correctAnswer[item]
                    ?? (question.type === "selecting_from_a_list"
                      ? Object.values(question.correctAnswer).find((value) => String(value ?? "").trim().length > 0) ?? ""
                      : "")
                  }
                  onValueChange={(value) =>
                    onChange({
                      ...question,
                      items: question.type === "selecting_from_a_list" ? [autoListSelectionItem] : question.items,
                      correctAnswer: {
                        ...question.correctAnswer,
                        [item]: value
                      }
                    })
                  }
                >
                  <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/45">
                    <SelectValue placeholder={t("questions.fields.selectChoice")} />
                  </SelectTrigger>
                  <SelectContent>
                    {question.choices.map((choice) => (
                      <SelectItem key={`${question.id}-${item}-${choice}`} value={choice}>
                        {choice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isTextInputQuestion(question) ? (
        <div className="space-y-1.5">
          <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.acceptableAnswers")}</Label>
          <input
            value={answerValue}
            onChange={(event) => {
              const values = toArray(event.target.value);
              onChange({
                ...question,
                correctAnswer: values.length <= 1 ? (values[0] ?? "") : values
              });
            }}
            className={inputClassName}
            placeholder={t("questions.fields.acceptableAnswersPlaceholder")}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.explanation")}</Label>
        <BoldTextarea
          value={question.explanation ?? ""}
          onChange={(nextValue) => onChange({...question, explanation: nextValue})}
          className={fieldClassName}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.evidence")}</Label>
        <BoldTextarea
          value={question.evidence ?? question.evidenceText ?? ""}
          onChange={(nextValue) => onChange({...question, evidence: nextValue, evidenceText: nextValue})}
          className={fieldClassName}
          placeholder={t("questions.fields.evidencePlaceholder")}
        />
      </div>
    </div>
  );
}
