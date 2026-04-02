"use client"

import {useMemo} from "react"
import {useTranslations} from "next-intl"

import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import type {BuilderQuestion, MatchingInformationBuilderQuestion} from "@/types/admin"

type PassageQuestionFieldsProps = {
  question: BuilderQuestion
  onChange: (question: BuilderQuestion) => void
}

const fieldClassName =
  "min-h-[88px] w-full rounded-xl border border-border/70 bg-background/45 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/35"

const inputClassName =
  "h-9 w-full rounded-lg border border-border/70 bg-background/45 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/35"

function toArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function isTextInputQuestion(question: BuilderQuestion): question is Extract<
  BuilderQuestion,
  {
    type:
      | "sentence_completion"
      | "summary_completion"
      | "table_completion"
      | "flow_chart"
      | "diagram_labeling"
      | "form_completion"
      | "note_completion"
      | "short_answer"
  }
> {
  return [
    "sentence_completion",
    "summary_completion",
    "table_completion",
    "flow_chart",
    "diagram_labeling",
    "form_completion",
    "note_completion",
    "short_answer"
  ].includes(question.type)
}

function isMatchingStyleQuestion(
  question: BuilderQuestion
): question is MatchingInformationBuilderQuestion {
  return (
    question.type === "matching_features" ||
    question.type === "selecting_from_a_list" ||
    question.type === "map"
  )
}

function isMatchingInformationQuestion(question: BuilderQuestion): question is MatchingInformationBuilderQuestion {
  return question.type === "matching_information"
}

function expandLetterRange(value: string) {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "")
  const match = normalized.match(/^([A-Z])-([A-Z])$/)
  if (!match) {
    return null
  }

  const start = match[1].charCodeAt(0)
  const end = match[2].charCodeAt(0)
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    return null
  }

  const letters: string[] = []
  for (let code = start; code <= end; code += 1) {
    letters.push(String.fromCharCode(code))
  }
  return letters
}

function normalizeMatchingChoicesInput(value: string) {
  const tokens = value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean)

  const parsed = tokens.flatMap((token) => expandLetterRange(token) ?? [token.toUpperCase()])
  return [...new Set(parsed)]
}

export function PassageQuestionFields({question, onChange}: PassageQuestionFieldsProps) {
  const t = useTranslations("adminContentBank")
  const answerValue = useMemo(() => {
    if (!("correctAnswer" in question)) {
      return ""
    }
    return Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : String(question.correctAnswer ?? "")
  }, [question])

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.prompt")}</Label>
        <textarea value={question.prompt} onChange={(event) => onChange({...question, prompt: event.target.value})} className={fieldClassName} />
      </div>

      {question.type === "tfng" ? (
        <div className="space-y-1.5">
          <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.correctAnswer")}</Label>
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
          <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.correctAnswer")}</Label>
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
          <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.options")}</Label>
          <div className="space-y-2">
            {question.options.map((option, index) => {
              const key = ["A", "B", "C", "D"][index] as "A" | "B" | "C" | "D"
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
              )
            })}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.correctOption")}</Label>
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
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.headingOptions")}</Label>
            <textarea
              value={question.headings.join("\n")}
              onChange={(event) => onChange({...question, headings: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean)})}
              className={fieldClassName}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.correctHeading")}</Label>
            <input value={question.correctAnswer} onChange={(event) => onChange({...question, correctAnswer: event.target.value})} className={inputClassName} />
          </div>
        </div>
      ) : null}

      {isMatchingInformationQuestion(question) ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.choices")}</Label>
            <textarea
              value={question.choices.join("\n")}
              onChange={(event) => {
                const choices = normalizeMatchingChoicesInput(event.target.value)
                const nextMapping: Record<string, string> = {}
                for (const item of question.items) {
                  const current = String(question.correctAnswer[item] ?? "").trim().toUpperCase()
                  nextMapping[item] = choices.includes(current) ? current : ""
                }
                onChange({
                  ...question,
                  choices,
                  correctAnswer: nextMapping
                })
              }}
              className={fieldClassName}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.correctAnswer")}</Label>
            <Select
              value={question.correctAnswer[question.items[0] ?? ""] ?? ""}
              onValueChange={(value) => {
                const currentItem = question.items[0] ?? ""
                if (!currentItem) return
                onChange({
                  ...question,
                  correctAnswer: {
                    ...question.correctAnswer,
                    [currentItem]: value
                  }
                })
              }}
              disabled={question.choices.length === 0}
            >
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/45">
                <SelectValue placeholder={t("questionBuilder.fields.selectChoice")} />
              </SelectTrigger>
              <SelectContent>
                {question.choices.map((choice) => (
                  <SelectItem key={`${question.id}-choice-${choice}`} value={choice}>
                    {choice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      {isMatchingStyleQuestion(question) ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.items")}</Label>
            <textarea
              value={question.items.join("\n")}
              onChange={(event) => {
                const items = event.target.value.split("\n").map((item) => item.trim()).filter(Boolean)
                const nextMapping: Record<string, string> = {}
                for (const item of items) {
                  nextMapping[item] = question.correctAnswer[item] ?? ""
                }
                onChange({...question, items, correctAnswer: nextMapping})
              }}
              className={fieldClassName}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.choices")}</Label>
            <textarea
              value={question.choices.join("\n")}
              onChange={(event) => onChange({...question, choices: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean)})}
              className={fieldClassName}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.mapping")}</Label>
            {question.items.map((item) => (
              <div key={`${question.id}-mapping-${item}`} className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                <input value={item} readOnly className={`${inputClassName} text-muted-foreground`} />
                <Select
                  value={question.correctAnswer[item] ?? ""}
                  onValueChange={(value) => onChange({...question, correctAnswer: {...question.correctAnswer, [item]: value}})}
                >
                  <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/45">
                    <SelectValue placeholder={t("questionBuilder.fields.selectChoice")} />
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
          <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.acceptableAnswers")}</Label>
          <input
            value={answerValue}
            onChange={(event) => {
              const values = toArray(event.target.value)
              onChange({
                ...question,
                correctAnswer: values.length <= 1 ? (values[0] ?? "") : values
              })
            }}
            className={inputClassName}
            placeholder={t("questionBuilder.fields.acceptableAnswersPlaceholder")}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("questionBuilder.fields.explanation")}</Label>
        <textarea
          value={question.explanation ?? ""}
          onChange={(event) => onChange({...question, explanation: event.target.value})}
          className={fieldClassName}
        />
      </div>
    </div>
  )
}
