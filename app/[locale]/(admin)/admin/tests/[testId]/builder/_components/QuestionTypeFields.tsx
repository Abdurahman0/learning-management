"use client";

import {useMemo} from "react";
import {useTranslations} from "next-intl";

import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {BuilderQuestion, TextInputQuestion} from "@/data/admin-test-builder";

type QuestionTypeFieldsProps = {
  question: BuilderQuestion;
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

export function QuestionTypeFields({question, onChange}: QuestionTypeFieldsProps) {
  const t = useTranslations("adminTestBuilder");
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
        <textarea
          value={question.prompt}
          onChange={(event) => onChange({...question, prompt: event.target.value})}
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
          <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.options")}</Label>
          <div className="space-y-2">
            {question.options.map((option, index) => {
              const key = ["A", "B", "C", "D"][index] as "A" | "B" | "C" | "D";
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
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.correctOption")}</Label>
            <Select value={question.correctAnswer} onValueChange={(value) => onChange({...question, correctAnswer: value as "A" | "B" | "C" | "D"})}>
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["A", "B", "C", "D"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      {question.type === "matching_headings" ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.headingOptions")}</Label>
            <textarea
              value={question.headings.join("\n")}
              onChange={(event) => onChange({...question, headings: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean)})}
              className={fieldClassName}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.correctHeading")}</Label>
            <input
              value={question.correctAnswer}
              onChange={(event) => onChange({...question, correctAnswer: event.target.value})}
              className={inputClassName}
            />
          </div>
        </div>
      ) : null}

      {isMatchingStyleQuestion(question) ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.items")}</Label>
            <textarea
              value={question.items.join("\n")}
              onChange={(event) => {
                const items = event.target.value.split("\n").map((item) => item.trim()).filter(Boolean);
                const nextMapping: Record<string, string> = {};
                for (const item of items) {
                  nextMapping[item] = question.correctAnswer[item] ?? "";
                }
                onChange({...question, items, correctAnswer: nextMapping});
              }}
              className={fieldClassName}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.choices")}</Label>
            <textarea
              value={question.choices.join("\n")}
              onChange={(event) => onChange({...question, choices: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean)})}
              className={fieldClassName}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.mapping")}</Label>
            {question.items.map((item) => (
              <div key={`${question.id}-mapping-${item}`} className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                <input value={item} readOnly className={`${inputClassName} text-muted-foreground`} />
                <Select
                  value={question.correctAnswer[item] ?? ""}
                  onValueChange={(value) => onChange({...question, correctAnswer: {...question.correctAnswer, [item]: value}})}
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
        <textarea
          value={question.explanation ?? ""}
          onChange={(event) => onChange({...question, explanation: event.target.value})}
          className={fieldClassName}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questions.fields.evidence")}</Label>
        <textarea
          value={question.evidence ?? question.evidenceText ?? ""}
          onChange={(event) => onChange({...question, evidence: event.target.value, evidenceText: event.target.value})}
          className={fieldClassName}
          placeholder={t("questions.fields.evidencePlaceholder")}
        />
      </div>
    </div>
  );
}
