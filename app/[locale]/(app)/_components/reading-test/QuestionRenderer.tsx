"use client";

import type { ReadingQuestion } from "@/data/reading-test-demo";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type QuestionRendererProps = {
  question: ReadingQuestion;
  value?: string;
  onAnswerChange: (questionId: string, value: string) => void;
};

const TFNG_OPTIONS = ["TRUE", "FALSE", "NOT GIVEN"];

export function QuestionRenderer({ question, value, onAnswerChange }: QuestionRendererProps) {
  if (question.type === "placeholder") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        {question.prompt}
      </div>
    );
  }

  if (question.type === "sentence_completion") {
    return (
      <div className="space-y-2">
        <p className="text-base font-medium leading-relaxed text-foreground">{question.number}. {question.prompt}</p>
        <Input
          aria-label={`Question ${question.number} answer`}
          value={value ?? ""}
          onChange={(event) => onAnswerChange(question.id, event.target.value)}
          placeholder={question.placeholder ?? "Type your answer"}
          className="max-w-sm"
        />
      </div>
    );
  }

  if (question.type === "matching_headings") {
    return (
      <div className="space-y-2">
        <p className="text-base font-medium leading-relaxed text-foreground">{question.number}. {question.prompt}</p>
        <Select value={value ?? ""} onValueChange={(nextValue) => onAnswerChange(question.id, nextValue)}>
          <SelectTrigger aria-label={`Question ${question.number} heading selection`} className="h-10 w-full max-w-[280px]">
            <SelectValue placeholder="Select heading" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (question.type === "multiple_choice") {
    return (
      <fieldset className="space-y-2" aria-label={`Question ${question.number}`}>
        <legend className="text-base font-medium leading-relaxed text-foreground">{question.number}. {question.prompt}</legend>
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label key={option} className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={value === option}
                onChange={(event) => onAnswerChange(question.id, event.target.value)}
                className="mt-0.5 size-4 border-border text-blue-600 focus:ring-blue-500"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset className="space-y-2" aria-label={`Question ${question.number}`}>
      <legend className="text-base font-medium leading-relaxed text-foreground">{question.number}. {question.prompt}</legend>
      <div className="flex flex-wrap gap-4">
        {TFNG_OPTIONS.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={(event) => onAnswerChange(question.id, event.target.value)}
              className="size-4 border-border text-blue-600 focus:ring-blue-500"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
