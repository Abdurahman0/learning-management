"use client";

import { useMemo, useRef, useEffect } from "react";

import type { ReadingQuestion } from "@/data/reading-test-demo";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FormattedInstructionText } from "@/components/test/FormattedInstructionText";

import { QuestionRenderer } from "./QuestionRenderer";

type QuestionsPanelProps = {
  questions: ReadingQuestion[];
  activeQuestionNumber: number;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, value: string) => void;
  onQuestionActivate: (questionNumber: number) => void;
};

type QuestionGroup = {
  title: string;
  instruction?: string;
  questions: ReadingQuestion[];
};

export function QuestionsPanel({
  questions,
  activeQuestionNumber,
  answers,
  onAnswerChange,
  onQuestionActivate
}: QuestionsPanelProps) {
  const questionsScrollRef = useRef<HTMLDivElement | null>(null);
  const questionRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const groupedQuestions = useMemo(() => {
    const groups: QuestionGroup[] = [];

    questions.forEach((question) => {
      const existing = groups.find((group) => group.title === question.groupTitle);
      if (existing) {
        existing.questions.push(question);
      } else {
        groups.push({
          title: question.groupTitle,
          instruction: question.groupInstruction,
          questions: [question]
        });
      }
    });

    return groups;
  }, [questions]);

  useEffect(() => {
    const container = questionsScrollRef.current;
    const questionElement = questionRefs.current.get(activeQuestionNumber);

    if (!container || !questionElement) {
      return;
    }

    const top = questionElement.offsetTop - 88;
    container.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }, [activeQuestionNumber]);

  return (
    <Card className="h-full gap-0 overflow-hidden rounded-xl border-border py-0">
      <div ref={questionsScrollRef} className="h-[calc(100vh-15.5rem)] overflow-y-auto px-6 py-6">
        <div className="space-y-8 pb-28">
          {groupedQuestions.map((group) => {
            const matchingExample = group.questions.find((item) => item.type === "matching_headings" && item.options?.length);

            return (
              <section key={group.title} className="space-y-4">
                <div>
                  <h3 className="text-4xl font-semibold tracking-tight text-slate-900">{group.title}</h3>
                  {group.instruction ? (
                    <p className="mt-1.5 text-lg text-slate-600">
                      <FormattedInstructionText text={group.instruction} />
                    </p>
                  ) : null}
                </div>

                {matchingExample?.options ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-sm font-semibold text-blue-700">List of Headings</p>
                    <ul className="mt-2 space-y-1 text-sm text-foreground">
                      {matchingExample.options.map((heading) => (
                        <li key={heading}>{heading}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="space-y-4">
                  {group.questions.map((question) => {
                    const isActive = question.number === activeQuestionNumber;

                    return (
                      <div
                        key={question.id}
                        id={`q-${question.number}`}
                        ref={(element) => {
                          if (!element) {
                            questionRefs.current.delete(question.number);
                            return;
                          }
                          questionRefs.current.set(question.number, element);
                        }}
                        className="scroll-mt-24"
                      >
                        <article
                          className={`rounded-lg border p-4 transition-colors ${
                            isActive ? "border-blue-600 bg-blue-50/50" : "border-border bg-card"
                          }`}
                          onClick={() => onQuestionActivate(question.number)}
                        >
                          <QuestionRenderer question={question} value={answers[question.id]} onAnswerChange={onAnswerChange} />
                        </article>
                      </div>
                    );
                  })}
                </div>

                <Separator />
              </section>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
