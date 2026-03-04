"use client";

import { useMemo, useState } from "react";
import { Clock3, GraduationCap, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { READING_TEST_DEMO } from "@/data/reading-test-demo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { BottomControls } from "./BottomControls";
import { PassageTabs } from "./PassageTabs";
import { QuestionPaletteSheet } from "./QuestionPaletteSheet";
import { QuestionsPanel } from "./QuestionsPanel";

const TOTAL_QUESTIONS = 40;

const LIGHT_MODE_STYLE: React.CSSProperties = {
  ["--background" as string]: "oklch(0.98 0.005 270)",
  ["--foreground" as string]: "oklch(0.205 0.02 257)",
  ["--card" as string]: "oklch(1 0 0)",
  ["--card-foreground" as string]: "oklch(0.205 0.02 257)",
  ["--popover" as string]: "oklch(1 0 0)",
  ["--popover-foreground" as string]: "oklch(0.205 0.02 257)",
  ["--secondary" as string]: "oklch(0.96 0.01 260)",
  ["--secondary-foreground" as string]: "oklch(0.31 0.03 257)",
  ["--muted" as string]: "oklch(0.96 0.01 260)",
  ["--muted-foreground" as string]: "oklch(0.52 0.02 257)",
  ["--accent" as string]: "oklch(0.95 0.01 260)",
  ["--accent-foreground" as string]: "oklch(0.23 0.03 257)",
  ["--border" as string]: "oklch(0.9 0.01 260)",
  ["--input" as string]: "oklch(0.9 0.01 260)",
  colorScheme: "light"
};

export function ReadingTestShell() {
  const t = useTranslations("readingTest");

  const [activePassageId, setActivePassageId] = useState<"p1" | "p2" | "p3">("p1");
  const [activeQuestionNumber, setActiveQuestionNumber] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [paletteOpen, setPaletteOpen] = useState(false);

  const questionByNumber = useMemo(() => {
    return new Map(READING_TEST_DEMO.questions.map((question) => [question.number, question]));
  }, []);

  const questionsForPassage = useMemo(() => {
    return READING_TEST_DEMO.questions.filter((question) => question.passageId === activePassageId);
  }, [activePassageId]);

  const answeredQuestionNumbers = useMemo(() => {
    const answered = new Set<number>();

    READING_TEST_DEMO.questions.forEach((question) => {
      if ((answers[question.id] ?? "").trim().length > 0) {
        answered.add(question.number);
      }
    });

    return answered;
  }, [answers]);

  const answeredCount = answeredQuestionNumbers.size;
  const currentQuestion = questionByNumber.get(activeQuestionNumber);

  const goToQuestion = (questionNumber: number) => {
    const target = questionByNumber.get(questionNumber);
    if (!target) {
      return;
    }

    setActivePassageId(target.passageId);
    setActiveQuestionNumber(questionNumber);
  };

  const handlePassageChange = (passageId: "p1" | "p2" | "p3") => {
    setActivePassageId(passageId);

    const activeQuestion = questionByNumber.get(activeQuestionNumber);
    if (activeQuestion?.passageId === passageId) {
      return;
    }

    const firstInPassage = READING_TEST_DEMO.questions.find((question) => question.passageId === passageId);
    if (firstInPassage) {
      setActiveQuestionNumber(firstInPassage.number);
    }
  };

  return (
    <section style={LIGHT_MODE_STYLE} className="-mx-4 -my-4 flex h-[calc(100vh-2rem)] flex-col overflow-hidden bg-background text-foreground sm:-mx-5 lg:-mx-10 lg:-my-8">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-18 items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <GraduationCap className="size-4.5" aria-hidden="true" />
            </span>
            <p className="text-xl font-semibold tracking-tight text-foreground">IELTS MASTER</p>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <p className="text-base font-medium text-slate-700">{t("title")}</p>
          </div>

          <Badge variant="secondary" className="h-10 rounded-xl px-4 text-2xl font-bold text-blue-700">
            <Clock3 className="size-4" aria-hidden="true" />
            {READING_TEST_DEMO.timer}
          </Badge>

          <div className="flex items-center gap-4">
            <p className="text-right text-sm font-semibold text-slate-800">
              <span className="block text-xs tracking-[0.16em] text-slate-500 uppercase">{t("progress")}</span>
              {answeredCount} / {TOTAL_QUESTIONS} {t("questions")}
            </p>

            <Button aria-label={t("finishTest")} className="h-11 rounded-xl bg-blue-600 px-6 text-base font-semibold hover:bg-blue-600/90">
              {t("finishTest")}
            </Button>

            <Avatar aria-label={t("userAvatar")} size="lg">
              <AvatarFallback className="bg-amber-100 text-amber-800">
                <User className="size-4" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)]">
        <div className="min-h-0 border-r border-border px-4 py-4 lg:px-5">
          <PassageTabs passages={READING_TEST_DEMO.passages} activePassageId={activePassageId} onPassageChange={handlePassageChange} />
        </div>

        <div className="min-h-0 px-4 py-4 lg:px-5">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
            <QuestionsPanel
              questions={questionsForPassage}
              activeQuestionNumber={activeQuestionNumber}
              answers={answers}
              onAnswerChange={(questionId, value) => setAnswers((prev) => ({ ...prev, [questionId]: value }))}
              onQuestionActivate={(number) => setActiveQuestionNumber(number)}
            />

            <BottomControls
              canGoPrev={activeQuestionNumber > 1}
              canGoNext={activeQuestionNumber < TOTAL_QUESTIONS}
              isMarked={markedQuestions.has(activeQuestionNumber)}
              onPrev={() => goToQuestion(Math.max(1, activeQuestionNumber - 1))}
              onNext={() => goToQuestion(Math.min(TOTAL_QUESTIONS, activeQuestionNumber + 1))}
              onMarkedChange={(next) => {
                setMarkedQuestions((prev) => {
                  const copy = new Set(prev);
                  if (next) {
                    copy.add(activeQuestionNumber);
                  } else {
                    copy.delete(activeQuestionNumber);
                  }
                  return copy;
                });
              }}
              onPaletteOpen={() => setPaletteOpen(true)}
              activeQuestionNumber={activeQuestionNumber}
              totalQuestions={TOTAL_QUESTIONS}
              markLabel={t("markForReview")}
              previousLabel={t("previous")}
              nextLabel={t("next")}
              paletteLabel={t("questionPalette")}
            />
          </div>
        </div>
      </main>

      <QuestionPaletteSheet
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        activeQuestionNumber={activeQuestionNumber}
        answeredQuestionNumbers={answeredQuestionNumbers}
        markedQuestionNumbers={markedQuestions}
        onQuestionSelect={goToQuestion}
        title={t("questionPalette")}
        description={t("questionPaletteHint")}
      />

      <div className={cn("sr-only")}>{currentQuestion?.id}</div>
    </section>
  );
}
