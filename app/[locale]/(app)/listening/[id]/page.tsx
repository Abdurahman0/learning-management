"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Clock3,
  Grid2x2,
  Maximize2,
  Menu,
  Minimize2,
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
import { createAttemptId, loadAttemptProgress, loadLatestAttemptId, saveAttemptProgress, saveAttemptResult, type AttemptMode } from "@/lib/test-attempt-storage";
import { getListeningAnswerMeta } from "@/data/listening-answer-keys";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { flattenListeningQuestions } from "@/lib/listening-questions";
import { Highlightable } from "@/components/test/Highlightable";
import { FormattedInstructionText } from "@/components/test/FormattedInstructionText";
import { useTestLeaveWarning } from "@/lib/use-test-leave-warning";
import { useTestAppearance } from "@/lib/test-appearance";
import { TestOptionsSheet } from "@/components/test/TestOptionsSheet";
import { ListeningQuestionAnalysisPanel } from "./result/_components/ListeningQuestionAnalysisPanel";
import { ListeningTranscriptReviewPanel, type ListeningReviewSection } from "./result/_components/ListeningTranscriptReviewPanel";

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
        "test-chip inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-semibold",
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
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("listeningTest");

  const testId = typeof params?.id === "string" ? params.id : "";
  const modeParam = searchParams.get("mode");
  const requestedMode: AttemptMode | null =
    modeParam === "real" || modeParam === "practice" ? modeParam : null;
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

  return <ListeningTestClient key={test.id} testId={test.id} requestedMode={requestedMode} />;
}

function ListeningTestClient({ testId, requestedMode = null }: { testId: string; requestedMode?: AttemptMode | null }) {
  const searchParams = useSearchParams();
  const t = useTranslations("listeningTest");
  const tListeningResult = useTranslations("listeningResult");
  const tOptions = useTranslations("testOptions");
  const locale = useLocale();
  const test = getListeningTestById(testId)!;
  const restartRequested = searchParams.get("restart") === "1";
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
  const getJumpToQuestionLabel = (number: number) => {
    if (t.has("jumpToQuestion")) return t("jumpToQuestion", { number });
    if (t.has("goToQuestion")) return t("goToQuestion", { number });
    return `Jump to question ${number}`;
  };

  const [activeSectionId, setActiveSectionId] = useState<
    "s1" | "s2" | "s3" | "s4"
  >("s1");
  const [attemptId, setAttemptId] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [finishOpen, setFinishOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [expandedReviewQuestions, setExpandedReviewQuestions] = useState<Set<string>>(new Set());
  const [highlightedEvidenceQuestionId, setHighlightedEvidenceQuestionId] = useState<string | null>(null);
  const [reviewMobilePanel, setReviewMobilePanel] = useState<"transcript" | "questions">("transcript");
  const [activeQuestionNumber, setActiveQuestionNumber] = useState(1);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());

  const [remainingSeconds, setRemainingSeconds] = useState(
    test.durationMinutes * 60,
  );
  const [timerRunning, setTimerRunning] = useState(false);
  const [attemptMode, setAttemptMode] = useState<AttemptMode | null>(null);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(37);
  const [audioVolume, setAudioVolume] = useState(72);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isSmallLandscape, setIsSmallLandscape] = useState(false);
  const [realModeConfirmOpen, setRealModeConfirmOpen] = useState(false);
  const [realModeStarting, setRealModeStarting] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const {
    appearance,
    setContrast,
    setTextSize,
    isFullscreen,
    toggleFullscreen,
  } = useTestAppearance("test-taking");

  const questionsScrollRef = useRef<HTMLDivElement | null>(null);
  const questionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const pendingJumpRef = useRef<number | null>(null);
  const realModeAutoFinishedRef = useRef(false);
  const initDoneRef = useRef(false);
  const realModeStartTimeoutRef = useRef<number | null>(null);
  const leaveWarningMessage = t.has("leaveWarning")
    ? t("leaveWarning")
    : "Are you sure you want to quit this test? Your results will not be saved.";
  const realModeTitle = t.has("realMode")
    ? t("realMode")
    : "Real mode";
  const realModeLockedTimerLabel = t.has("realModeTimerLocked")
    ? t("realModeTimerLocked")
    : "Timer is locked in real mode";
  const realModeLockedAudioLabel = t.has("realModeAudioLocked")
    ? t("realModeAudioLocked")
    : "Audio controls are locked in real mode";
  const realModeProgressLockedLabel = t.has("realModeProgressLocked")
    ? t("realModeProgressLocked")
    : "Audio progress is locked in real mode";
  const realModeCountdownLabel = t.has("realModeStartsSoon")
    ? t("realModeStartsSoon")
    : "Audio starts in 1 second...";

  useTestLeaveWarning({
    enabled: Boolean(attemptId) && !reviewMode,
    message: leaveWarningMessage,
  });

  const resetAttemptState = (nextMode: AttemptMode | null = null) => {
    if (realModeStartTimeoutRef.current) {
      window.clearTimeout(realModeStartTimeoutRef.current);
      realModeStartTimeoutRef.current = null;
    }

    const freshAttemptId = createAttemptId();
    setAttemptId(freshAttemptId);
    setStartedAt(Date.now());
    setAttemptMode(nextMode);
    setFinishOpen(false);
    setReviewMode(false);
    setExpandedReviewQuestions(new Set());
    setHighlightedEvidenceQuestionId(null);
    setReviewMobilePanel("transcript");
    setActiveSectionId("s1");
    setActiveQuestionNumber(1);
    setAnswers({});
    setMarked(new Set());
    setRemainingSeconds(test.durationMinutes * 60);
    setTimerRunning(false);
    setAudioPlaying(false);
    setAudioProgress(37);
    setPaletteOpen(false);
    setRealModeStarting(false);
    setRealModeConfirmOpen(nextMode === "real");
    realModeAutoFinishedRef.current = false;
    pendingJumpRef.current = null;
  };

  const clearAttemptQueryParams = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("restart");
    url.searchParams.delete("mode");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  };

  useEffect(() => {
    if (initDoneRef.current) {
      return;
    }
    initDoneRef.current = true;

    if (restartRequested || requestedMode) {
      const mode = requestedMode ?? null;
      const resetTimer = window.setTimeout(() => {
        resetAttemptState(mode);
      }, 0);
      clearAttemptQueryParams();
      return () => window.clearTimeout(resetTimer);
    }

    const latestId = loadLatestAttemptId("listening", test.id);
    const saved = latestId ? loadAttemptProgress("listening", test.id, latestId) : null;

    if (saved) {
      const restoredMode = saved.mode ?? "practice";
      const restoredAnswers: AnswersMap = {};
      Object.entries(saved.answers).forEach(([key, value]) => {
        const num = Number(key.replace(`${test.id}-q`, ""));
        if (Number.isFinite(num) && typeof value === "string") {
          restoredAnswers[num] = value;
        }
      });

      const hydrateTimer = window.setTimeout(() => {
        setAttemptId(saved.attemptId);
        setStartedAt(saved.startedAt);
        setAnswers(restoredAnswers);
        setMarked(new Set(saved.markedQuestionIds.map((id) => Number(id.replace(`${test.id}-q`, ""))).filter((v) => Number.isFinite(v))));
        setRemainingSeconds(saved.timeRemainingSec);
        setAttemptMode(restoredMode);
        setTimerRunning(restoredMode === "real" && saved.timeRemainingSec > 0);
        setAudioPlaying(restoredMode === "real");
        realModeAutoFinishedRef.current = false;
      }, 0);
      return () => window.clearTimeout(hydrateTimer);
    }

    const initTimer = window.setTimeout(() => {
      setAttemptId(createAttemptId());
      setStartedAt(Date.now());
      setAttemptMode(null);
      setTimerRunning(false);
      realModeAutoFinishedRef.current = false;
    }, 0);
    return () => window.clearTimeout(initTimer);
  }, [requestedMode, restartRequested, test.id]);

  useEffect(() => {
    if (!(restartRequested || requestedMode)) {
      return;
    }
    if (attemptMode !== null) {
      return;
    }

    const mode = requestedMode ?? null;
    const resetTimer = window.setTimeout(() => {
      resetAttemptState(mode);
    }, 0);
    clearAttemptQueryParams();

    return () => window.clearTimeout(resetTimer);
  }, [attemptMode, requestedMode, restartRequested]);

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

  const sectionPaletteSections = useMemo(() => {
    return test.sections.map((section, index) => {
      const numbers = sectionQuestionNumbers.get(section.id) ?? [];
      const answered = numbers.reduce((count, number) => {
        return count + (isAnswered(answers[number]) ? 1 : 0);
      }, 0);
      return {
        sectionId: section.id,
        index: index + 1,
        numbers,
        answered,
      };
    });
  }, [answers, sectionQuestionNumbers, test.sections]);

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
  const isRealMode = attemptMode === "real";
  const showModePicker = attemptMode === null;
  const flatQuestions = useMemo(
    () => flattenListeningQuestions(test.id, test.sections),
    [test.id, test.sections]
  );
  const persistedAnswersByQuestionId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(answers).map(([number, value]) => [`${test.id}-q${number}`, value])
      ) as Record<string, string | string[] | null>,
    [answers, test.id]
  );
  const gradeableQuestions = useMemo<GradeableQuestion[]>(
    () =>
      flatQuestions.map((question) => {
        const meta = getListeningAnswerMeta(question.id);
        return {
          id: question.id,
          number: question.number,
          type: question.type,
          correctAnswer: meta?.correctAnswer,
          acceptableAnswers: meta?.acceptableAnswers,
        };
      }),
    [flatQuestions]
  );
  const grading = useMemo(
    () => gradeTest(gradeableQuestions, persistedAnswersByQuestionId),
    [gradeableQuestions, persistedAnswersByQuestionId]
  );
  const reviewSections = useMemo(() => {
    return test.sections.map((section, index) => ({
      sectionId: section.id,
      label: tListeningResult("partLabel", { index: index + 1 }),
      title: section.title,
      instructions: section.instructions,
      nowPlayingLabel: section.audioMeta.nowPlayingLabel,
      audioTitle: section.audioMeta.currentTrackTitle,
      evidenceItems: flatQuestions
        .filter((question) => question.sectionId === section.id)
        .map((question) => {
          const meta = getListeningAnswerMeta(question.id);
          const graded = grading.byQuestion[question.id];
          return {
            questionId: question.id,
            questionNumber: question.number,
            prompt: question.prompt,
            quote: meta?.evidence.transcriptQuote ?? question.prompt,
            timeRange: meta?.evidence.timeRange,
            status: !graded?.normalizedUser
              ? "skipped"
              : graded.isCorrect
                ? "correct"
                : "incorrect",
          } as const;
        }),
    })) as ListeningReviewSection[];
  }, [flatQuestions, grading.byQuestion, tListeningResult, test.sections]);
  const resolvedActiveSectionId = test.sections.some((section) => section.id === activeSectionId)
    ? activeSectionId
    : (test.sections[0]?.id ?? "s1");

  useEffect(() => {
    if (!attemptId || !attemptMode) return;
    const persistedAnswers = Object.fromEntries(
      Object.entries(answers).map(([number, value]) => [`${test.id}-q${number}`, value])
    );
    saveAttemptProgress({
      attemptId,
      module: "listening",
      testId: test.id,
      mode: attemptMode,
      answers: persistedAnswers,
      markedQuestionIds: [...marked].map((number) => `${test.id}-q${number}`),
      startedAt,
      timeRemainingSec: remainingSeconds,
      timerUsed: timerRunning || remainingSeconds !== test.durationMinutes * 60,
    });
  }, [answers, attemptId, attemptMode, marked, remainingSeconds, startedAt, test.durationMinutes, test.id, timerRunning]);

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

  const chooseAttemptMode = (mode: AttemptMode) => {
    realModeAutoFinishedRef.current = false;
    setAttemptMode(mode);

    if (mode === "real") {
      if (realModeStartTimeoutRef.current) {
        window.clearTimeout(realModeStartTimeoutRef.current);
        realModeStartTimeoutRef.current = null;
      }
      setTimerRunning(false);
      setAudioPlaying(false);
      setRealModeStarting(false);
      setRealModeConfirmOpen(true);
      return;
    }

    setRealModeConfirmOpen(false);
    setRealModeStarting(false);
    setTimerRunning(false);
    setAudioPlaying(false);
  };

  const cancelRealModeStart = () => {
    if (realModeStartTimeoutRef.current) {
      window.clearTimeout(realModeStartTimeoutRef.current);
      realModeStartTimeoutRef.current = null;
    }
    setAttemptMode(null);
    setRealModeConfirmOpen(false);
    setRealModeStarting(false);
    setTimerRunning(false);
    setAudioPlaying(false);
  };

  const confirmRealModeStart = () => {
    if (realModeStartTimeoutRef.current) {
      window.clearTimeout(realModeStartTimeoutRef.current);
      realModeStartTimeoutRef.current = null;
    }
    setRealModeConfirmOpen(false);
    setRealModeStarting(true);
    realModeStartTimeoutRef.current = window.setTimeout(() => {
      setTimerRunning(true);
      setAudioPlaying(true);
      setRealModeStarting(false);
      realModeStartTimeoutRef.current = null;
    }, 1000);
  };

  const handleJumpEvidenceFromReview = useCallback((questionId: string) => {
    const meta = getListeningAnswerMeta(questionId);
    setReviewMobilePanel("transcript");
    if (meta?.evidence.sectionId) {
      setActiveSectionId(meta.evidence.sectionId);
    }
    setHighlightedEvidenceQuestionId(questionId);

    window.setTimeout(() => {
      const node = document.getElementById(`listening-evidence-${questionId}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, []);

  const handleGoToQuestionFromReview = useCallback((questionId: string) => {
    setReviewMobilePanel("questions");
    window.setTimeout(() => {
      const node = document.getElementById(`review-question-${questionId}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, []);

  const finishTest = useCallback(() => {
    if (!attemptId) return;
    const finishedAt = Date.now();
    const persistedAnswers = Object.fromEntries(
      Object.entries(answers).map(([number, value]) => [`${test.id}-q${number}`, value])
    );

    saveAttemptResult({
      attemptId,
      module: "listening",
      testId: test.id,
      mode: attemptMode ?? "practice",
      answers: persistedAnswers,
      markedQuestionIds: [...marked].map((number) => `${test.id}-q${number}`),
      startedAt,
      finishedAt,
      timeRemainingSec: remainingSeconds,
      timerUsed: timerRunning || remainingSeconds !== test.durationMinutes * 60,
    });

    setFinishOpen(false);
    setPaletteOpen(false);
    setTimerRunning(false);
    setAudioPlaying(false);
    setReviewMobilePanel("transcript");
    setReviewMode(true);
  }, [
    answers,
    attemptId,
    attemptMode,
    marked,
    remainingSeconds,
    startedAt,
    test.durationMinutes,
    test.id,
    timerRunning,
  ]);

  useEffect(() => {
    if (!highlightedEvidenceQuestionId) return;
    const timer = window.setTimeout(() => setHighlightedEvidenceQuestionId(null), 2400);
    return () => window.clearTimeout(timer);
  }, [highlightedEvidenceQuestionId]);

  useEffect(() => {
    if (!isRealMode || reviewMode || remainingSeconds > 0 || !attemptId || realModeAutoFinishedRef.current) {
      return;
    }

    realModeAutoFinishedRef.current = true;
    const finishTimer = window.setTimeout(() => {
      finishTest();
    }, 0);
    return () => window.clearTimeout(finishTimer);
  }, [attemptId, finishTest, isRealMode, remainingSeconds, reviewMode]);

  useEffect(() => {
    return () => {
      if (realModeStartTimeoutRef.current) {
        window.clearTimeout(realModeStartTimeoutRef.current);
        realModeStartTimeoutRef.current = null;
      }
    };
  }, []);

  const isQuestionMarked = (questionNumber: number) => marked.has(questionNumber);
  const markedQuestionClass = (questionNumber: number) =>
    isQuestionMarked(questionNumber)
      ? "border-l-4 border-l-amber-400 bg-amber-50/40 dark:bg-amber-500/10"
      : "";

  const renderBlock = (block: ListeningBlock) => {
    if (block.type === "noteForm") {
      return (
        <Card className="test-panel test-soft-surface min-w-0 gap-0 rounded-lg border border-border bg-muted/20 p-4 overflow-hidden">
          <h4 className="text-center text-base font-semibold tracking-wide">
            {block.title}
          </h4>
          {block.description ? (
            <p className="test-muted-copy mt-2 text-sm text-muted-foreground">
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
                  markedQuestionClass(field.questionNumber),
                )}
              >
                <p
                  className={cn(
                    "col-span-2 wrap-break-word text-sm text-foreground sm:col-span-1",
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
                    "test-input-surface w-full min-w-0 h-10",
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
        <Card className="test-panel min-w-0 gap-0 rounded-lg border border-border bg-card p-0 overflow-hidden">
          <h4 className="border-b border-border px-4 py-3 text-sm font-semibold">
            {block.title}
          </h4>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-115 text-sm">
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
                    className={cn("scroll-mt-24", markedQuestionClass(row.questionNumber))}
                  >
                    <td className="border-b border-border px-3 py-2 wrap-break-word">
                      {row.values[0]}
                    </td>
                    <td className="border-b border-border px-3 py-2 wrap-break-word">
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
                            "test-input-surface w-full min-w-0 h-10",
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
            <p className="test-muted-copy text-sm font-medium text-muted-foreground">
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
              className={cn("test-panel min-w-0 rounded-lg border border-border bg-card p-4 scroll-mt-24 overflow-hidden", markedQuestionClass(question.questionNumber))}
              onClick={() => setActiveQuestionNumber(question.questionNumber)}
            >
              <p className="wrap-break-word text-sm font-medium">
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
                    <span className="wrap-break-word">{option}</span>
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
        <Card className="test-panel min-w-0 gap-0 rounded-lg border border-border bg-card p-4 overflow-hidden">
          <h4 className="text-sm font-semibold">{block.title}</h4>
          <div className="test-soft-surface mt-3 rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <p className="font-medium">{t("options")}</p>
            <ul className="mt-1 space-y-1">
              {block.options.map((option) => (
                <li key={option} className="wrap-break-word">
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
                  markedQuestionClass(item.questionNumber),
                )}
                onClick={() => setActiveQuestionNumber(item.questionNumber)}
              >
                <div className="flex items-center gap-2 md:contents">
                  <QuestionChip
                    number={item.questionNumber}
                    active={activeQuestionNumber === item.questionNumber}
                  />
                  <p className="wrap-break-word text-sm">{item.prompt}</p>
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
                      "test-input-surface w-full h-10",
                      isSmallLandscape && "h-11",
                      !isSmallLandscape && "md:max-w-55",
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
        <Card className="test-panel min-w-0 gap-0 rounded-lg border border-border bg-card p-4 overflow-hidden">
          <h4 className="text-sm font-semibold">{block.title}</h4>
          <p className="test-muted-copy mt-1 text-sm text-muted-foreground">
            {block.description}
          </p>
          <div
            className={cn(
              "mt-3 grid gap-3",
              !isSmallLandscape && "md:grid-cols-[minmax(0,1fr)_240px]",
            )}
          >
            <div className="test-soft-surface relative min-h-55 min-w-0 overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 p-3">
              <p className="test-muted-copy text-[10px] tracking-wider text-muted-foreground uppercase">
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
              <div className="test-soft-surface rounded-lg border border-border bg-muted/20 p-3 text-sm">
                <p className="font-medium">{t("options")}</p>
                <ul className="mt-1 space-y-1">
                  {block.options.map((option) => (
                    <li key={option} className="wrap-break-word">
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
                    className={cn("grid grid-cols-[32px_minmax(0,1fr)] items-center gap-2 scroll-mt-24", markedQuestionClass(item.questionNumber))}
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
                        "test-input-surface w-full min-w-0 h-10",
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
      <Card className="test-panel test-soft-surface min-w-0 gap-0 rounded-lg border border-border bg-muted/20 p-4 overflow-hidden">
        <h4 className="text-base font-semibold">{block.title}</h4>
        <p className="test-muted-copy mt-1 text-sm text-muted-foreground">
          <FormattedInstructionText text={block.instruction} />
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
              className={cn("flex flex-wrap items-center gap-2 scroll-mt-24", markedQuestionClass(line.questionNumber))}
              onClick={() => setActiveQuestionNumber(line.questionNumber)}
            >
              <span className="wrap-break-word">{line.before}</span>
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
                  "test-input-surface w-full min-w-0 h-10 sm:w-44",
                  isSmallLandscape && "h-11",
                )}
              />
              <span className="wrap-break-word">{line.after}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <section
      data-test-contrast={appearance.contrast}
      data-test-size={appearance.textSize}
      className="test-appearance-root mx-0 my-0 flex h-[calc(100dvh-2rem)] w-screen flex-col overflow-x-hidden overflow-y-hidden bg-background lg:-mx-10 lg:-my-8"
    >
      <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden border-b border-border bg-background/95 backdrop-blur">
        <div
          className={cn(
            "relative flex min-h-14 w-full min-w-0 max-w-full flex-wrap items-center justify-between gap-2 px-3 py-2 sm:min-h-16 sm:gap-3 sm:px-4 lg:px-8",
            isSmallLandscape && "min-h-12 gap-1 px-2 py-1",
          )}
        >
          <div className="flex flex-1 min-w-0 items-center gap-1.5 sm:gap-3">
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-sm",
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

          {!reviewMode ? (
          <div className="order-3 flex w-full items-center justify-center gap-2 sm:order-0 sm:absolute sm:left-1/2 sm:top-1/2 sm:w-auto sm:-translate-x-1/2 sm:-translate-y-1/2">
            <Badge
              variant="secondary"
              className={cn(
                "h-9 max-w-30 shrink-0 rounded-xl px-2 sm:px-3 text-sm font-semibold text-blue-700",
                isSmallLandscape && "h-8 px-1.5 text-xs",
              )}
            >
              <Clock3 className="size-4" />
              <span className="truncate">{formatTime(remainingSeconds)}</span>
            </Badge>
            <Button
              type="button"
              aria-label={isRealMode ? realModeLockedTimerLabel : timerRunning ? t("stopTimer") : t("startTimer")}
              variant={isRealMode || timerRunning ? "outline" : "default"}
              disabled={isRealMode}
              className={cn(
                "h-9 shrink-0 rounded-xl px-2 sm:px-4",
                isSmallLandscape && "h-8 px-2",
              )}
              onClick={() => {
                if (isRealMode) {
                  return;
                }
                if (!timerRunning && remainingSeconds <= 0) {
                  setRemainingSeconds(test.durationMinutes * 60);
                }
                setTimerRunning((prev) => !prev);
              }}
            >
              {isRealMode ? (
                <Clock3 className="size-4" />
              ) : timerRunning ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              <span className="hidden sm:inline">
                {isRealMode ? realModeTitle : timerRunning ? t("stop") : t("start")}
              </span>
            </Button>
          </div>
          ) : null}

          <div className="ml-auto shrink-0 min-w-0 flex items-center gap-1 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-9 w-9 shrink-0 rounded-xl border-border/70 bg-background/60 p-0"
              aria-label={isFullscreen ? tOptions("exitFullscreen") : tOptions("enterFullscreen")}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-9 shrink-0 rounded-xl border-border/70 bg-background/60 p-0"
              aria-label={tOptions("title")}
              onClick={() => setOptionsOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
            {reviewMode ? (
              <Button
                asChild
                className={cn(
                  "h-9 shrink-0 rounded-xl bg-blue-600 px-2 text-sm font-semibold hover:bg-blue-600/90 sm:px-4",
                  isSmallLandscape && "h-8 px-2 text-xs",
                )}
                aria-label={tListeningResult("resultsButton")}
              >
                <Link href={`/${locale}/listening/${test.id}/result?attempt=${attemptId}`}>
                  {tListeningResult("resultsButton")}
                </Link>
              </Button>
            ) : (
              <Button
                className={cn(
                  "h-9 shrink-0 rounded-xl bg-blue-600 px-2 text-sm font-semibold hover:bg-blue-600/90 sm:px-4",
                  isSmallLandscape && "h-8 px-2 text-xs",
                )}
                aria-label={t("finishTest")}
                disabled={!attemptMode}
                onClick={() => setFinishOpen(true)}
              >
                {t("finishTest")}
              </Button>
            )}
            <Avatar aria-label={t("userAvatar")} className="hidden sm:flex">
              <AvatarFallback className="bg-amber-100 text-amber-700">
                <User className="size-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {!reviewMode ? (
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
            disabled={isRealMode}
            className={cn(
              "h-9 w-9 rounded-full shrink-0",
              isSmallLandscape && "h-8 w-8",
              isRealMode && "cursor-not-allowed opacity-60",
            )}
            onClick={() => {
              if (isRealMode) return;
              setAudioPlaying((prev) => !prev);
            }}
            aria-label={isRealMode ? realModeLockedAudioLabel : audioPlaying ? t("pauseAudio") : t("playAudio")}
          >
            {audioPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>

          <div className="w-full min-w-0 max-w-full overflow-hidden">
            <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <p className="test-muted-copy min-w-0 truncate">
                {activeSection.audioMeta.nowPlayingLabel} -{" "}
                {activeSection.audioMeta.currentTrackTitle}
              </p>
              <p className={cn("test-muted-copy shrink-0", isSmallLandscape && "text-[10px]")}>
                30:00
              </p>
            </div>
            {realModeStarting ? (
              <p className="mb-1 rounded-lg border border-blue-400/40 bg-blue-500/10 px-2 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-200">
                {realModeCountdownLabel}
              </p>
            ) : null}
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
                disabled={isRealMode}
                onChange={(e) => {
                  if (isRealMode) return;
                  setAudioProgress(Number(e.target.value));
                }}
                aria-label={isRealMode ? realModeProgressLockedLabel : t("audioProgress")}
                className={cn("h-1.5 w-full min-w-0", isRealMode && "cursor-not-allowed opacity-60")}
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
      ) : null}

      <main className="test-scaleable grid min-h-0 min-w-0 w-full max-w-full flex-1 grid-cols-1 gap-3 px-2 py-2 sm:px-3 sm:py-3 lg:gap-4 lg:px-5 lg:py-4">
        {reviewMode ? (
          <section className="min-h-0 min-w-0 w-full max-w-full space-y-3">
            {isCompact ? (
              <div className="grid grid-cols-2 rounded-xl border border-border bg-card/70 p-1">
                <Button
                  type="button"
                  variant={reviewMobilePanel === "transcript" ? "secondary" : "ghost"}
                  className="h-8 rounded-lg"
                  onClick={() => setReviewMobilePanel("transcript")}
                >
                  {tListeningResult("partLabel", { index: Number(resolvedActiveSectionId.slice(1)) })}
                </Button>
                <Button
                  type="button"
                  variant={reviewMobilePanel === "questions" ? "secondary" : "ghost"}
                  className="h-8 rounded-lg"
                  onClick={() => setReviewMobilePanel("questions")}
                >
                  {t.has("questions") ? t("questions") : "Questions"}
                </Button>
              </div>
            ) : null}

            <section
              id="review-main"
              className="grid min-h-0 min-w-0 w-full max-w-full gap-4 xl:h-[calc(100vh-14.5rem)] xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] xl:items-stretch"
            >
              <div className={cn("min-h-0 min-w-0", isCompact && reviewMobilePanel !== "transcript" && "hidden xl:block")}>
                <ListeningTranscriptReviewPanel
                  sections={reviewSections}
                  activeSectionId={resolvedActiveSectionId}
                  highlightedQuestionId={highlightedEvidenceQuestionId}
                  onSectionChange={(sectionId) => setActiveSectionId(sectionId as "s1" | "s2" | "s3" | "s4")}
                  onGoToQuestion={handleGoToQuestionFromReview}
                />
              </div>

              <div className={cn("min-h-0 min-w-0", isCompact && reviewMobilePanel !== "questions" && "hidden xl:block")}>
                <ListeningQuestionAnalysisPanel
                  questions={flatQuestions}
                  answers={persistedAnswersByQuestionId}
                  grading={grading}
                  expanded={expandedReviewQuestions}
                  onToggleExplanation={(questionId) => {
                    setExpandedReviewQuestions((previous) => {
                      const next = new Set(previous);
                      if (next.has(questionId)) {
                        next.delete(questionId);
                      } else {
                        next.add(questionId);
                      }
                      return next;
                    });
                  }}
                  onJumpEvidence={handleJumpEvidenceFromReview}
                />
              </div>
            </section>
          </section>
        ) : (
        <section className="min-h-0 min-w-0">
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border border-border/70 bg-background/45">
            <div className="border-b border-border/70 px-3 py-2 sm:px-4">
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
                    <TabsList className="inline-flex h-10 w-max min-w-full flex-nowrap whitespace-nowrap bg-transparent p-0">
                      {test.sections.map((section, index) => (
                        <TabsTrigger
                          key={section.id}
                          value={section.id}
                          className="inline-flex h-9 shrink-0 rounded-lg px-3"
                          aria-label={section.title}
                        >
                          {t("sectionTab", { index: index + 1 })}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </Tabs>
              )}

              <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <p className="text-[11px] tracking-[0.16em] text-blue-700 uppercase dark:text-blue-300">
                    {t("sectionTab", { index: Number(activeSectionId.slice(1)) })}
                  </p>
                  <h2 className="mt-1 wrap-break-word text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {activeSection.title}
                  </h2>
                  <p className="mt-1 wrap-break-word text-sm font-medium text-muted-foreground">
                    {activeSection.questionRangeLabel}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-xs text-muted-foreground sm:max-w-85">
                  <p className="font-semibold tracking-[0.12em] uppercase">{activeSection.audioMeta.nowPlayingLabel}</p>
                  <p className="mt-1 wrap-break-word text-sm text-foreground">{activeSection.audioMeta.currentTrackTitle}</p>
                </div>
              </div>

              <p className="mt-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm wrap-break-word">
                <FormattedInstructionText text={activeSection.instructions} />
              </p>
            </div>

            <div
              ref={questionsScrollRef}
              className={cn(
                "min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4 lg:px-5 lg:py-5",
                isSmallLandscape && "py-2",
              )}
            >
              <Highlightable
                key={`listening-section-${activeSection.id}`}
                storageKey={`listening:${test.id}:section:${activeSection.id}`}
                notesStorageKey={`listening:${test.id}:notes`}
                noteScopeKey={`section:${activeSection.id}`}
                contentVersion={`${activeSection.id}:${isSmallLandscape ? "compact" : "full"}`}
                className={cn(
                  "space-y-4 pb-8",
                  isSmallLandscape && "pb-6",
                )}
              >
                {activeSection.blocks.map((block, index) => (
                  <div key={`${activeSection.id}-${block.type}-${index}`}>
                    {renderBlock(block)}
                  </div>
                ))}
              </Highlightable>
            </div>
          </div>
        </section>
        )}
      </main>

      {!reviewMode ? (
        <div className="border-t border-border/75 bg-background/95 px-3 backdrop-blur sm:px-4 lg:px-5">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 py-2">
            <Button
              type="button"
              variant="ghost"
              aria-label={t.has("previous") ? t("previous") : t("previousSection")}
              disabled={activeQuestionNumber <= 1}
              onClick={() => jumpToQuestion(Math.max(1, activeQuestionNumber - 1))}
              className="h-8 rounded-lg px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
            >
              <MoveLeft className="size-4" />
              {t.has("previous") ? t("previous") : t("previousSection")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              aria-label={t.has("next") ? t("next") : t("nextSection")}
              disabled={activeQuestionNumber >= test.totalQuestions}
              onClick={() => jumpToQuestion(Math.min(test.totalQuestions, activeQuestionNumber + 1))}
              className="h-8 rounded-lg px-2.5 text-xs text-blue-700 hover:text-blue-700 dark:text-blue-300 sm:h-9 sm:px-3 sm:text-sm"
            >
              {t.has("next") ? t("next") : t("nextSection")}
              <MoveRight className="size-4" />
            </Button>

            <p className="ml-auto text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:text-xs">
              {t.has("questionPosition")
                ? t("questionPosition", { current: activeQuestionNumber, total: test.totalQuestions })
                : `Question ${activeQuestionNumber} / ${test.totalQuestions}`}
            </p>

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
              className="h-8 rounded-lg px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
            >
              {marked.has(activeQuestionNumber) ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              {marked.has(activeQuestionNumber)
                ? (t.has("unmark") ? t("unmark") : "Unmark")
                : t("markForReview")}
            </Toggle>

            <Button
              type="button"
              variant="secondary"
              aria-label={paletteTitle}
              onClick={() => setPaletteOpen(true)}
              className="h-8 rounded-lg px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm lg:hidden"
            >
              <Grid2x2 className="size-4" />
              {paletteTitle}
            </Button>
          </div>

          <div className="mt-2 min-w-0 overflow-x-auto [scrollbar-width:thin]">
            <div className="inline-grid min-w-max grid-flow-col auto-cols-[minmax(220px,1fr)] gap-2 pr-1 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4 lg:min-w-0 lg:w-full">
              {sectionPaletteSections.map((section) => {
                const isActiveSection = section.sectionId === activeSectionId;
                return (
                  <div
                    key={`palette-${section.sectionId}`}
                    className={cn(
                      "rounded-xl border p-2 transition-colors",
                      isActiveSection
                        ? "border-blue-400/60 bg-blue-500/10"
                        : "cursor-pointer border-border/70 bg-background/70 hover:border-blue-300/50 hover:bg-muted/40"
                    )}
                    onClick={() => {
                      if (!isActiveSection) {
                        handleSectionChange(section.sectionId);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                      onClick={() => handleSectionChange(section.sectionId)}
                    >
                      <span className="text-sm font-semibold">
                        {t("sectionTab", { index: section.index })}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {section.answered}/{section.numbers.length}
                      </span>
                    </button>

                    {isActiveSection ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {section.numbers.map((number) => {
                          const answered = isAnswered(answers[number]);
                          const isMarked = marked.has(number);
                          const isCurrent = activeQuestionNumber === number;
                          return (
                            <Button
                              key={number}
                              type="button"
                              variant="outline"
                              aria-label={getJumpToQuestionLabel(number)}
                              onClick={() => jumpToQuestion(number)}
                              className={cn(
                                "relative h-6 min-w-6 rounded-md border px-1 text-[11px] font-semibold shadow-none",
                                isCurrent && "border-blue-700 bg-blue-600 text-white hover:bg-blue-600",
                                !isCurrent && answered && "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/45 dark:bg-emerald-500/20 dark:text-emerald-200",
                                !isCurrent && !answered && "border-border bg-background text-foreground/85",
                                isMarked && "border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-300/60 ring-offset-1 dark:bg-amber-500/20 dark:text-amber-100"
                              )}
                            >
                              {number}
                              {isMarked ? (
                                <span
                                  className="absolute right-1 top-1 size-1 rounded-full bg-amber-500"
                                  aria-hidden="true"
                                />
                              ) : null}
                            </Button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

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
              {sectionPaletteSections.map((section) => {
                const isActiveSection = section.sectionId === activeSectionId;
                return (
                  <div
                    key={`sheet-palette-${section.sectionId}`}
                    className={cn(
                      "rounded-xl border p-2.5 transition-colors",
                      isActiveSection
                        ? "border-blue-400/60 bg-blue-500/10"
                        : "cursor-pointer border-border/70 bg-background/70 hover:border-blue-300/50 hover:bg-muted/40"
                    )}
                    onClick={() => {
                      if (!isActiveSection) {
                        handleSectionChange(section.sectionId);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                      onClick={() => handleSectionChange(section.sectionId)}
                    >
                      <span className="text-sm font-semibold">
                        {t("sectionTab", { index: section.index })}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {section.answered}/{section.numbers.length}
                      </span>
                    </button>

                    {isActiveSection ? (
                      <div className="mt-2 grid grid-cols-5 gap-2">
                        {section.numbers.map((number) => {
                          const answered = isAnswered(answers[number]);
                          const isMarked = marked.has(number);
                          const isCurrent = activeQuestionNumber === number;

                          return (
                            <Button
                              key={number}
                              type="button"
                              variant="outline"
                              aria-label={getJumpToQuestionLabel(number)}
                              onClick={() => {
                                jumpToQuestion(number);
                                if (isCompact) {
                                  setPaletteOpen(false);
                                }
                              }}
                              className={cn(
                                "relative h-8 rounded-xl px-0 text-xs font-semibold shadow-none",
                                isCurrent && "border-blue-700 bg-blue-600 text-white hover:bg-blue-600",
                                !isCurrent && answered && "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/45 dark:bg-emerald-500/20 dark:text-emerald-200",
                                !isCurrent && !answered && "border-border bg-background text-foreground/85",
                                isMarked && "border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-300/60 ring-offset-1 dark:bg-amber-500/20 dark:text-amber-100"
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
                    ) : null}
                  </div>
                );
              })}

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

      <TestOptionsSheet
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        isCompact={isCompact}
        appearance={appearance}
        onContrastChange={setContrast}
        onTextSizeChange={setTextSize}
      />

      {showModePicker ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-border/80 bg-linear-to-br from-card via-card to-blue-500/5 p-5 shadow-xl sm:p-6">
            <h3 className="text-lg font-semibold">{t.has("modePickerTitle") ? t("modePickerTitle") : "Choose test mode"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.has("modePickerDescription")
                ? t("modePickerDescription")
                : "Choose how you want to take this listening test."}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button type="button" onClick={() => chooseAttemptMode("real")}>
                {t.has("modeReal") ? t("modeReal") : "Real mode"}
              </Button>
              <Button type="button" variant="outline" onClick={() => chooseAttemptMode("practice")}>
                {t.has("modePractice") ? t("modePractice") : "Practice mode"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {t.has("realModeRule")
                ? t("realModeRule")
                : "Real mode: timer and audio run like the exam and playback controls are locked."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.has("practiceModeRule")
                ? t("practiceModeRule")
                : "Practice mode: you can start, pause, and continue freely."}
            </p>
          </Card>
        </div>
      ) : null}

      {realModeConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-border/80 bg-linear-to-br from-card via-card to-blue-500/10 p-5 shadow-xl sm:p-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight">
                {t.has("realModeStartTitle") ? t("realModeStartTitle") : "Start Listening Test?"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.has("realModeStartDescription")
                  ? t("realModeStartDescription")
                  : "In Real Mode, the audio starts automatically and cannot be paused or replayed. Make sure you are ready before you begin."}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={cancelRealModeStart}>
                {t.has("realModeCancelCta") ? t("realModeCancelCta") : t("cancel")}
              </Button>
              <Button type="button" onClick={confirmRealModeStart}>
                {t.has("realModeStartCta") ? t("realModeStartCta") : "Start Now"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

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
