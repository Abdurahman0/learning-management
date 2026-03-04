"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Bookmark,
  Clock3,
  Grid2x2,
  MoveLeft,
  MoveRight,
  Pause,
  Play,
  User,
  Volume2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  getListeningTestById,
  type ListeningBlock,
  type ListeningSectionFull,
} from "@/data/listening-tests-full";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { createAttemptId, loadAttemptProgress, loadLatestAttemptId, saveAttemptProgress, saveAttemptResult } from "@/lib/test-attempt-storage";

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const mm = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const ss = (safe % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function getQuestionNumbersFromBlock(block: ListeningBlock): number[] {
  switch (block.type) {
    case "noteForm":
      return block.fields.map((field) => field.questionNumber);
    case "tableCompletion":
      return block.rows.map((row) => row.questionNumber);
    case "mcqGroup":
      return block.questions.map((question) => question.questionNumber);
    case "matching":
      return block.items.map((item) => item.questionNumber);
    case "diagramLabeling":
      return block.items.map((item) => item.questionNumber);
    case "summaryCompletion":
      return block.lines.map((line) => line.questionNumber);
    default:
      return [];
  }
}

type AnswersMap = Record<number, string>;

function isAnswered(value: string | undefined) {
  return (value ?? "").trim().length > 0;
}

function QuestionChip({
  number,
  active = false,
  subtle = false,
}: {
  number: number;
  active?: boolean;
  subtle?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-semibold",
        active && "bg-blue-600 text-white",
        !active &&
          subtle &&
          "border border-border bg-muted/30 text-muted-foreground",
        !active && !subtle && "border border-blue-200 bg-blue-50 text-blue-700",
      )}
    >
      {number}
    </span>
  );
}

export default function ListeningTestPage() {
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const t = useTranslations("listeningTest");

  const testId = typeof params?.id === "string" ? params.id : "";
  const test = getListeningTestById(testId);

  if (!test) {
    return (
      <div className="mx-auto mt-8 max-w-xl px-4">
        <Card className="gap-3 p-6">
          <h1 className="text-xl font-semibold">{t("notFoundTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("notFoundDesc")}</p>
          <Button asChild className="mt-2 w-fit">
            <Link href={`/${locale}/listening`}>{t("backToListening")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return <ListeningTestClient key={test.id} testId={test.id} />;
}

function ListeningTestClient({ testId }: { testId: string }) {
  const router = useRouter();
  const t = useTranslations("listeningTest");
  const locale = useLocale();
  const test = getListeningTestById(testId)!;
  const paletteTitle = t.has("questionPalette")
    ? t("questionPalette")
    : "Question palette";
  const paletteHint = t.has("questionPaletteHint")
    ? t("questionPaletteHint")
    : "Tap a number to jump to a question.";
  const answeredLabel = t.has("answered")
    ? t("answered")
    : t.has("legendAnswered")
      ? t("legendAnswered")
      : "Answered";
  const notAnsweredLabel = t.has("notAnswered")
    ? t("notAnswered")
    : t.has("legendNotAnswered")
      ? t("legendNotAnswered")
      : "Not answered";
  const markedLabel = t.has("markedForReview")
    ? t("markedForReview")
    : t.has("legendMarked")
      ? t("legendMarked")
      : "Marked for review";
  const allSectionsLabel = t.has("allSections")
    ? t("allSections")
    : "All sections";
  const getJumpToQuestionLabel = (number: number) => {
    if (t.has("jumpToQuestion")) return t("jumpToQuestion", { number });
    if (t.has("goToQuestion")) return t("goToQuestion", { number });
    return `Jump to question ${number}`;
  };

  const [activeSectionId, setActiveSectionId] = useState<
    "s1" | "s2" | "s3" | "s4"
  >("s1");
  const [attemptId, setAttemptId] = useState("");
  const [startedAt, setStartedAt] = useState(Date.now());
  const [finishOpen, setFinishOpen] = useState(false);
  const [activeQuestionNumber, setActiveQuestionNumber] = useState(1);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());

  const [remainingSeconds, setRemainingSeconds] = useState(
    test.durationMinutes * 60,
  );
  const [timerRunning, setTimerRunning] = useState(false);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(37);
  const [audioVolume, setAudioVolume] = useState(72);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isSmallLandscape, setIsSmallLandscape] = useState(false);

  const questionsScrollRef = useRef<HTMLDivElement | null>(null);
  const questionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const pendingJumpRef = useRef<number | null>(null);

  useEffect(() => {
    const latestId = loadLatestAttemptId("listening", test.id);
    const saved = latestId ? loadAttemptProgress("listening", test.id, latestId) : null;

    if (saved) {
      const restoredAnswers: AnswersMap = {};
      Object.entries(saved.answers).forEach(([key, value]) => {
        const num = Number(key.replace(`${test.id}-q`, ""));
        if (Number.isFinite(num) && typeof value === "string") {
          restoredAnswers[num] = value;
        }
      });

      setAttemptId(saved.attemptId);
      setStartedAt(saved.startedAt);
      setAnswers(restoredAnswers);
      setMarked(new Set(saved.markedQuestionIds.map((id) => Number(id.replace(`${test.id}-q`, ""))).filter((v) => Number.isFinite(v))));
      setRemainingSeconds(saved.timeRemainingSec);
      return;
    }

    setAttemptId(createAttemptId());
    setStartedAt(Date.now());
  }, [test.id]);

  const sectionByQuestion = useMemo(() => {
    const map = new Map<number, ListeningSectionFull["id"]>();

    test.sections.forEach((section) => {
      section.blocks.forEach((block) => {
        getQuestionNumbersFromBlock(block).forEach((number) =>
          map.set(number, section.id),
        );
      });
    });

    return map;
  }, [test.sections]);

  const sectionQuestionNumbers = useMemo(() => {
    const map = new Map<ListeningSectionFull["id"], number[]>();

    test.sections.forEach((section) => {
      const numbers = section.blocks.flatMap((block) =>
        getQuestionNumbersFromBlock(block),
      );
      map.set(section.id, numbers);
    });

    return map;
  }, [test.sections]);

  const activeSection = useMemo(
    () =>
      test.sections.find((section) => section.id === activeSectionId) ??
      test.sections[0],
    [activeSectionId, test.sections],
  );

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((value) => isAnswered(value)).length;
  }, [answers]);
  const markedCount = marked.size;
  const notAnsweredCount = test.totalQuestions - answeredCount;
  const unansweredCount = test.totalQuestions - answeredCount;
  const timeSpent = test.durationMinutes * 60 - remainingSeconds;

  useEffect(() => {
    if (!attemptId) return;
    const persistedAnswers = Object.fromEntries(
      Object.entries(answers).map(([number, value]) => [`${test.id}-q${number}`, value])
    );
    saveAttemptProgress({
      attemptId,
      module: "listening",
      testId: test.id,
      answers: persistedAnswers,
      markedQuestionIds: [...marked].map((number) => `${test.id}-q${number}`),
      startedAt,
      timeRemainingSec: remainingSeconds,
      timerUsed: timerRunning || remainingSeconds !== test.durationMinutes * 60,
    });
  }, [answers, attemptId, marked, remainingSeconds, startedAt, test.durationMinutes, test.id, timerRunning]);

  useEffect(() => {
    const compactMedia = window.matchMedia("(max-width: 1024px)");
    const landscapeMedia = window.matchMedia(
      "(orientation: landscape) and (max-height: 500px)",
    );
    const onCompactChange = () => setIsCompact(compactMedia.matches);
    const onLandscapeChange = () => setIsSmallLandscape(landscapeMedia.matches);
    onCompactChange();
    onLandscapeChange();
    compactMedia.addEventListener("change", onCompactChange);
    landscapeMedia.addEventListener("change", onLandscapeChange);
    return () => {
      compactMedia.removeEventListener("change", onCompactChange);
      landscapeMedia.removeEventListener("change", onLandscapeChange);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const describe = (el: Element) => {
      const node = el as HTMLElement;
      const cls =
        node.className && typeof node.className === "string"
          ? `.${node.className.trim().split(/\s+/).slice(0, 3).join(".")}`
          : "";
      return `${node.tagName.toLowerCase()}${cls}`;
    };

    const checkOverflow = () => {
      const root = document.documentElement;
      const pageOverflow = root.scrollWidth - root.clientWidth;
      if (pageOverflow <= 1) return;

      const offenders: string[] = [];
      document.querySelectorAll<HTMLElement>("body *").forEach((el) => {
        if (offenders.length >= 12) return;
        if (el.scrollWidth - el.clientWidth > 1) {
          offenders.push(
            `${describe(el)} (${el.scrollWidth}/${el.clientWidth})`,
          );
        }
      });

      console.warn("[Listening overflow-x detector]", {
        page: `${root.scrollWidth}/${root.clientWidth}`,
        offenders,
      });
    };

    const frame = window.requestAnimationFrame(checkOverflow);
    window.addEventListener("resize", checkOverflow);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [activeSectionId, paletteOpen, isSmallLandscape]);

  useEffect(() => {
    if (!timerRunning || remainingSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timerRunning, remainingSeconds]);

  useEffect(() => {
    questionsScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSectionId]);

  useEffect(() => {
    const pending = pendingJumpRef.current;
    if (!pending) {
      return;
    }

    const target = questionRefs.current.get(pending);
    const container = questionsScrollRef.current;

    if (!target || !container) {
      return;
    }

    const top = Math.max(target.offsetTop - 82, 0);
    container.scrollTo({ top, behavior: "smooth" });
    pendingJumpRef.current = null;
  }, [activeSectionId]);

  const handleSectionChange = (sectionId: string) => {
    const nextSectionId = sectionId as ListeningSectionFull["id"];
    const nextNumbers = sectionQuestionNumbers.get(nextSectionId) ?? [];
    const first = nextNumbers[0] ?? 1;

    setActiveSectionId(nextSectionId);
    setActiveQuestionNumber(first);
  };

  const jumpToQuestion = (questionNumber: number) => {
    const sectionId = sectionByQuestion.get(questionNumber);
    if (!sectionId) {
      return;
    }

    setActiveQuestionNumber(questionNumber);

    if (sectionId !== activeSectionId) {
      pendingJumpRef.current = questionNumber;
      setActiveSectionId(sectionId);
      if (isCompact) {
        setPaletteOpen(false);
      }
      return;
    }

    const target = questionRefs.current.get(questionNumber);
    const container = questionsScrollRef.current;
    if (target && container) {
      const top = Math.max(target.offsetTop - 82, 0);
      container.scrollTo({ top, behavior: "smooth" });
    }
    if (isCompact) {
      setPaletteOpen(false);
    }
  };

  const setAnswer = (number: number, value: string) => {
    setActiveQuestionNumber(number);
    setAnswers((prev) => ({ ...prev, [number]: value }));
  };

  const finishTest = () => {
    if (!attemptId) return;
    const finishedAt = Date.now();
    const persistedAnswers = Object.fromEntries(
      Object.entries(answers).map(([number, value]) => [`${test.id}-q${number}`, value])
    );

    saveAttemptResult({
      attemptId,
      module: "listening",
      testId: test.id,
      answers: persistedAnswers,
      markedQuestionIds: [...marked].map((number) => `${test.id}-q${number}`),
      startedAt,
      finishedAt,
      timeRemainingSec: remainingSeconds,
      timerUsed: timerRunning || remainingSeconds !== test.durationMinutes * 60,
    });

    router.push(`/${locale}/listening/${test.id}/result?attempt=${attemptId}`);
  };

  const renderBlock = (block: ListeningBlock) => {
    if (block.type === "noteForm") {
      return (
        <Card className="min-w-0 gap-0 rounded-lg border border-border bg-muted/20 p-4 overflow-hidden">
          <h4 className="text-center text-base font-semibold tracking-wide">
            {block.title}
          </h4>
          {block.description ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {block.description}
            </p>
          ) : null}
          <div
            className={cn(
              "mt-4 space-y-3",
              isSmallLandscape && "grid grid-cols-2 gap-3 space-y-0",
            )}
          >
            {block.fields.map((field) => (
              <div
                key={field.questionNumber}
                id={`q-${field.questionNumber}`}
                ref={(el) => {
                  if (!el) {
                    questionRefs.current.delete(field.questionNumber);
                    return;
                  }
                  questionRefs.current.set(field.questionNumber, el);
                }}
                className={cn(
                  "grid min-w-0 grid-cols-[32px_minmax(0,1fr)] items-center gap-2 scroll-mt-24 sm:grid-cols-[140px_32px_minmax(0,1fr)]",
                  isSmallLandscape &&
                    "rounded-lg border border-border/60 p-2 grid-cols-[32px_minmax(0,1fr)]",
                )}
              >
                <p
                  className={cn(
                    "col-span-2 break-words text-sm text-foreground sm:col-span-1",
                    isSmallLandscape && "col-span-2 sm:col-span-2",
                  )}
                >
                  {field.label}
                </p>
                <QuestionChip
                  number={field.questionNumber}
                  active={activeQuestionNumber === field.questionNumber}
                />
                <Input
                  aria-label={`Question ${field.questionNumber}`}
                  value={answers[field.questionNumber] ?? ""}
                  onChange={(e) =>
                    setAnswer(field.questionNumber, e.target.value)
                  }
                  onFocus={() => setActiveQuestionNumber(field.questionNumber)}
                  placeholder={field.placeholder ?? "..."}
                  className={cn(
                    "w-full min-w-0 h-10",
                    isSmallLandscape && "h-11",
                  )}
                />
              </div>
            ))}
          </div>
        </Card>
      );
    }

    if (block.type === "tableCompletion") {
      return (
        <Card className="min-w-0 gap-0 rounded-lg border border-border bg-card p-0 overflow-hidden">
          <h4 className="border-b border-border px-4 py-3 text-sm font-semibold">
            {block.title}
          </h4>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <thead className="bg-muted/30">
                <tr>
                  {block.columns.map((col) => (
                    <th
                      key={col}
                      className="border-b border-border px-3 py-2 text-left font-medium"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr
                    key={row.questionNumber}
                    id={`q-${row.questionNumber}`}
                    ref={(el) => {
                      if (!el) {
                        questionRefs.current.delete(row.questionNumber);
                        return;
                      }
                      questionRefs.current.set(row.questionNumber, el);
                    }}
                    className="scroll-mt-24"
                  >
                    <td className="border-b border-border px-3 py-2 break-words">
                      {row.values[0]}
                    </td>
                    <td className="border-b border-border px-3 py-2 break-words">
                      {row.values[1]}
                    </td>
                    <td className="border-b border-border px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <QuestionChip
                          number={row.questionNumber}
                          active={activeQuestionNumber === row.questionNumber}
                        />
                        <Input
                          aria-label={`Question ${row.questionNumber}`}
                          value={answers[row.questionNumber] ?? ""}
                          onChange={(e) =>
                            setAnswer(row.questionNumber, e.target.value)
                          }
                          onFocus={() =>
                            setActiveQuestionNumber(row.questionNumber)
                          }
                          placeholder="..."
                          className={cn(
                            "w-full min-w-0 h-10",
                            isSmallLandscape && "h-11",
                          )}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      );
    }

    if (block.type === "mcqGroup") {
      return (
        <div className="space-y-3">
          {block.title ? (
            <p className="text-sm font-medium text-muted-foreground">
              {block.title}
            </p>
          ) : null}
          {block.questions.map((question) => (
            <article
              key={question.questionNumber}
              id={`q-${question.questionNumber}`}
              ref={(el) => {
                if (!el) {
                  questionRefs.current.delete(question.questionNumber);
                  return;
                }
                questionRefs.current.set(question.questionNumber, el);
              }}
              className="min-w-0 rounded-lg border border-border bg-card p-4 scroll-mt-24 overflow-hidden"
              onClick={() => setActiveQuestionNumber(question.questionNumber)}
            >
              <p className="break-words text-sm font-medium">
                <span className="mr-2 inline-flex align-middle">
                  <QuestionChip
                    number={question.questionNumber}
                    active={activeQuestionNumber === question.questionNumber}
                  />
                </span>
                {question.prompt}
              </p>
              <div className="mt-2 space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className="flex min-w-0 items-start gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={`q-${question.questionNumber}`}
                      value={option}
                      checked={answers[question.questionNumber] === option}
                      onChange={(e) =>
                        setAnswer(question.questionNumber, e.target.value)
                      }
                      onFocus={() =>
                        setActiveQuestionNumber(question.questionNumber)
                      }
                      className="mt-0.5"
                    />
                    <span className="break-words">{option}</span>
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (block.type === "matching") {
      return (
        <Card className="min-w-0 gap-0 rounded-lg border border-border bg-card p-4 overflow-hidden">
          <h4 className="text-sm font-semibold">{block.title}</h4>
          <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <p className="font-medium">{t("options")}</p>
            <ul className="mt-1 space-y-1">
              {block.options.map((option) => (
                <li key={option} className="break-words">
                  {option}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-3">
            {block.items.map((item) => (
              <div
                key={item.questionNumber}
                id={`q-${item.questionNumber}`}
                ref={(el) => {
                  if (!el) {
                    questionRefs.current.delete(item.questionNumber);
                    return;
                  }
                  questionRefs.current.set(item.questionNumber, el);
                }}
                className={cn(
                  "grid min-w-0 grid-cols-1 items-center gap-2 scroll-mt-24",
                  !isSmallLandscape &&
                    "md:grid-cols-[32px_minmax(0,1fr)_minmax(0,220px)]",
                )}
                onClick={() => setActiveQuestionNumber(item.questionNumber)}
              >
                <div className="flex items-center gap-2 md:contents">
                  <QuestionChip
                    number={item.questionNumber}
                    active={activeQuestionNumber === item.questionNumber}
                  />
                  <p className="break-words text-sm">{item.prompt}</p>
                </div>
                <Select
                  value={answers[item.questionNumber] ?? ""}
                  onValueChange={(value) =>
                    setAnswer(item.questionNumber, value)
                  }
                >
                  <SelectTrigger
                    aria-label={`Question ${item.questionNumber}`}
                    onFocus={() => setActiveQuestionNumber(item.questionNumber)}
                    className={cn(
                      "w-full h-10",
                      isSmallLandscape && "h-11",
                      !isSmallLandscape && "md:max-w-[220px]",
                    )}
                  >
                    <SelectValue placeholder={t("selectOption")} />
                  </SelectTrigger>
                  <SelectContent>
                    {block.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    if (block.type === "diagramLabeling") {
      return (
        <Card className="min-w-0 gap-0 rounded-lg border border-border bg-card p-4 overflow-hidden">
          <h4 className="text-sm font-semibold">{block.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {block.description}
          </p>
          <div
            className={cn(
              "mt-3 grid gap-3",
              !isSmallLandscape && "md:grid-cols-[minmax(0,1fr)_240px]",
            )}
          >
            <div className="relative min-h-[220px] min-w-0 overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 p-3">
              <p className="text-[10px] tracking-wider text-muted-foreground uppercase">
                Diagram Placeholder
              </p>
              {block.items.map((item, idx) => {
                const positions = [
                  "top-10 left-18",
                  "top-24 left-35",
                  "bottom-10 left-14",
                  "top-8 right-8",
                  "bottom-16 right-16",
                  "top-30 right-30",
                ];
                const cls = positions[idx] ?? "top-12 left-12";
                return (
                  <span
                    key={item.questionNumber}
                    className={cn(
                      "absolute rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white",
                      cls,
                    )}
                  >
                    {item.questionNumber}
                  </span>
                );
              })}
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                <p className="font-medium">{t("options")}</p>
                <ul className="mt-1 space-y-1">
                  {block.options.map((option) => (
                    <li key={option} className="break-words">
                      {option}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                {block.items.map((item) => (
                  <div
                    key={item.questionNumber}
                    id={`q-${item.questionNumber}`}
                    ref={(el) => {
                      if (!el) {
                        questionRefs.current.delete(item.questionNumber);
                        return;
                      }
                      questionRefs.current.set(item.questionNumber, el);
                    }}
                    className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-2 scroll-mt-24"
                    onClick={() => setActiveQuestionNumber(item.questionNumber)}
                  >
                    <QuestionChip
                      number={item.questionNumber}
                      active={activeQuestionNumber === item.questionNumber}
                    />
                    <Input
                      aria-label={`Question ${item.questionNumber}`}
                      value={answers[item.questionNumber] ?? ""}
                      onChange={(e) =>
                        setAnswer(item.questionNumber, e.target.value)
                      }
                      onFocus={() =>
                        setActiveQuestionNumber(item.questionNumber)
                      }
                      placeholder={item.label}
                      className={cn(
                        "w-full min-w-0 h-10",
                        isSmallLandscape && "h-11",
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="min-w-0 gap-0 rounded-lg border border-border bg-muted/20 p-4 overflow-hidden">
        <h4 className="text-base font-semibold">{block.title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          {block.instruction}
        </p>
        <div className="mt-3 space-y-3 text-sm leading-7">
          {block.lines.map((line) => (
            <div
              key={line.questionNumber}
              id={`q-${line.questionNumber}`}
              ref={(el) => {
                if (!el) {
                  questionRefs.current.delete(line.questionNumber);
                  return;
                }
                questionRefs.current.set(line.questionNumber, el);
              }}
              className="flex flex-wrap items-center gap-2 scroll-mt-24"
              onClick={() => setActiveQuestionNumber(line.questionNumber)}
            >
              <span className="break-words">{line.before}</span>
              <QuestionChip
                number={line.questionNumber}
                active={activeQuestionNumber === line.questionNumber}
              />
              <Input
                aria-label={`Question ${line.questionNumber}`}
                value={answers[line.questionNumber] ?? ""}
                onChange={(e) => setAnswer(line.questionNumber, e.target.value)}
                onFocus={() => setActiveQuestionNumber(line.questionNumber)}
                placeholder="..."
                className={cn(
                  "w-full min-w-0 h-10 sm:w-44",
                  isSmallLandscape && "h-11",
                )}
              />
              <span className="break-words">{line.after}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <section className="mx-0 my-0 flex h-[calc(100vh-2rem)] w-full max-w-full flex-col overflow-x-hidden overflow-y-hidden bg-background lg:-mx-10 lg:-my-8">
      <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden border-b border-border bg-background/95 backdrop-blur">
        <div
          className={cn(
            "flex h-14 w-full min-w-0 max-w-full items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4 lg:px-8",
            isSmallLandscape && "h-12 gap-1 px-2",
          )}
        >
          <div className="flex flex-1 min-w-0 items-center gap-1.5 sm:gap-3">
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm",
                isSmallLandscape ? "size-7" : "size-8",
              )}
            >
              <BookOpen className="size-4.5" aria-hidden="true" />
            </span>
            <p
              className={cn(
                "min-w-0 text-sm font-semibold sm:text-lg leading-tight",
                isSmallLandscape && "text-xs",
                "max-[420px]:text-[11px]",
              )}
            >
              IELTS <span className="max-[420px]:block">MASTER</span>
            </p>
            <Separator orientation="vertical" className="hidden h-5 md:block" />
            <p
              className={cn(
                "hidden text-sm text-muted-foreground md:block",
                isSmallLandscape && "hidden",
              )}
            >
              {t("title")}
            </p>
          </div>

          <div className="shrink-0 min-w-0 flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "h-9 max-w-[120px] shrink-0 rounded-xl px-2 sm:px-3 text-sm font-semibold text-blue-700",
                isSmallLandscape && "h-8 px-1.5 text-xs",
              )}
            >
              <Clock3 className="size-4" />
              <span className="truncate">{formatTime(remainingSeconds)}</span>
            </Badge>
            <Button
              type="button"
              aria-label={timerRunning ? t("stopTimer") : t("startTimer")}
              variant={timerRunning ? "outline" : "default"}
              className={cn(
                "h-9 shrink-0 rounded-xl px-2 sm:px-4",
                isSmallLandscape && "h-8 px-2",
              )}
              onClick={() => {
                if (!timerRunning && remainingSeconds <= 0) {
                  setRemainingSeconds(test.durationMinutes * 60);
                }
                setTimerRunning((prev) => !prev);
              }}
            >
              {timerRunning ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              <span className="hidden sm:inline">
                {timerRunning ? t("stop") : t("start")}
              </span>
            </Button>
          </div>

          <div className="shrink-0 min-w-0 flex items-center gap-1 sm:gap-3">
            <p className="hidden text-right text-sm font-semibold text-slate-800 lg:block">
              <span className="block text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                {t("progress")}
              </span>
              {answeredCount} / {test.totalQuestions} {t("questions")}
            </p>
            <Button
              className={cn(
                "h-9 shrink-0 rounded-xl bg-blue-600 px-2 text-sm font-semibold hover:bg-blue-600/90 sm:px-4",
                isSmallLandscape && "h-8 px-2 text-xs",
              )}
              aria-label={t("finishTest")}
              onClick={() => setFinishOpen(true)}
            >
              {t("finishTest")}
            </Button>
            <Avatar aria-label={t("userAvatar")} className="hidden sm:flex">
              <AvatarFallback className="bg-amber-100 text-amber-700">
                <User className="size-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "sticky top-14 z-30 border-b border-border bg-background/95 px-3 py-2 backdrop-blur sm:top-16 sm:px-4 lg:px-8",
          isSmallLandscape && "top-12 py-1.5 px-2",
        )}
      >
        <div className="grid w-full min-w-0 max-w-full grid-cols-[36px_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full shrink-0",
              isSmallLandscape && "h-8 w-8",
            )}
            onClick={() => setAudioPlaying((prev) => !prev)}
            aria-label={audioPlaying ? t("pauseAudio") : t("playAudio")}
          >
            {audioPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>

          <div className="w-full min-w-0 max-w-full overflow-hidden">
            <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <p className="min-w-0 truncate">
                {activeSection.audioMeta.nowPlayingLabel} -{" "}
                {activeSection.audioMeta.currentTrackTitle}
              </p>
              <p className={cn("shrink-0", isSmallLandscape && "text-[10px]")}>
                30:00
              </p>
            </div>
            <div
              className={cn(
                "grid w-full min-w-0 grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_120px] sm:gap-3",
                isSmallLandscape && "sm:grid-cols-[minmax(0,1fr)_96px] gap-1",
              )}
            >
              <input
                type="range"
                min={0}
                max={100}
                value={audioProgress}
                onChange={(e) => setAudioProgress(Number(e.target.value))}
                aria-label={t("audioProgress")}
                className="h-1.5 w-full min-w-0"
              />
              <div className="flex w-full min-w-0 items-center gap-2 overflow-hidden">
                <Volume2 className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(Number(e.target.value))}
                  aria-label={t("audioVolume")}
                  className="h-1.5 w-full min-w-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 px-2 py-2 sm:px-3 sm:py-3 lg:grid-cols-[minmax(0,1fr)_292px] lg:gap-4 lg:px-5 lg:py-4">
        <section className="min-h-0 min-w-0">
          <Card className="h-full min-h-0 gap-0 overflow-hidden py-0">
            <div className="border-b border-border px-3 py-2">
              {isSmallLandscape ? (
                <Select
                  value={activeSectionId}
                  onValueChange={handleSectionChange}
                >
                  <SelectTrigger
                    className="h-9 w-full min-w-0"
                    aria-label={t("sectionTab", {
                      index: Number(activeSectionId.slice(1)),
                    })}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {test.sections.map((section, index) => (
                      <SelectItem key={section.id} value={section.id}>
                        {t("sectionTab", { index: index + 1 })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Tabs
                  value={activeSectionId}
                  onValueChange={handleSectionChange}
                >
                  <div className="w-full min-w-0 overflow-x-auto [scrollbar-width:none]">
                    <TabsList className="inline-flex h-11 w-max min-w-full flex-nowrap whitespace-nowrap">
                      {test.sections.map((section, index) => (
                        <TabsTrigger
                          key={section.id}
                          value={section.id}
                          className="inline-flex h-11 shrink-0 px-4"
                          aria-label={section.title}
                        >
                          {t("sectionTab", { index: index + 1 })}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </Tabs>
              )}
            </div>

            <div
              ref={questionsScrollRef}
              className={cn(
                "h-[calc(100vh-14.6rem)] min-w-0 overflow-y-auto px-3 py-3 sm:h-[calc(100vh-15.2rem)] sm:px-4 sm:py-4 lg:h-[calc(100vh-16.8rem)] lg:px-5",
                isSmallLandscape && "h-[calc(100vh-11.2rem)] py-2",
              )}
            >
              <div
                className={cn(
                  "space-y-4 pb-28 lg:pb-10",
                  isSmallLandscape && "pb-24",
                )}
              >
                <div>
                  <h2 className="break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    {activeSection.title}
                  </h2>
                  <p className="mt-1 break-words text-sm font-medium text-muted-foreground">
                    {activeSection.questionRangeLabel}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm break-words">
                  {activeSection.instructions}
                </div>

                {activeSection.blocks.map((block, index) => (
                  <div key={`${activeSection.id}-${block.type}-${index}`}>
                    {renderBlock(block)}
                  </div>
                ))}
              </div>
            </div>

            <div
              className={cn(
                "sticky bottom-0 z-20 border-t border-border bg-background/95 px-3 py-3 backdrop-blur sm:px-4",
                isSmallLandscape && "py-2",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={t("previousSection")}
                  disabled={activeSection.id === "s1"}
                  onClick={() => {
                    const current = Number(activeSection.id.slice(1));
                    const next = Math.max(1, current - 1) as 1 | 2 | 3 | 4;
                    handleSectionChange(`s${next}`);
                  }}
                >
                  <MoveLeft className="size-4" />
                  {t("previousSection")}
                </Button>

                <Toggle
                  aria-label={t("markForReview")}
                  variant="outline"
                  pressed={marked.has(activeQuestionNumber)}
                  onPressedChange={(next) => {
                    setMarked((prev) => {
                      const copy = new Set(prev);
                      if (next) {
                        copy.add(activeQuestionNumber);
                      } else {
                        copy.delete(activeQuestionNumber);
                      }
                      return copy;
                    });
                  }}
                >
                  <Bookmark className="size-4" />
                  {t("markForReview")}
                </Toggle>

                <Button
                  type="button"
                  variant="secondary"
                  aria-label={paletteTitle}
                  className={cn(
                    "order-4 w-full sm:order-3 sm:w-auto lg:hidden",
                    isSmallLandscape && "sm:order-4 sm:w-full",
                  )}
                  onClick={() => setPaletteOpen(true)}
                >
                  <Grid2x2 className="size-4" />
                  {paletteTitle}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  aria-label={t("nextSection")}
                  disabled={activeSection.id === "s4"}
                  onClick={() => {
                    const current = Number(activeSection.id.slice(1));
                    const next = Math.min(4, current + 1) as 1 | 2 | 3 | 4;
                    handleSectionChange(`s${next}`);
                  }}
                  className="text-blue-700 hover:text-blue-700"
                >
                  {t("nextSection")}
                  <MoveRight className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        </section>

        <aside className="hidden min-w-0 lg:block">
          <Card className="sticky top-[8.1rem] gap-0 rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{paletteTitle}</h3>
              <Badge
                variant="outline"
                className="h-6 rounded-full px-2 text-[11px]"
              >
                {allSectionsLabel}
              </Badge>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 40 }, (_, i) => i + 1).map((number) => {
                const sectionId = sectionByQuestion.get(number);
                const answered = isAnswered(answers[number]);
                const isMarked = marked.has(number);
                const isCurrentSection = sectionId === activeSectionId;

                return (
                  <Button
                    key={number}
                    type="button"
                    variant="outline"
                    aria-label={getJumpToQuestionLabel(number)}
                    onClick={() => jumpToQuestion(number)}
                    className={cn(
                      "relative h-9 rounded-xl px-0 text-xs font-semibold shadow-none",
                      activeQuestionNumber === number &&
                        "border-blue-700 bg-blue-600 text-white hover:bg-blue-600",
                      activeQuestionNumber !== number &&
                        answered &&
                        "border-blue-300 bg-blue-50 text-blue-700",
                      activeQuestionNumber !== number &&
                        !answered &&
                        "border-slate-200 bg-slate-50 text-slate-700",
                      isMarked &&
                        "border-amber-300 ring-2 ring-amber-300/60 ring-offset-1",
                      isCurrentSection && "shadow-sm",
                    )}
                  >
                    {number}
                    {isMarked ? (
                      <span
                        className="absolute right-1 top-1 size-1.5 rounded-full bg-amber-500"
                        aria-hidden="true"
                      />
                    ) : null}
                  </Button>
                );
              })}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full bg-blue-600" />{" "}
                  {answeredLabel}
                </span>
                <span className="font-medium text-foreground">
                  {answeredCount}
                </span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full border border-border" />{" "}
                  {notAnsweredLabel}
                </span>
                <span className="font-medium text-foreground">
                  {notAnsweredCount}
                </span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full bg-amber-500" />{" "}
                  {markedLabel}
                </span>
                <span className="font-medium text-foreground">
                  {markedCount}
                </span>
              </p>
            </div>
          </Card>
        </aside>
      </main>

      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent
          side={isCompact ? "bottom" : "right"}
          className={cn(
            "p-0 max-w-[100vw] overflow-x-hidden",
            isCompact
              ? "w-[92vw] max-w-[92vw] rounded-t-2xl mx-auto"
              : "sm:max-w-md",
          )}
        >
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle>{paletteTitle}</SheetTitle>
            <SheetDescription>{paletteHint}</SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-9rem)] px-5 pb-6 md:h-[calc(100vh-8rem)]">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 40 }, (_, i) => i + 1).map((number) => {
                  const sectionId = sectionByQuestion.get(number);
                  const answered = isAnswered(answers[number]);
                  const isMarked = marked.has(number);
                  const isCurrentSection = sectionId === activeSectionId;

                  return (
                    <Button
                      key={number}
                      type="button"
                      variant="outline"
                      aria-label={getJumpToQuestionLabel(number)}
                      onClick={() => jumpToQuestion(number)}
                      className={cn(
                        "relative h-9 rounded-xl px-0 text-xs font-semibold shadow-none",
                        activeQuestionNumber === number &&
                          "border-blue-700 bg-blue-600 text-white hover:bg-blue-600",
                        activeQuestionNumber !== number &&
                          answered &&
                          "border-blue-300 bg-blue-50 text-blue-700",
                        activeQuestionNumber !== number &&
                          !answered &&
                          "border-slate-200 bg-slate-50 text-slate-700",
                        isMarked &&
                          "border-amber-300 ring-2 ring-amber-300/60 ring-offset-1",
                        isCurrentSection && "shadow-sm",
                      )}
                    >
                      {number}
                      {isMarked ? (
                        <span
                          className="absolute right-1 top-1 size-1.5 rounded-full bg-amber-500"
                          aria-hidden="true"
                        />
                      ) : null}
                    </Button>
                  );
                })}
              </div>

              <Separator className="my-2" />

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-blue-600" />{" "}
                    {answeredLabel}
                  </span>
                  <span className="font-medium text-foreground">
                    {answeredCount}
                  </span>
                </p>
                <p className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full border border-border" />{" "}
                    {notAnsweredLabel}
                  </span>
                  <span className="font-medium text-foreground">
                    {notAnsweredCount}
                  </span>
                </p>
                <p className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-amber-500" />{" "}
                    {markedLabel}
                  </span>
                  <span className="font-medium text-foreground">
                    {markedCount}
                  </span>
                </p>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {finishOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <h3 className="text-lg font-semibold">{t("finishTest")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("finishSummary", { answered: answeredCount, total: test.totalQuestions, unanswered: unansweredCount })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("timeSpent", { seconds: timeSpent })}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setFinishOpen(false)}>{t("cancel")}</Button>
              <Button onClick={finishTest}>{t("confirmFinish")}</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
