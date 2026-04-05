"use client";

import Link from "next/link";
import { type CSSProperties, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BookOpen, Bookmark, BookmarkCheck, Clock3, Grid2x2, HelpCircle, Maximize2, Menu, Minimize2, MoveLeft, MoveRight, Play, RotateCcw, Square, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getStaticReadingTestById, saveRuntimeReadingTest, type ReadingFullTest, type ReadingQuestion } from "@/data/reading-tests";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import {
  createAttemptId,
  loadAttemptProgress,
  loadLatestAttemptId,
  saveAttemptProgress,
  saveAttemptResult,
  type AttemptMode,
} from "@/lib/test-attempt-storage";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { HighlightableText } from "@/components/test/HighlightableText";
import { FormattedInstructionText } from "@/components/test/FormattedInstructionText";
import {
  clampSplitPct,
  mergeRanges,
  subtractRangeFromRanges,
  loadReadingHighlights,
  saveReadingHighlights,
  type ReadingHighlight,
  type ReadingHighlightColor,
} from "@/lib/reading-highlights";
import { useTestLeaveWarning } from "@/lib/use-test-leave-warning";
import { useTestAppearance } from "@/lib/test-appearance";
import { TestOptionsSheet } from "@/components/test/TestOptionsSheet";
import { ReviewQuestionsPanel } from "./result/_components/ReviewQuestionsPanel";
import { adaptReadingBackendReview, type AdaptedReadingBackendReview } from "./result/_components/backendReviewAdapters";
import { studentAttemptsService } from "@/src/services/student/attempts.service";
import { studentTestsService } from "@/src/services/student/tests.service";
import { StudentApiError } from "@/src/services/student/types";
import type { StudentAttemptDetail, StudentAttemptQuestion, StudentAttemptQuestionGroup, StudentAttemptReadingPassage, StudentTestRecord } from "@/src/services/student/types";

const DEFAULT_SPLIT = 50;

type AnswerValue = string | string[];

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const mm = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const ss = (safe % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function isAnswered(value: AnswerValue | undefined) {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return false;
}

function toSubmitAnswer(value: AnswerValue | undefined): string | string[] | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? value : null;
  }
  if (Array.isArray(value)) {
    const cleaned = value.map((item) => item.trim()).filter(Boolean);
    return cleaned.length ? cleaned : null;
  }
  return null;
}

function normalizeBackendReviewAnswers(answers: Record<string, string | string[] | null>) {
  const next: Record<string, AnswerValue> = {};
  for (const [questionId, value] of Object.entries(answers)) {
    if (typeof value === "string") {
      next[questionId] = value;
      continue;
    }
    if (Array.isArray(value)) {
      next[questionId] = value;
    }
  }
  return next;
}

function toBackendAnswerPayload(value: string | string[] | null): {answer: string} | {answers: string[]} | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? {answer: trimmed} : null;
  }

  if (Array.isArray(value)) {
    const cleaned = value.map((item) => item.trim()).filter(Boolean);
    return cleaned.length ? {answers: cleaned} : null;
  }

  return null;
}

type HighlightItem = {
  questionNumber: number;
  phrase: string;
  paragraphIndex: number;
};

type ParagraphMatch = {
  start: number;
  end: number;
  phrase: string;
  questionNumber: number;
};

function findParagraphMatches(paragraph: string, spans: HighlightItem[]): ParagraphMatch[] {
  const lowerParagraph = paragraph.toLowerCase();
  const raw = spans
    .map((span) => {
      const phrase = span.phrase.trim();
      if (!phrase) return null;
      const start = lowerParagraph.indexOf(phrase.toLowerCase());
      if (start < 0) return null;
      return {
        start,
        end: start + phrase.length,
        phrase: paragraph.slice(start, start + phrase.length),
        questionNumber: span.questionNumber,
      } satisfies ParagraphMatch;
    })
    .filter((item): item is ParagraphMatch => Boolean(item))
    .sort((a, b) => (a.start === b.start ? b.end - b.start - (a.end - a.start) : a.start - b.start));

  const filtered: ParagraphMatch[] = [];
  let cursor = -1;
  for (const match of raw) {
    if (match.start < cursor) continue;
    filtered.push(match);
    cursor = match.end;
  }
  return filtered;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toStringSafe(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function toNumberSafe(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractQuestionPrompt(question: StudentAttemptQuestion) {
  const options = asRecord(question.options_json);
  const fromStatement = toStringSafe(options?.statement);
  const fromStem = toStringSafe(options?.sentence_stem);
  const direct = toStringSafe(question.question_text);
  return fromStatement || fromStem || direct || "";
}

function extractMcqOptions(question: StudentAttemptQuestion): string[] {
  const options = asRecord(question.options_json);
  const list = asArray<unknown>(options?.options).map((item) => {
    if (typeof item === "string") return item;
    const row = asRecord(item);
    const text = toStringSafe(row?.text);
    const key = toStringSafe(row?.key);
    if (text) return text;
    if (key) return key;
    return "";
  });

  const cleaned = list.map((item) => item.trim()).filter(Boolean);
  return cleaned.length ? cleaned : ["A", "B", "C"];
}

function extractHeadingOptions(group: StudentAttemptQuestionGroup): string[] {
  const content = asRecord(group.group_content_json);
  const headings = asArray<unknown>(content?.headings)
    .map((item) => {
      const row = asRecord(item);
      const key = toStringSafe(row?.key);
      const text = toStringSafe(row?.text);
      if (key && text) return `${key}. ${text}`;
      return text || key;
    })
    .map((item) => item.trim())
    .filter(Boolean);

  return headings.length ? headings : ["i. Heading 1", "ii. Heading 2", "iii. Heading 3", "iv. Heading 4", "v. Heading 5"];
}

function buildGroupTitle(group: StudentAttemptQuestionGroup) {
  const from = toNumberSafe(group.question_number_start, 0);
  const to = toNumberSafe(group.question_number_end, 0);
  if (from > 0 && to >= from) {
    return `Questions ${from}-${to}`;
  }
  return `Group ${toNumberSafe(group.group_order, 1)}`;
}

function buildEvidencePhrase(prompt: string, fallbackNumber: number) {
  const compact = prompt.replace(/\s+/g, " ").trim();
  if (compact) return compact.slice(0, 80);
  return `Question ${fallbackNumber}`;
}

function resolveSubmitQuestionId(question: StudentAttemptQuestion) {
  const canonicalQuestionId = toStringSafe(question.question_id).trim();
  if (canonicalQuestionId) {
    return canonicalQuestionId;
  }

  const directId = toStringSafe(question.id).trim();
  if (directId) {
    return directId;
  }

  const attemptQuestionId = toStringSafe(question.attempt_question_id).trim();
  if (attemptQuestionId) {
    return attemptQuestionId;
  }

  const candidates = [
    toStringSafe(question.question_id).trim(),
    toStringSafe(question.id).trim(),
    ...asArray<string>(question.candidate_question_ids)
      .map((value) => toStringSafe(value).trim())
      .filter(Boolean)
  ].filter((value, index, source) => Boolean(value) && source.indexOf(value) === index);
  return candidates[0] ?? "";
}

function extractValidationAnswerQuestionIdFailures(error: unknown) {
  if (!(error instanceof StudentApiError)) {
    return new Set<string>();
  }

  const raw = asRecord(error.raw);
  const payloadError = asRecord(raw?.error);
  const details = asRecord(payloadError?.details);
  const answers = asRecord(details?.answers);
  if (!answers) {
    return new Set<string>();
  }

  const failed = new Set<string>();
  for (const [questionId, detail] of Object.entries(answers)) {
    const row = asRecord(detail);
    const messages = asArray<unknown>(row?.question_id)
      .map((message) => toStringSafe(message).toLowerCase())
      .filter(Boolean);
    const hasBelongMessage = messages.some((message) => message.includes("does not belong to this attempt"));
    if (hasBelongMessage) {
      failed.add(questionId);
    }
  }

  return failed;
}

function resolveSubmitCandidateIds(question: ReadingQuestion) {
  const preferred = toStringSafe(question.backendQuestionId ?? question.id).trim();
  const fromCandidates = asArray<string>(question.backendQuestionCandidateIds)
    .map((value) => toStringSafe(value).trim())
    .filter(Boolean);
  return [preferred, ...fromCandidates].filter((value, index, source) => Boolean(value) && source.indexOf(value) === index);
}

function collectAttemptSubmitCandidatesByNumber(attempt: StudentAttemptDetail) {
  const byNumber = new Map<number, string[]>();

  for (const passage of attempt.reading_passages) {
    for (const group of passage.question_groups) {
      for (const question of group.questions) {
        const number = toNumberSafe(question.question_number, 0);
        if (number <= 0) continue;

        const preferred = resolveSubmitQuestionId(question);
        const candidates = [
          preferred,
          ...asArray<string>(question.candidate_question_ids)
            .map((value) => toStringSafe(value).trim())
            .filter(Boolean)
        ].filter((value, index, source) => Boolean(value) && source.indexOf(value) === index);

        if (candidates.length > 0) {
          byNumber.set(number, candidates);
        }
      }
    }
  }

  return byNumber;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function collectUuidStrings(value: unknown, maxDepth = 4): string[] {
  if (maxDepth < 0) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return UUID_PATTERN.test(trimmed) ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectUuidStrings(item, maxDepth - 1));
  }

  const record = asRecord(value);
  if (!record) return [];
  return Object.values(record).flatMap((item) => collectUuidStrings(item, maxDepth - 1));
}

function collectAttemptRawSubmitCandidatesByNumber(rawAttempt: unknown) {
  const result = new Map<number, string[]>();
  const root = asRecord(rawAttempt);
  const passages = asArray<unknown>(root?.reading_passages);

  for (const passage of passages) {
    const passageRecord = asRecord(passage);
    const groups = asArray<unknown>(passageRecord?.question_groups);
    for (const group of groups) {
      const groupRecord = asRecord(group);
      const questions = asArray<unknown>(groupRecord?.questions);
      for (const question of questions) {
        const row = asRecord(question);
        if (!row) continue;

        const nestedQuestion = asRecord(row.question);
        const number = toNumberSafe(row.question_number ?? nestedQuestion?.question_number, 0);
        if (number <= 0) continue;

        const prioritized = [
          toStringSafe(row.question_id).trim(),
          typeof row.question === "string" ? row.question.trim() : "",
          toStringSafe(nestedQuestion?.question_id).trim(),
          toStringSafe(nestedQuestion?.id).trim(),
          toStringSafe(row.id).trim(),
          toStringSafe(row.attempt_question_id).trim(),
          toStringSafe(row.attempt_question).trim(),
          toStringSafe(row.question_answer_id).trim(),
          toStringSafe(row.question_answer).trim()
        ].filter(Boolean);
        const scanned = collectUuidStrings(row, 4);
        const combined = [...prioritized, ...scanned].filter(
          (value, index, source) => Boolean(value) && source.indexOf(value) === index
        );

        if (combined.length > 0) {
          result.set(number, combined);
        }
      }
    }
  }

  return result;
}

type BackendAttemptAnswerEntry = {
  questionKey: string;
  questionNumber: number;
  candidateIds: string[];
  answer: string | string[] | null;
  is_flagged: boolean;
};

function collectBackendAttemptAnswerEntries(params: {
  questions: ReadingQuestion[];
  answers: Record<string, AnswerValue>;
  marked: Set<string>;
  submitCandidatesByNumber: Map<number, string[]>;
  rawSubmitCandidatesByNumber: Map<number, string[]>;
}) {
  return params.questions
    .map((question) => {
      const answer = toSubmitAnswer(params.answers[question.id]);
      const isFlagged = params.marked.has(question.id);
      const candidateIds =
        params.rawSubmitCandidatesByNumber.get(question.number)
        ?? params.submitCandidatesByNumber.get(question.number)
        ?? resolveSubmitCandidateIds(question);
      if (!candidateIds.length || (answer === null && !isFlagged)) {
        return null;
      }

      return {
        questionKey: question.id,
        questionNumber: question.number,
        candidateIds,
        answer,
        is_flagged: isFlagged
      } satisfies BackendAttemptAnswerEntry;
    })
    .filter((item): item is BackendAttemptAnswerEntry => item !== null);
}

function mapBackendAttemptToReadingTest(testId: string, meta: StudentTestRecord, attempt: StudentAttemptDetail): ReadingFullTest {
  const passages: ReadingFullTest["passages"] = attempt.reading_passages.map((passage, index) => ({
    id: (`p${index + 1}` as ReadingFullTest["passages"][number]["id"]),
    title: toStringSafe(passage.title, `Passage ${index + 1}`),
    text: toStringSafe(passage.passage_text)
  }));

  const passageIdByBackendId = new Map<string, ReadingFullTest["passages"][number]["id"]>();
  attempt.reading_passages.forEach((passage, index) => {
    passageIdByBackendId.set(toStringSafe(passage.id), (`p${index + 1}` as ReadingFullTest["passages"][number]["id"]));
  });

  const questions: ReadingQuestion[] = [];
  for (const passage of attempt.reading_passages as StudentAttemptReadingPassage[]) {
    const passageId = passageIdByBackendId.get(toStringSafe(passage.id)) ?? "p1";
    for (const group of passage.question_groups as StudentAttemptQuestionGroup[]) {
      const groupTitle = buildGroupTitle(group);
      const instruction = toStringSafe(group.instructions);
      const headingOptions = extractHeadingOptions(group);
      const paragraphOptions = ["A", "B", "C", "D", "E", "F"];

      for (const question of group.questions as StudentAttemptQuestion[]) {
        const number = toNumberSafe(question.question_number, questions.length + 1);
        const questionId = toStringSafe(question.id, `${passageId}-q-${number}`);
        const submitQuestionId = resolveSubmitQuestionId(question);
        const submitQuestionCandidates = asArray<string>(question.candidate_question_ids)
          .map((value) => toStringSafe(value).trim())
          .filter(Boolean);
        const prompt = extractQuestionPrompt(question);
        const qType = toStringSafe(question.question_type).toUpperCase();
        const evidenceSpans = [{ passageId, paragraphIndex: 0, phrase: buildEvidencePhrase(prompt, number) }];

        if (qType === "TFNG") {
          questions.push({
            id: questionId,
            number,
            passageId,
            type: "tfng",
            backendQuestionId: submitQuestionId || undefined,
            backendQuestionCandidateIds: submitQuestionCandidates.length ? submitQuestionCandidates : undefined,
            groupTitle,
            groupInstruction: instruction,
            prompt,
            options: ["TRUE", "FALSE", "NOT GIVEN"],
            correctAnswer: "",
            explanation: "",
            evidenceSpans
          });
          continue;
        }

        if (qType === "MATCHING_HEADINGS") {
          questions.push({
            id: questionId,
            number,
            passageId,
            type: "matchingHeadings",
            backendQuestionId: submitQuestionId || undefined,
            backendQuestionCandidateIds: submitQuestionCandidates.length ? submitQuestionCandidates : undefined,
            groupTitle,
            groupInstruction: instruction,
            prompt: prompt || `Question ${number}`,
            target: prompt || `Question ${number}`,
            headingOptions,
            correctAnswer: "",
            explanation: "",
            evidenceSpans
          });
          continue;
        }

        if (qType === "MATCH_PARA_INFO") {
          questions.push({
            id: questionId,
            number,
            passageId,
            type: "matchingInfo",
            backendQuestionId: submitQuestionId || undefined,
            backendQuestionCandidateIds: submitQuestionCandidates.length ? submitQuestionCandidates : undefined,
            groupTitle,
            groupInstruction: instruction,
            prompt,
            paragraphOptions,
            correctAnswer: "",
            explanation: "",
            evidenceSpans
          });
          continue;
        }

        if (qType === "MCQ_SINGLE" || qType === "MCQ_MULTIPLE") {
          questions.push({
            id: questionId,
            number,
            passageId,
            type: "mcq",
            backendQuestionId: submitQuestionId || undefined,
            backendQuestionCandidateIds: submitQuestionCandidates.length ? submitQuestionCandidates : undefined,
            groupTitle,
            groupInstruction: instruction,
            prompt,
            options: extractMcqOptions(question),
            correctAnswer: "",
            explanation: "",
            evidenceSpans
          });
          continue;
        }

        questions.push({
          id: questionId,
          number,
          passageId,
          type: "sentenceCompletion",
          backendQuestionId: submitQuestionId || undefined,
          backendQuestionCandidateIds: submitQuestionCandidates.length ? submitQuestionCandidates : undefined,
          groupTitle,
          groupInstruction: instruction,
          prompt: prompt || toStringSafe(question.question_text, `Question ${number}`),
          blanks: 1,
          correctAnswer: "",
          acceptableAnswers: [],
          explanation: "",
          evidenceSpans
        });
      }
    }
  }

  questions.sort((left, right) => left.number - right.number);

  const durationSeconds = attempt.time_limit_seconds ?? meta.time_limit_seconds ?? 3600;

  return {
    id: toStringSafe(meta.id, testId),
    title: toStringSafe(meta.title, toStringSafe(attempt.practice_test_title, "Reading Test")),
    durationMinutes: Math.max(1, Math.ceil(toNumberSafe(durationSeconds, 3600) / 60)),
    totalQuestions: toNumberSafe(attempt.total_questions, questions.length),
    passages,
    questions
  };
}

function hasAttemptQuestionData(attempt: StudentAttemptDetail) {
  return attempt.reading_passages.some((passage) =>
    passage.question_groups.some((group) => Array.isArray(group.questions) && group.questions.length > 0)
  );
}

export default function ReadingTestPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("readingTest");

  const testId = typeof params?.id === "string" ? params.id : "";
  const restartRequested = searchParams.get("restart") === "1";
  const modeParam = searchParams.get("mode");
  const requestedMode: AttemptMode | null =
    modeParam === "real" || modeParam === "practice" ? modeParam : null;
  const demoTest = getStaticReadingTestById(testId);
  const shouldLoadFromBackend =
    Boolean(testId)
    && (
      requestedMode !== null
      || restartRequested
      || !demoTest
      || demoTest.questions.length === 0
    );
  const [test, setTest] = useState<ReadingFullTest | null>(shouldLoadFromBackend ? null : (demoTest ?? null));
  const [backendAttemptId, setBackendAttemptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(shouldLoadFromBackend);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldLoadFromBackend || !testId) return;

    let active = true;

    const loadBackendTest = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const listed = await studentTestsService.listReadingAllPages({ pageSize: 100 });
        if (!active) return;

        const matched = listed.results.find((item) => String(item.id) === testId);
        if (!matched) {
          setTest(null);
          setBackendAttemptId(null);
          setLoadError(t("notFoundDesc"));
          return;
        }

        const attempt = await studentAttemptsService.create({
          practice_test: testId,
          mode: requestedMode === "real" ? "REAL" : "PRACTICE"
        });
        if (!active) return;

        const hydratedAttempt =
          hasAttemptQuestionData(attempt)
            ? attempt
            : await studentAttemptsService.getById(String(attempt.id));
        if (!active) return;

        let finalAttempt = hydratedAttempt;
        if (
          !hasAttemptQuestionData(finalAttempt)
          && toStringSafe(finalAttempt.status).toUpperCase() === "IN_PROGRESS"
          && toNumberSafe(finalAttempt.answered_count, 0) === 0
        ) {
          try {
            await studentAttemptsService.submit(String(finalAttempt.id), {
              time_used_seconds: 0,
              answers: []
            });
            if (!active) return;

            const freshAttempt = await studentAttemptsService.create({
              practice_test: testId,
              mode: requestedMode === "real" ? "REAL" : "PRACTICE"
            });
            if (!active) return;
            finalAttempt = hasAttemptQuestionData(freshAttempt)
              ? freshAttempt
              : await studentAttemptsService.getById(String(freshAttempt.id));
            if (!active) return;
          } catch {
            // Keep original attempt and surface generic empty-data error below.
          }
        }

        const mappedTest = mapBackendAttemptToReadingTest(testId, matched, finalAttempt);
        if (!mappedTest.questions.length) {
          throw new Error("No questions returned for this reading attempt.");
        }
        setBackendAttemptId(String(finalAttempt.id));
        saveRuntimeReadingTest(mappedTest);
        setTest(mappedTest);
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof StudentApiError
            ? error.message
            : t.has("loadFailed")
              ? t("loadFailed")
              : "Failed to load this reading test from backend.";
        setLoadError(message);
        setBackendAttemptId(null);
        setTest(null);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadBackendTest();

    return () => {
      active = false;
    };
  }, [requestedMode, restartRequested, shouldLoadFromBackend, t, testId]);

  if (isLoading) {
    return (
      <div className="mx-auto mt-8 max-w-xl px-4">
        <Card className="gap-3 p-6">
          <h1 className="text-xl font-semibold">{t.has("loadingTitle") ? t("loadingTitle") : "Loading test..."}</h1>
          <p className="text-sm text-muted-foreground">
            {t.has("loadingDesc") ? t("loadingDesc") : "Fetching test content from backend."}
          </p>
        </Card>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="mx-auto mt-8 max-w-xl px-4">
        <Card className="gap-3 p-6">
          <h1 className="text-xl font-semibold">{t("notFoundTitle")}</h1>
          <p className="text-sm text-muted-foreground">{loadError ?? t("notFoundDesc")}</p>
          <Button asChild className="mt-2 w-fit">
            <Link href={`/${locale}/reading`}>{t("backToReading")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <ReadingTestClient
      key={test.id}
      test={test}
      backendAttemptId={backendAttemptId}
      restartRequested={restartRequested}
      requestedMode={requestedMode}
    />
  );
}

type ReadingTestClientProps = {
  test: ReadingFullTest;
  backendAttemptId?: string | null;
  restartRequested?: boolean;
  requestedMode?: AttemptMode | null;
};

function ReadingTestClient({
  test,
  backendAttemptId = null,
  restartRequested = false,
  requestedMode = null
}: ReadingTestClientProps) {
  const t = useTranslations("readingTest");
  const tReadingResult = useTranslations("readingResult");
  const tOptions = useTranslations("testOptions");
  const locale = useLocale();
  type RealModeInterruptionReason = "fullscreen" | "visibility";
  const [attemptId, setAttemptId] = useState<string>("");
  const [startedAt, setStartedAt] = useState<number>(0);
  const [finishOpen, setFinishOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  const [activePassageId, setActivePassageId] = useState<"p1" | "p2" | "p3">("p1");
  const [activeQuestionNumber, setActiveQuestionNumber] = useState(1);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"passage" | "questions">("passage");
  const [remainingSeconds, setRemainingSeconds] = useState(test.durationMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [attemptMode, setAttemptMode] = useState<AttemptMode | null>(null);
  const [modePickerStep, setModePickerStep] = useState<"choose" | "realConfirm">("choose");
  const [realModeStartPending, setRealModeStartPending] = useState(false);
  const [realModeInterruption, setRealModeInterruption] = useState<RealModeInterruptionReason | null>(null);
  const [realModeInterruptionCount, setRealModeInterruptionCount] = useState({
    fullscreen: 0,
    visibility: 0,
  });
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [backendReviewData, setBackendReviewData] = useState<AdaptedReadingBackendReview | null>(null);
  const splitStorageKey = "readingSplitPct";
  const [splitPct, setSplitPct] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SPLIT;
    try {
      const rawSplit = window.localStorage.getItem(splitStorageKey);
      const parsedSplit = rawSplit ? Number(rawSplit) : NaN;
      return Number.isFinite(parsedSplit)
        ? clampSplitPct(parsedSplit)
        : DEFAULT_SPLIT;
    } catch {
      return DEFAULT_SPLIT;
    }
  });
  const [highlights, setHighlights] = useState<ReadingHighlight[]>(() => {
    if (typeof window === "undefined") return [];
    return loadReadingHighlights(test.id);
  });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const {
    appearance,
    setContrast,
    setTextSize,
    isFullscreen,
    toggleFullscreen,
  } = useTestAppearance("test-taking");

  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const questionsScrollRef = useRef<HTMLDivElement | null>(null);
  const passageScrollRef = useRef<HTMLDivElement | null>(null);
  const questionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const pendingParagraphRef = useRef<string | null>(null);
  const shouldAutoScrollQuestionRef = useRef(false);
  const realModeAutoFinishedRef = useRef(false);
  const fullscreenRequestInFlightRef = useRef(false);
  const initDoneRef = useRef(false);
  const backendSaveChainRef = useRef<Promise<void>>(Promise.resolve());
  const initialBackendSaveAttemptRef = useRef<string | null>(null);
  const leaveWarningMessage = t.has("leaveWarning")
    ? t("leaveWarning")
    : "Are you sure you want to quit this test? Your results will not be saved.";

  useTestLeaveWarning({
    enabled: Boolean(attemptId) && !reviewMode,
    message: leaveWarningMessage,
  });

  const resetAttemptState = (nextMode: AttemptMode | null = null) => {
    const freshAttemptId = createAttemptId();
    setAttemptId(freshAttemptId);
    setStartedAt(Date.now());
    setAttemptMode(nextMode);
    setModePickerStep("choose");
    setRealModeStartPending(false);
    setRealModeInterruption(null);
    setRealModeInterruptionCount({ fullscreen: 0, visibility: 0 });
    setFinishOpen(false);
    setReviewMode(false);
    setBackendReviewData(null);
    setExpandedExplanations(new Set());
    setActivePassageId("p1");
    setActiveQuestionNumber(1);
    setAnswers({});
    setMarked(new Set());
    setPaletteOpen(false);
    setMobilePanel("passage");
    setRemainingSeconds(test.durationMinutes * 60);
    setTimerRunning(nextMode === "real");
    setHighlights([]);
    realModeAutoFinishedRef.current = false;
    shouldAutoScrollQuestionRef.current = false;
    pendingParagraphRef.current = null;
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

    const latestId = loadLatestAttemptId("reading", test.id);
    const saved = latestId ? loadAttemptProgress("reading", test.id, latestId) : null;

    if (saved) {
      const restoredMode = saved.mode ?? "practice";
      const hydrateTimer = window.setTimeout(() => {
        setAttemptId(saved.attemptId);
        setAnswers(saved.answers as Record<string, AnswerValue>);
        setMarked(new Set(saved.markedQuestionIds));
        setStartedAt(saved.startedAt);
        setRemainingSeconds(saved.timeRemainingSec);
        setAttemptMode(restoredMode);
        setTimerRunning(restoredMode === "real" && saved.timeRemainingSec > 0);
        realModeAutoFinishedRef.current = false;
      }, 0);
      return () => window.clearTimeout(hydrateTimer);
    }

    const initTimer = window.setTimeout(() => {
      const newAttemptId = createAttemptId();
      setAttemptId(newAttemptId);
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

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setIsCompact(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(splitStorageKey, String(splitPct));
    } catch {
      // Ignore storage failures.
    }
  }, [splitPct, splitStorageKey]);

  useEffect(() => {
    saveReadingHighlights(test.id, highlights);
  }, [highlights, test.id]);

  useEffect(() => {
    if (!timerRunning || remainingSeconds <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerRunning, remainingSeconds]);

  const questionsByNumber = useMemo(
    () => new Map(test.questions.map((question) => [question.number, question])),
    [test.questions]
  );

  const passageQuestions = useMemo(
    () => test.questions.filter((question) => question.passageId === activePassageId),
    [test.questions, activePassageId]
  );

  const answeredNumbers = useMemo(() => {
    const set = new Set<number>();
    test.questions.forEach((question) => {
      if (isAnswered(answers[question.id])) {
        set.add(question.number);
      }
    });
    return set;
  }, [answers, test.questions]);

  const groupedQuestions = useMemo(() => {
    const groups: Array<{ title: string; instruction?: string; questions: ReadingQuestion[] }> = [];
    for (const question of passageQuestions) {
      const found = groups.find((group) => group.title === question.groupTitle);
      if (found) {
        found.questions.push(question);
      } else {
        groups.push({
          title: question.groupTitle,
          instruction: question.groupInstruction,
          questions: [question],
        });
      }
    }
    return groups;
  }, [passageQuestions]);

  const reviewQuestions = useMemo(
    () => backendReviewData?.questions ?? test.questions,
    [backendReviewData, test.questions]
  );

  const reviewAnswers = useMemo(
    () => (backendReviewData ? normalizeBackendReviewAnswers(backendReviewData.answers) : answers),
    [answers, backendReviewData]
  );

  const gradeableQuestions = useMemo<GradeableQuestion[]>(
    () =>
      reviewQuestions.map((question) => ({
        id: question.id,
        number: question.number,
        type: question.type,
        correctAnswer: question.correctAnswer,
        acceptableAnswers: question.acceptableAnswers,
      })),
    [reviewQuestions]
  );

  const grading = useMemo(() => gradeTest(gradeableQuestions, reviewAnswers), [gradeableQuestions, reviewAnswers]);

  const highlightsForPassage = useMemo(() => {
    if (!reviewMode) return [] as HighlightItem[];
    return reviewQuestions.flatMap((question) =>
      question.evidenceSpans
        .filter((span) => span.passageId === activePassageId)
        .map((span) => ({
          questionNumber: question.number,
          phrase: span.phrase,
          paragraphIndex: span.paragraphIndex,
        }))
    );
  }, [activePassageId, reviewMode, reviewQuestions]);

  useEffect(() => {
    passageScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    questionsScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePassageId]);

  useEffect(() => {
    const target = mobilePanel === "passage" ? passageScrollRef.current : questionsScrollRef.current;
    target?.scrollTo({ top: 0, behavior: "smooth" });
  }, [mobilePanel]);

  useEffect(() => {
    if (!shouldAutoScrollQuestionRef.current) {
      return;
    }
    const el = questionRefs.current.get(activeQuestionNumber);
    const container = questionsScrollRef.current;
    if (!el || !container) {
      shouldAutoScrollQuestionRef.current = false;
      return;
    }
    const top = Math.max(el.offsetTop - 84, 0);
    container.scrollTo({ top, behavior: "smooth" });
    shouldAutoScrollQuestionRef.current = false;
  }, [activeQuestionNumber, activePassageId]);

  useEffect(() => {
    const pendingId = pendingParagraphRef.current;
    if (!pendingId) return;
    const target = document.getElementById(pendingId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    pendingParagraphRef.current = null;
  }, [activePassageId, reviewMode]);

  useEffect(() => {
    if (!attemptId || !attemptMode) return;
    saveAttemptProgress({
      attemptId,
      backendAttemptId: backendAttemptId ?? undefined,
      module: "reading",
      testId: test.id,
      mode: attemptMode,
      answers,
      markedQuestionIds: [...marked],
      startedAt,
      timeRemainingSec: remainingSeconds,
      timerUsed: timerRunning || remainingSeconds !== test.durationMinutes * 60,
    });
  }, [answers, attemptId, attemptMode, backendAttemptId, marked, remainingSeconds, startedAt, test.durationMinutes, test.id, timerRunning]);

  const resolveTimeUsedSeconds = useCallback(
    (finishedAtMs?: number) => {
      const finishedAt = typeof finishedAtMs === "number" ? finishedAtMs : Date.now();
      const timerUsed = timerRunning || remainingSeconds !== test.durationMinutes * 60;
      const timerSpentSeconds = Math.max(0, test.durationMinutes * 60 - remainingSeconds);
      const elapsedSeconds = Math.max(0, Math.floor((finishedAt - startedAt) / 1000));
      return timerUsed ? timerSpentSeconds : elapsedSeconds;
    },
    [remainingSeconds, startedAt, test.durationMinutes, timerRunning]
  );

  const saveAttemptToBackend = useCallback(
    (options?: {strict?: boolean; includeAnswers?: boolean; context?: string; finishedAtMs?: number}) => {
      const strict = Boolean(options?.strict);
      const includeAnswers = options?.includeAnswers ?? true;
      const context = options?.context ?? "unspecified";

      const runSave = async () => {
        if (!backendAttemptId || reviewMode) return;

        const [snapshot, rawSnapshot] = await Promise.all([
          studentAttemptsService.getById(backendAttemptId),
          studentAttemptsService.getByIdRaw(backendAttemptId)
        ]);
        const submitCandidatesByNumber = collectAttemptSubmitCandidatesByNumber(snapshot);
        const rawSubmitCandidatesByNumber = collectAttemptRawSubmitCandidatesByNumber(rawSnapshot);

        let activeEntries = includeAnswers
          ? collectBackendAttemptAnswerEntries({
              questions: test.questions,
              answers,
              marked,
              submitCandidatesByNumber,
              rawSubmitCandidatesByNumber
            })
          : [];
        const currentIds = new Map<string, string>();
        activeEntries.forEach((entry) => {
          const initialId = entry.candidateIds[0] ?? "";
          if (initialId) {
            currentIds.set(entry.questionKey, initialId);
          }
        });

        const maxAttempts = 14;
        let attemptIndex = 0;
        while (attemptIndex < maxAttempts) {
          const payloadAnswers = activeEntries
            .map((entry) => {
              const questionId = currentIds.get(entry.questionKey) ?? "";
              const answerPayload = toBackendAnswerPayload(entry.answer);
              if (!questionId || (answerPayload === null && !entry.is_flagged)) {
                return null;
              }
              return {
                question_id: questionId,
                answer: answerPayload,
                is_flagged: entry.is_flagged
              };
            })
            .filter(
              (item): item is {question_id: string; answer: {answer: string} | {answers: string[]} | null; is_flagged: boolean} =>
                item !== null
            );

          try {
            await studentAttemptsService.save(backendAttemptId, {
              time_used_seconds: resolveTimeUsedSeconds(options?.finishedAtMs),
              answers: payloadAnswers
            });
            return;
          } catch (error) {
            const failedQuestionIds = extractValidationAnswerQuestionIdFailures(error);
            if (!failedQuestionIds.size) {
              throw error;
            }

            let changed = false;
            for (const entry of activeEntries) {
              const currentId = currentIds.get(entry.questionKey) ?? "";
              if (!currentId || !failedQuestionIds.has(currentId)) continue;
              const nextCandidate = entry.candidateIds.find((candidate) => candidate && candidate !== currentId);
              if (nextCandidate) {
                currentIds.set(entry.questionKey, nextCandidate);
                changed = true;
              }
            }

            if (!changed) {
              const before = activeEntries.length;
              activeEntries = activeEntries.filter((entry) => {
                const currentId = currentIds.get(entry.questionKey) ?? "";
                return !currentId || !failedQuestionIds.has(currentId);
              });
              changed = activeEntries.length < before;
            }

            if (!changed) {
              throw error;
            }
          }

          attemptIndex += 1;
        }
      };

      const run = backendSaveChainRef.current.then(runSave, runSave);
      backendSaveChainRef.current = run.catch(() => undefined);

      if (strict) {
        return run;
      }

      return run.catch((error) => {
        console.warn("[reading save] save failed", {
          attemptId: backendAttemptId,
          context,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    },
    [answers, backendAttemptId, marked, resolveTimeUsedSeconds, reviewMode, test.questions]
  );

  useEffect(() => {
    if (!backendAttemptId) {
      initialBackendSaveAttemptRef.current = null;
    }
  }, [backendAttemptId]);

  useEffect(() => {
    setBackendReviewData(null);
  }, [backendAttemptId, test.id]);

  useEffect(() => {
    if (!backendAttemptId || reviewMode) return;
    if (initialBackendSaveAttemptRef.current === backendAttemptId) return;
    initialBackendSaveAttemptRef.current = backendAttemptId;
    void saveAttemptToBackend({
      includeAnswers: false,
      context: "enter"
    });
  }, [backendAttemptId, reviewMode, saveAttemptToBackend]);

  useEffect(() => {
    if (!backendAttemptId || !attemptMode || reviewMode) return;
    const autosaveTimer = window.setTimeout(() => {
      void saveAttemptToBackend({
        includeAnswers: true,
        context: "change"
      });
    }, 900);
    return () => window.clearTimeout(autosaveTimer);
  }, [answers, attemptMode, backendAttemptId, marked, reviewMode, saveAttemptToBackend]);

  useEffect(() => {
    if (!backendAttemptId || !attemptMode || reviewMode) return;
    const intervalId = window.setInterval(() => {
      void saveAttemptToBackend({
        includeAnswers: false,
        context: "interval"
      });
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, [attemptMode, backendAttemptId, reviewMode, saveAttemptToBackend]);

  const currentQuestion = questionsByNumber.get(activeQuestionNumber);
  const answeredCount = answeredNumbers.size;
  const unansweredCount = test.totalQuestions - answeredCount;
  const timeSpent = test.durationMinutes * 60 - remainingSeconds;
  const isRealMode = attemptMode === "real";
  const realModeLocked = isRealMode && !reviewMode && realModeInterruption !== null;
  const showModePicker = attemptMode === null && !reviewMode;
  const gridPct = splitPct;
  const passagePaletteSections = useMemo(() => {
    return test.passages.map((passage, index) => {
      const numbers = test.questions
        .filter((question) => question.passageId === passage.id)
        .map((question) => question.number)
        .sort((a, b) => a - b);

      const answered = numbers.reduce((count, number) => {
        const question = questionsByNumber.get(number);
        if (!question) return count;
        return count + (isAnswered(answers[question.id]) ? 1 : 0);
      }, 0);

      return {
        passageId: passage.id,
        index: index + 1,
        numbers,
        answered,
      };
    });
  }, [answers, questionsByNumber, test.passages, test.questions]);
  const activePassage = useMemo(
    () => test.passages.find((passage) => passage.id === activePassageId),
    [activePassageId, test.passages]
  );

  const passageParagraphs = useMemo(() => {
    const text = activePassage?.text ?? "";
    const paragraphs = text.split("\n\n");
    return paragraphs.map((paragraph, index) => ({
      paragraph,
      index,
      start: paragraphs
        .slice(0, index)
        .reduce((total, item) => total + item.length + 2, 0),
    }));
  }, [activePassage]);

  const getPassageLocalHighlights = (paragraphStart: number, paragraphLength: number) => {
    return highlights
      .filter((item) => item.scope === "passage" && item.passageId === activePassageId)
      .filter((item) => item.start < paragraphStart + paragraphLength && item.end > paragraphStart)
      .map((item) => ({
        id: item.id,
        start: Math.max(0, item.start - paragraphStart),
        end: Math.min(paragraphLength, item.end - paragraphStart),
        color: item.color,
      }))
      .filter((item) => item.end > item.start);
  };

  const getQuestionLocalHighlights = (questionId: string, base: number, length: number) => {
    return highlights
      .filter((item) => item.scope === "question" && item.questionId === questionId)
      .filter((item) => item.start < base + length && item.end > base)
      .map((item) => ({
        id: item.id,
        start: Math.max(0, item.start - base),
        end: Math.min(length, item.end - base),
        color: item.color,
      }))
      .filter((item) => item.end > item.start);
  };

  const getPassageTitleLocalHighlights = (passageId: string, length: number) => {
    const key = `passage-title:${passageId}`;
    return highlights
      .filter((item) => item.scope === "question" && item.questionId === key)
      .filter((item) => item.start < length && item.end > 0)
      .map((item) => ({
        id: item.id,
        start: Math.max(0, item.start),
        end: Math.min(length, item.end),
        color: item.color,
      }))
      .filter((item) => item.end > item.start);
  };

  const toggleHighlight = (
    payload:
      | { scope: "question"; questionId: string; start: number; end: number; color: ReadingHighlightColor; action: "mark" | "unmark" }
      | { scope: "passage"; passageId: string; start: number; end: number; color: ReadingHighlightColor; action: "mark" | "unmark" }
  ) => {
    setHighlights((prev) => {
      if (payload.scope === "passage") {
        const passageHighlights = prev.filter(
          (item): item is ReadingHighlight & { passageId: string } =>
            item.scope === "passage" && item.passageId === payload.passageId
        );

        const passageRanges = mergeRanges(
          passageHighlights.map((item) => ({ start: item.start, end: item.end }))
        );
        const nextRanges =
          payload.action === "unmark"
            ? subtractRangeFromRanges(passageRanges, payload.start, payload.end)
            : mergeRanges([...passageRanges, { start: payload.start, end: payload.end }]);

        const base = prev.filter((item) => !(item.scope === "passage" && item.passageId === payload.passageId));
        const rebuiltPassage: ReadingHighlight[] = nextRanges.map((range) => {
          const existing = passageHighlights.find((item) => item.start === range.start && item.end === range.end);
          return {
            id: existing?.id ?? `passage-${range.start}-${range.end}-${Date.now()}`,
            scope: "passage",
            passageId: payload.passageId,
            start: range.start,
            end: range.end,
            color: existing?.color ?? payload.color,
            createdAt: existing?.createdAt ?? Date.now(),
          };
        });
        return [...base, ...rebuiltPassage];
      }

      const questionHighlights = prev.filter(
        (item): item is ReadingHighlight & { questionId: string } =>
          item.scope === "question" && item.questionId === payload.questionId
      );
      const questionRanges = mergeRanges(
        questionHighlights.map((item) => ({ start: item.start, end: item.end }))
      );
      const nextRanges =
        payload.action === "unmark"
          ? subtractRangeFromRanges(questionRanges, payload.start, payload.end)
          : mergeRanges([...questionRanges, { start: payload.start, end: payload.end }]);

      const base = prev.filter((item) => !(item.scope === "question" && item.questionId === payload.questionId));
      const rebuiltQuestion: ReadingHighlight[] = nextRanges.map((range) => {
        const existing = questionHighlights.find((item) => item.start === range.start && item.end === range.end);
        return {
          id: existing?.id ?? `question-${range.start}-${range.end}-${Date.now()}`,
          scope: "question",
          questionId: payload.questionId,
          start: range.start,
          end: range.end,
          color: existing?.color ?? payload.color,
          createdAt: existing?.createdAt ?? Date.now(),
        };
      });
      return [...base, ...rebuiltQuestion];
    });
  };

  const goToQuestion = (number: number) => {
    const target = questionsByNumber.get(number);
    if (!target) {
      return;
    }
    shouldAutoScrollQuestionRef.current = true;
    if (isCompact) {
      setMobilePanel("questions");
    }
    setActivePassageId(target.passageId);
    setActiveQuestionNumber(number);
  };

  const handlePassageChange = (value: string) => {
    const nextPassage = value as "p1" | "p2" | "p3";
    setActivePassageId(nextPassage);

    const activeQuestion = questionsByNumber.get(activeQuestionNumber);
    if (activeQuestion?.passageId === nextPassage) {
      return;
    }

    const firstInPassage = test.questions.find((question) => question.passageId === nextPassage);
    if (firstInPassage) {
      setActiveQuestionNumber(firstInPassage.number);
    }
  };

  const openExplanation = (question: ReadingQuestion) => {
    setExpandedExplanations((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) {
        next.delete(question.id);
      } else {
        next.add(question.id);
      }
      return next;
    });

    const evidence = question.evidenceSpans[0];
    if (!evidence) return;
    const paragraphId = `para-${evidence.passageId}-${evidence.paragraphIndex}`;
    pendingParagraphRef.current = paragraphId;
    if (evidence.passageId !== activePassageId) {
      setActivePassageId(evidence.passageId);
      return;
    }
    const target = document.getElementById(paragraphId);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const jumpToEvidenceFromReview = useCallback(
    (questionId: string) => {
      const question = reviewQuestions.find((item) => item.id === questionId);
      const evidence = question?.evidenceSpans[0];
      if (!evidence) return;

      const paragraphId = `para-${evidence.passageId}-${evidence.paragraphIndex}`;
      pendingParagraphRef.current = paragraphId;
      if (evidence.passageId !== activePassageId) {
        setActivePassageId(evidence.passageId);
        return;
      }
      const target = document.getElementById(paragraphId);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [activePassageId, reviewQuestions]
  );

  const finishTest = useCallback(async () => {
    if (!attemptId || isSubmittingResult) return;
    setIsSubmittingResult(true);

    const finishedAt = Date.now();
    const timerUsed = timerRunning || remainingSeconds !== test.durationMinutes * 60;
    const timeUsedSeconds = resolveTimeUsedSeconds(finishedAt);

    try {
      if (backendAttemptId) {
        await saveAttemptToBackend({
          strict: true,
          includeAnswers: true,
          context: "finish-pre-submit",
          finishedAtMs: finishedAt
        });
        await studentAttemptsService.submit(backendAttemptId, {
          time_used_seconds: timeUsedSeconds,
          answers: []
        });
        const reviewResponse = await studentAttemptsService.review(backendAttemptId);
        setBackendReviewData(adaptReadingBackendReview(reviewResponse));
      }

      saveAttemptResult({
        attemptId,
        backendAttemptId: backendAttemptId ?? undefined,
        module: "reading",
        testId: test.id,
        mode: attemptMode ?? "practice",
        answers,
        markedQuestionIds: [...marked],
        startedAt,
        finishedAt,
        timeRemainingSec: remainingSeconds,
        timerUsed,
      });

      setReviewMode(true);
      setFinishOpen(false);
      setTimerRunning(false);
    } catch (error) {
      console.error("Reading submit failed", error);
    } finally {
      setIsSubmittingResult(false);
    }
  }, [
    answers,
    attemptId,
    attemptMode,
    backendAttemptId,
    isSubmittingResult,
    marked,
    remainingSeconds,
    resolveTimeUsedSeconds,
    saveAttemptToBackend,
    startedAt,
    test.durationMinutes,
    test.id,
    timerRunning,
  ]);

  const requestRealModeFullscreen = useCallback(async () => {
    if (typeof document === "undefined") {
      return false;
    }
    if (document.fullscreenElement) {
      return true;
    }

    try {
      fullscreenRequestInFlightRef.current = true;
      await document.documentElement.requestFullscreen();
      return Boolean(document.fullscreenElement);
    } catch {
      return Boolean(document.fullscreenElement);
    } finally {
      window.setTimeout(() => {
        fullscreenRequestInFlightRef.current = false;
      }, 120);
    }
  }, []);

  const triggerRealModeInterruption = useCallback(
    (reason: RealModeInterruptionReason) => {
      if (!isRealMode || reviewMode) {
        return;
      }
      setRealModeInterruptionCount((prev) => ({
        ...prev,
        [reason]: prev[reason] + 1,
      }));
      setRealModeInterruption((prev) => prev ?? reason);
    },
    [isRealMode, reviewMode]
  );

  const leaveRealMode = useCallback(() => {
    setAttemptMode("practice");
    setTimerRunning(false);
    setRealModeInterruption(null);
    setModePickerStep("choose");
    if (typeof document !== "undefined" && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  const returnToRealMode = useCallback(async () => {
    const enteredFullscreen = await requestRealModeFullscreen();
    if (!enteredFullscreen) {
      setRealModeInterruption("fullscreen");
      return;
    }
    setRealModeInterruption(null);
  }, [requestRealModeFullscreen]);

  const startRealMode = useCallback(async () => {
    setRealModeStartPending(true);
    const enteredFullscreen = await requestRealModeFullscreen();
    setAttemptMode("real");
    setTimerRunning(true);
    setModePickerStep("choose");
    setRealModeStartPending(false);

    if (!enteredFullscreen) {
      setRealModeInterruptionCount((prev) => ({
        ...prev,
        fullscreen: prev.fullscreen + 1,
      }));
      setRealModeInterruption("fullscreen");
    } else {
      setRealModeInterruption(null);
    }
  }, [requestRealModeFullscreen]);

  const chooseAttemptMode = (mode: AttemptMode) => {
    realModeAutoFinishedRef.current = false;
    setAttemptMode(mode);

    if (mode === "real") {
      setTimerRunning(true);
      return;
    }

    setTimerRunning(false);
  };

  useEffect(() => {
    if (!isRealMode || reviewMode || isFullscreen || realModeInterruption !== null) {
      return;
    }
    void requestRealModeFullscreen().then((enteredFullscreen) => {
      if (!enteredFullscreen) {
        triggerRealModeInterruption("fullscreen");
      }
    });
  }, [isFullscreen, isRealMode, realModeInterruption, requestRealModeFullscreen, reviewMode, triggerRealModeInterruption]);

  useEffect(() => {
    if (!isRealMode || reviewMode || realModeInterruption !== null) {
      return;
    }
    if (isFullscreen || fullscreenRequestInFlightRef.current) {
      return;
    }
    triggerRealModeInterruption("fullscreen");
  }, [isFullscreen, isRealMode, realModeInterruption, reviewMode, triggerRealModeInterruption]);

  useEffect(() => {
    if (!isRealMode || reviewMode) {
      return;
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerRealModeInterruption("visibility");
      }
    };
    const onWindowBlur = () => {
      triggerRealModeInterruption("visibility");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [isRealMode, reviewMode, triggerRealModeInterruption]);

  useEffect(() => {
    if (!isRealMode || reviewMode) {
      return;
    }

    const isEditableTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(
        target.closest(
          "input, textarea, select, [contenteditable='true'], [role='textbox']"
        )
      );

    const onCopy = (event: ClipboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };

    const onSelectStart = (event: Event) => {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };

    const onContextMenu = (event: MouseEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
        if (isEditableTarget(event.target)) {
          return;
        }
        event.preventDefault();
      }
    };

    document.addEventListener("copy", onCopy);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isRealMode, reviewMode]);

  useEffect(() => {
    if (!isRealMode || reviewMode || remainingSeconds > 0 || realModeAutoFinishedRef.current) {
      return;
    }

    realModeAutoFinishedRef.current = true;
    const finishTimer = window.setTimeout(() => {
      finishTest();
    }, 0);
    return () => window.clearTimeout(finishTimer);
  }, [finishTest, isRealMode, remainingSeconds, reviewMode]);

  const handleRestartTest = () => {
    const confirmMessage = t.has("restartConfirm")
      ? t("restartConfirm")
      : "Restart this test? Your current answers will be cleared.";
    if (!window.confirm(confirmMessage)) {
      return;
    }
    resetAttemptState();
  };

  const updateSplitFromClientX = (clientX: number) => {
    const container = splitContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;

    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPct(clampSplitPct(pct));
  };

  const handleDividerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isCompact) return;
    event.preventDefault();

    const onMove = (moveEvent: PointerEvent) => {
      updateSplitFromClientX(moveEvent.clientX);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    updateSplitFromClientX(event.clientX);
  };

  return (
    <section
      data-test-contrast={appearance.contrast}
      data-test-size={appearance.textSize}
      className="test-appearance-root -mx-4 -my-4 flex h-[calc(100vh-2rem)] flex-col overflow-x-hidden overflow-y-hidden bg-background text-foreground sm:-mx-5 lg:-mx-10 lg:-my-8"
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="relative flex min-h-16 flex-wrap items-center justify-between gap-3 px-3 py-2 sm:px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <BookOpen className="size-4.5" aria-hidden="true" />
            </span>
            <p className="truncate text-base font-semibold sm:text-lg">IELTS MASTER</p>
            <Separator orientation="vertical" className="hidden h-6 md:block" />
            <p className="hidden truncate text-sm text-muted-foreground md:block">{t("title")}</p>
          </div>

          {!reviewMode ? (
            <div className="order-3 flex w-full items-center justify-center gap-2 sm:order-none sm:absolute sm:left-1/2 sm:top-1/2 sm:w-auto sm:-translate-x-1/2 sm:-translate-y-1/2">
              <Badge variant="secondary" className="h-9 rounded-xl border border-border/60 bg-card px-3 text-sm font-semibold text-foreground sm:h-10 sm:text-base">
                <Clock3 className="size-4" aria-hidden="true" />
                {formatTime(remainingSeconds)}
              </Badge>
              <Button
                type="button"
                aria-label={
                  isRealMode
                    ? "Timer is locked in real mode"
                    : timerRunning
                      ? t("stopTimer")
                      : t("startTimer")
                }
                variant={isRealMode || timerRunning ? "outline" : "default"}
                disabled={isRealMode}
                onClick={() => {
                  if (isRealMode) {
                    return;
                  }
                  if (!timerRunning && remainingSeconds <= 0) {
                    setRemainingSeconds(test.durationMinutes * 60);
                  }
                  setTimerRunning((prev) => !prev);
                }}
                className="h-9 rounded-xl px-4 sm:h-10"
              >
                {isRealMode ? <Clock3 className="size-4" /> : timerRunning ? <Square className="size-4" /> : <Play className="size-4" />}
                {isRealMode ? "Real mode" : timerRunning ? t("stop") : t("start")}
              </Button>
            </div>
          ) : null}

          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={toggleFullscreen}
              className="h-9 w-9 rounded-xl border-border/70 bg-background/60 p-0 sm:h-10 sm:w-10"
              aria-label={isFullscreen ? tOptions("exitFullscreen") : tOptions("enterFullscreen")}
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOptionsOpen(true)}
              className="h-9 w-9 rounded-xl border-border/70 bg-background/60 p-0 sm:h-10 sm:w-10"
              aria-label={tOptions("title")}
            >
              <Menu className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setHighlights([])}
              className="h-9 rounded-xl px-3 text-xs sm:h-10 sm:text-sm"
            >
              {t.has("clearHighlights") ? t("clearHighlights") : "Clear highlights"}
            </Button>
            {reviewMode ? (
              <>
                <Button
                  type="button"
                  asChild
                  className="h-9 rounded-xl bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-600/90 sm:h-10 sm:px-6"
                >
                  <Link href={`/${locale}/reading/${test.id}/result?attempt=${backendAttemptId ?? attemptId}`}>
                    {tReadingResult("resultsButton")}
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-label={t.has("restartTest") ? t("restartTest") : "Restart test"}
                  onClick={handleRestartTest}
                  className="h-9 rounded-xl px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
                >
                  <RotateCcw className="size-4" />
                  {t.has("restartTest") ? t("restartTest") : "Restart test"}
                </Button>
              </>
            ) : (
              <Button
                aria-label={t("finishTest")}
                onClick={() => setFinishOpen(true)}
                disabled={!attemptMode}
                className="h-9 rounded-xl bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-600/90 disabled:opacity-70 sm:h-10 sm:px-6"
              >
                {t("finishTest")}
              </Button>
            )}
            <Avatar aria-label={t("userAvatar")}>
              <AvatarFallback className="bg-muted text-muted-foreground">
                <User className="size-4" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="test-panel border-b border-border/70 px-3 py-2 lg:hidden">
        <div className="grid grid-cols-2 rounded-xl border border-border bg-card/70 p-1">
          <Button
            type="button"
            variant={mobilePanel === "passage" ? "secondary" : "ghost"}
            className="h-8 rounded-lg"
            onClick={() => setMobilePanel("passage")}
            aria-label={t("passageLabel", { index: 1 })}
          >
            {t("passageLabel", { index: Number(activePassageId.slice(1)) })}
          </Button>
          <Button
            type="button"
            variant={mobilePanel === "questions" ? "secondary" : "ghost"}
            className="h-8 rounded-lg"
            onClick={() => setMobilePanel("questions")}
            aria-label={t("questionPalette")}
          >
            {t("questions")}
          </Button>
        </div>
      </div>

      <main
        ref={splitContainerRef}
        className={cn(
          "test-scaleable grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-(--reading-grid)",
          isRealMode && !reviewMode && "reading-real-mode-content"
        )}
        style={{ "--reading-grid": `${gridPct}% 8px minmax(0, 1fr)` } as CSSProperties}
      >
        <div className={cn("min-h-0 min-w-0", isCompact && mobilePanel !== "passage" && "hidden")}>
          <div className="flex h-full min-h-0 flex-col overflow-hidden border-b border-border/70 bg-background/45 lg:border-b-0">
            <Tabs value={activePassageId} onValueChange={handlePassageChange} className="shrink-0">
              <div className="sticky top-0 z-10 border-b border-border/75 bg-background/92 px-3 pt-1 backdrop-blur supports-backdrop-filter:bg-background/90">
                <TabsList className="h-11 w-full justify-start overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {test.passages.map((passage, index) => (
                    <TabsTrigger key={passage.id} value={passage.id} className="h-11 shrink-0 px-4 text-sm" aria-label={`Passage ${index + 1}`}>
                      {t("passageLabel", { index: index + 1 })}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>

            <div
              ref={passageScrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-6 lg:py-6 [scrollbar-color:hsl(var(--border))_transparent]"
            >
              <div className="mx-auto flex max-w-[72ch] min-w-0 flex-col items-stretch justify-start space-y-5 pb-8">
                <p className="text-xs font-semibold tracking-[0.18em] text-blue-600 uppercase dark:text-blue-400">{activePassageId.toUpperCase()}</p>
                <h2 className="wrap-break-word text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  <HighlightableText
                    text={activePassage?.title ?? ""}
                    userHighlights={getPassageTitleLocalHighlights(activePassageId, (activePassage?.title ?? "").length)}
                    notesStorageKey={`reading:${test.id}:notes`}
                    noteScopeKey={`passage-title:${activePassageId}`}
                    interactive={!reviewMode}
                    markLabel={t.has("markText") ? t("markText") : "Mark"}
                    unmarkLabel={t.has("unmarkText") ? t("unmarkText") : "Unmark"}
                    onToggle={({ start, end, color, action }) =>
                      toggleHighlight({
                        scope: "question",
                        questionId: `passage-title:${activePassageId}`,
                        start,
                        end,
                        color,
                        action,
                      })
                    }
                  />
                </h2>
                {passageParagraphs.map(({ paragraph, index, start: paragraphStart }) => {
                  const paragraphId = `para-${activePassageId}-${index}`;
                  const paragraphHighlights = highlightsForPassage.filter((span) => span.paragraphIndex === index);
                  const matches = findParagraphMatches(paragraph, paragraphHighlights);
                  const answerLocalHighlights = matches.map((match, matchIndex) => ({
                    id: `answer-${activePassageId}-${index}-${matchIndex}`,
                    start: match.start,
                    end: match.end,
                    questionNumber: match.questionNumber,
                  }));

                  return (
                    <p id={paragraphId} key={paragraphId} className="test-body-copy wrap-break-word text-foreground/90">
                      <HighlightableText
                        text={paragraph}
                        userHighlights={getPassageLocalHighlights(paragraphStart, paragraph.length)}
                        notesStorageKey={`reading:${test.id}:notes`}
                        noteScopeKey={`passage:${activePassageId}:paragraph:${index}`}
                        answerHighlights={reviewMode ? answerLocalHighlights : []}
                        interactive={!reviewMode}
                        showAnswerBadges={reviewMode}
                        markLabel={t.has("markText") ? t("markText") : "Mark"}
                        unmarkLabel={t.has("unmarkText") ? t("unmarkText") : "Unmark"}
                        onToggle={({ start, end, color, action }) =>
                          toggleHighlight({
                            scope: "passage",
                            passageId: activePassageId,
                            start: paragraphStart + start,
                            end: paragraphStart + end,
                            color,
                            action,
                          })
                        }
                      />
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div
          role="separator"
          aria-label="Resize passage and questions panes"
          aria-orientation="vertical"
          aria-valuemin={30}
          aria-valuemax={70}
          aria-valuenow={Math.round(gridPct)}
          tabIndex={isCompact ? -1 : 0}
          className={cn(
            "relative hidden w-2 cursor-col-resize items-center justify-center bg-transparent outline-none lg:flex",
            "after:h-16 after:w-0.75 after:rounded-full after:bg-border/80 hover:after:bg-blue-500/70 focus-visible:ring-2 focus-visible:ring-blue-500"
          )}
          onPointerDown={handleDividerPointerDown}
          onDoubleClick={() => setSplitPct(DEFAULT_SPLIT)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              setSplitPct((prev) => clampSplitPct(prev - 3));
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              setSplitPct((prev) => clampSplitPct(prev + 3));
            } else if (event.key === "Home") {
              event.preventDefault();
              setSplitPct(DEFAULT_SPLIT);
            }
          }}
        />

        <div className={cn("min-h-0 min-w-0", isCompact && mobilePanel !== "questions" && "hidden")}>
          {reviewMode ? (
            <ReviewQuestionsPanel
              questions={reviewQuestions}
              answers={reviewAnswers}
              grading={grading}
              expanded={expandedExplanations}
              onToggleExplanation={(questionId) => {
                setExpandedExplanations((prev) => {
                  const next = new Set(prev);
                  if (next.has(questionId)) {
                    next.delete(questionId);
                  } else {
                    next.add(questionId);
                  }
                  return next;
                });
              }}
              onJumpEvidence={jumpToEvidenceFromReview}
            />
          ) : (
          <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background/45">
            <div ref={questionsScrollRef} className="min-h-0 flex-1 min-w-0 overflow-y-auto px-3 py-4 sm:px-4 lg:px-5 lg:py-6 [scrollbar-color:hsl(var(--border))_transparent]">
              <div className="space-y-7 pb-8">
                {groupedQuestions.map((group) => {
                  const headings = group.questions.find((q) => q.type === "matchingHeadings") as Extract<ReadingQuestion, { type: "matchingHeadings" }> | undefined;
                  const headingsHighlightKey = headings ? `matching-headings:${headings.id}` : null;
                  const headingOptionStarts = headings
                    ? headings.headingOptions.reduce<number[]>((acc, option, index) => {
                        if (index === 0) {
                          acc.push(0);
                          return acc;
                        }
                        const previousStart = acc[index - 1] ?? 0;
                        const previousOption = headings.headingOptions[index - 1] ?? "";
                        acc.push(previousStart + previousOption.length + 1);
                        return acc;
                      }, [])
                    : [];

                  return (
                    <section key={group.title} className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{group.title}</h3>
                        {group.instruction ? (
                          <p className="test-muted-copy mt-1 wrap-break-word text-sm text-muted-foreground">
                            <FormattedInstructionText text={group.instruction} />
                          </p>
                        ) : null}
                      </div>

                      {headings ? (
                        <div className="test-soft-surface rounded-lg border border-border/80 bg-muted/35 p-3">
                          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{t("headingsList")}</p>
                          <ul className="mt-2 space-y-1 text-sm">
                            {headings.headingOptions.map((heading, headingIndex) => {
                              const optionBase = headingOptionStarts[headingIndex] ?? 0;

                              return (
                                <li key={heading} className="wrap-break-word text-foreground/90">
                                  <HighlightableText
                                    text={heading}
                                    userHighlights={
                                      headingsHighlightKey
                                        ? getQuestionLocalHighlights(headingsHighlightKey, optionBase, heading.length)
                                        : []
                                    }
                                    notesStorageKey={`reading:${test.id}:notes`}
                                    noteScopeKey={`${headingsHighlightKey ?? "matching-headings"}:option:${headingIndex}`}
                                    markLabel={t.has("markText") ? t("markText") : "Mark"}
                                    unmarkLabel={t.has("unmarkText") ? t("unmarkText") : "Unmark"}
                                    onToggle={
                                      headingsHighlightKey
                                        ? ({ start, end, color, action }) =>
                                            toggleHighlight({
                                              scope: "question",
                                              questionId: headingsHighlightKey,
                                              start: optionBase + start,
                                              end: optionBase + end,
                                              color,
                                              action,
                                            })
                                        : undefined
                                    }
                                  />
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}

                      <div className="space-y-3">
                        {group.questions.map((question) => {
                          const active = activeQuestionNumber === question.number;
                          const value = answers[question.id];
                          const result = grading.byQuestion[question.id];
                          const answered = isAnswered(value);
                          const isCorrect = result?.isCorrect;
                          const isMarked = marked.has(question.id);
                          const promptStart = 0;
                          const tfngOptionStarts =
                            question.type === "tfng"
                              ? question.options.map((_, optionIndex) =>
                                  question.prompt.length +
                                  1 +
                                  question.options.slice(0, optionIndex).reduce((sum, option) => sum + option.length + 1, 0)
                                )
                              : [];
                          const mcqOptionStarts =
                            question.type === "mcq"
                              ? question.options.map((_, optionIndex) =>
                                  question.prompt.length +
                                  1 +
                                  question.options.slice(0, optionIndex).reduce((sum, option) => sum + option.length + 1, 0)
                                )
                              : [];

                          return (
                            <article
                              key={question.id}
                              id={`q-${question.number}`}
                              ref={(el) => {
                                if (!el) {
                                  questionRefs.current.delete(question.number);
                                  return;
                                }
                                questionRefs.current.set(question.number, el);
                              }}
                              className={cn(
                                "test-panel scroll-mt-24 rounded-xl border p-4 transition-all duration-200",
                                "hover:border-border hover:bg-accent/20",
                                active
                                  ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40"
                                  : "border-border/80 bg-card/90",
                                isMarked && "border-l-4 border-l-amber-400 bg-amber-50/40 dark:bg-amber-500/10",
                                reviewMode && answered && isCorrect && "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-500/10",
                                reviewMode && answered && !isCorrect && "border-rose-300 bg-rose-50/40 dark:bg-rose-500/10",
                                reviewMode && !answered && "border-border bg-muted/20"
                              )}
                              onClick={() => setActiveQuestionNumber(question.number)}
                            >
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <p className="min-w-0 wrap-break-word text-base font-medium leading-relaxed text-foreground">
                                  {question.number}.{" "}
                                  <HighlightableText
                                    text={question.prompt}
                                    userHighlights={getQuestionLocalHighlights(question.id, promptStart, question.prompt.length)}
                                    notesStorageKey={`reading:${test.id}:notes`}
                                    noteScopeKey={`question:${question.id}:prompt`}
                                    markLabel={t.has("markText") ? t("markText") : "Mark"}
                                    unmarkLabel={t.has("unmarkText") ? t("unmarkText") : "Unmark"}
                                    onToggle={({ start, end, color, action }) =>
                                      toggleHighlight({
                                        scope: "question",
                                        questionId: question.id,
                                        start: promptStart + start,
                                        end: promptStart + end,
                                        color,
                                        action,
                                      })
                                    }
                                  />
                                </p>
                                {isMarked && !reviewMode ? (
                                  <Badge variant="secondary" className="shrink-0 rounded-full border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/50 dark:bg-amber-500/20 dark:text-amber-200">
                                    <Bookmark className="size-3.5" />
                                    Marked
                                  </Badge>
                                ) : null}
                                {reviewMode ? (
                                  <span className="shrink-0 text-lg leading-none" aria-hidden="true">
                                    {!answered ? "⏺" : isCorrect ? "✅" : "❌"}
                                  </span>
                                ) : null}
                              </div>

                              {reviewMode ? (
                                <p className="test-muted-copy mb-3 text-xs text-muted-foreground">
                                  {(t.has("correctAnswer") ? t("correctAnswer") : "Correct answer")}:{" "}
                                  {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer}
                                </p>
                              ) : null}

                              {question.type === "tfng" ? (
                                <div className="flex flex-wrap gap-4">
                                  {question.options.map((option, optionIndex) => (
                                    <label key={option} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                                      <input
                                        type="radio"
                                        name={question.id}
                                        value={option}
                                        checked={value === option}
                                        disabled={reviewMode}
                                        onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                                        className="size-4 accent-blue-600"
                                      />
                                      <HighlightableText
                                        text={option}
                                        userHighlights={getQuestionLocalHighlights(
                                          question.id,
                                          tfngOptionStarts[optionIndex] ?? 0,
                                          option.length
                                        )}
                                        notesStorageKey={`reading:${test.id}:notes`}
                                        noteScopeKey={`question:${question.id}:tfng-option:${optionIndex}`}
                                        markLabel={t.has("markText") ? t("markText") : "Mark"}
                                        unmarkLabel={t.has("unmarkText") ? t("unmarkText") : "Unmark"}
                                        onToggle={({ start, end, color, action }) =>
                                          toggleHighlight({
                                            scope: "question",
                                            questionId: question.id,
                                            start: (tfngOptionStarts[optionIndex] ?? 0) + start,
                                            end: (tfngOptionStarts[optionIndex] ?? 0) + end,
                                            color,
                                            action,
                                          })
                                        }
                                      />
                                    </label>
                                  ))}
                                </div>
                              ) : null}

                              {question.type === "mcq" ? (
                                <div className="space-y-2">
                                  {question.options.map((option, optionIndex) => (
                                    <label key={option} className="flex cursor-pointer items-start gap-2 text-sm">
                                      <input
                                        type="radio"
                                        name={question.id}
                                        value={option}
                                        checked={value === option}
                                        disabled={reviewMode}
                                        onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                                        className="mt-0.5 size-4 accent-blue-600"
                                      />
                                      <span className="wrap-break-word">
                                        <HighlightableText
                                          text={option}
                                          userHighlights={getQuestionLocalHighlights(
                                            question.id,
                                            mcqOptionStarts[optionIndex] ?? 0,
                                            option.length
                                          )}
                                          notesStorageKey={`reading:${test.id}:notes`}
                                          noteScopeKey={`question:${question.id}:mcq-option:${optionIndex}`}
                                          markLabel={t.has("markText") ? t("markText") : "Mark"}
                                          unmarkLabel={t.has("unmarkText") ? t("unmarkText") : "Unmark"}
                                          onToggle={({ start, end, color, action }) =>
                                            toggleHighlight({
                                              scope: "question",
                                              questionId: question.id,
                                              start: (mcqOptionStarts[optionIndex] ?? 0) + start,
                                              end: (mcqOptionStarts[optionIndex] ?? 0) + end,
                                              color,
                                              action,
                                            })
                                          }
                                        />
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              ) : null}

                              {question.type === "matchingHeadings" ? (
                                <Select
                                  value={typeof value === "string" ? value : ""}
                                  disabled={reviewMode}
                                  onValueChange={(nextValue) => setAnswers((prev) => ({ ...prev, [question.id]: nextValue }))}
                                >
                                  <SelectTrigger className="test-input-surface max-w-70 bg-background/70 dark:bg-muted/30" aria-label={`Question ${question.number}`}>
                                    <SelectValue placeholder={t("selectHeading")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {question.headingOptions.map((option) => (
                                      <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : null}

                              {question.type === "matchingInfo" ? (
                                <Select
                                  value={typeof value === "string" ? value : ""}
                                  disabled={reviewMode}
                                  onValueChange={(nextValue) => setAnswers((prev) => ({ ...prev, [question.id]: nextValue }))}
                                >
                                  <SelectTrigger className="test-input-surface max-w-55 bg-background/70 dark:bg-muted/30" aria-label={`Question ${question.number}`}>
                                    <SelectValue placeholder={t("selectParagraph")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {question.paragraphOptions.map((option) => (
                                      <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : null}

                              {question.type === "sentenceCompletion" ? (
                                <Input
                                  aria-label={`Question ${question.number}`}
                                  value={typeof value === "string" ? value : ""}
                                  disabled={reviewMode}
                                  onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                                  placeholder={t("oneWordOnly")}
                                  className="test-input-surface max-w-sm bg-background/70 placeholder:text-muted-foreground/80 dark:bg-muted/30"
                                />
                              ) : null}

                              {reviewMode ? (
                                <div className="mt-3 space-y-2">
                                  <Button type="button" size="sm" variant="ghost" onClick={() => openExplanation(question)}>
                                    <HelpCircle className="size-4" />
                                    {t.has("explain") ? t("explain") : "Explain"}
                                  </Button>
                                  {expandedExplanations.has(question.id) ? (
                                    <div className="test-soft-surface rounded-md border border-border/80 bg-muted/25 p-3 text-sm">
                                      <p className="text-foreground/90">{question.explanation}</p>
                                      <p className="test-muted-copy mt-2 text-xs text-muted-foreground">
                                        {(t.has("correctAnswer") ? t("correctAnswer") : "Correct answer")}:{" "}
                                        {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

          </div>
          )}
        </div>
      </main>

      {!reviewMode ? (
        <div className="border-t border-border/75 bg-background/95 px-3 backdrop-blur sm:px-4 lg:px-5">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              aria-label={t("previous")}
              disabled={activeQuestionNumber <= 1}
              onClick={() => goToQuestion(Math.max(1, activeQuestionNumber - 1))}
              className="h-8 rounded-lg px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
            >
              <MoveLeft className="size-4" />
              {t("previous")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              aria-label={t("next")}
              disabled={activeQuestionNumber >= test.totalQuestions}
              onClick={() => goToQuestion(Math.min(test.totalQuestions, activeQuestionNumber + 1))}
              className="h-8 rounded-lg px-2.5 text-xs text-blue-700 hover:text-blue-700 dark:text-blue-300 sm:h-9 sm:px-3 sm:text-sm"
            >
              {t("next")}
              <MoveRight className="size-4" />
            </Button>

            <p className="ml-auto text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:text-xs">
              Question {activeQuestionNumber} / {test.totalQuestions}
            </p>

            <Toggle
              aria-label={t("markForReview")}
              variant="outline"
              pressed={currentQuestion ? marked.has(currentQuestion.id) : false}
              onPressedChange={(next) => {
                if (!currentQuestion) return;
                setMarked((prev) => {
                  const copy = new Set(prev);
                  if (next) {
                    copy.add(currentQuestion.id);
                  } else {
                    copy.delete(currentQuestion.id);
                  }
                  return copy;
                });
              }}
              className="h-8 rounded-lg px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
            >
              {currentQuestion && marked.has(currentQuestion.id) ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              {currentQuestion && marked.has(currentQuestion.id)
                ? (t.has("unmark") ? t("unmark") : "Unmark")
                : t("markForReview")}
            </Toggle>

            <Button
              type="button"
              variant="secondary"
              aria-label={t("questionPalette")}
              onClick={() => setPaletteOpen(true)}
              className="h-8 rounded-lg px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm lg:hidden"
            >
              <Grid2x2 className="size-4" />
              {t("questionPalette")}
            </Button>
          </div>

          <div className="mt-2 min-w-0 overflow-x-auto [scrollbar-width:thin]">
            <div className="inline-grid min-w-max grid-flow-col auto-cols-[minmax(220px,1fr)] gap-2 pr-1 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-3 lg:min-w-0 lg:w-full">
              {passagePaletteSections.map((section) => {
                const isActivePassage = section.passageId === activePassageId;
                return (
                  <div
                    key={`palette-${section.passageId}`}
                    className={cn(
                      "rounded-xl border p-2 transition-colors",
                      isActivePassage
                        ? "border-blue-400/60 bg-blue-500/10"
                        : "cursor-pointer border-border/70 bg-background/70 hover:border-blue-300/50 hover:bg-muted/40"
                    )}
                    onClick={() => {
                      if (!isActivePassage) {
                        handlePassageChange(section.passageId);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                      onClick={() => handlePassageChange(section.passageId)}
                    >
                      <span className="text-sm font-semibold">
                        {t("passageLabel", { index: section.index })}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {section.answered}/{section.numbers.length}
                      </span>
                    </button>

                    {isActivePassage ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {section.numbers.map((number) => {
                          const question = questionsByNumber.get(number);
                          const answered = question ? isAnswered(answers[question.id]) : false;
                          const isMarked = question ? marked.has(question.id) : false;
                          const isCurrent = number === activeQuestionNumber;
                          return (
                            <Button
                              key={`${activePassageId}-${number}`}
                              type="button"
                              variant="outline"
                              aria-label={t("goToQuestion", { number })}
                              className={cn(
                                "relative h-6 min-w-6 rounded-md border px-1 text-[11px] font-semibold shadow-none",
                                isCurrent && "border-blue-700 bg-blue-600 text-white hover:bg-blue-600",
                                !isCurrent && answered && "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/45 dark:bg-emerald-500/20 dark:text-emerald-200",
                                !isCurrent && !answered && "border-border bg-background text-foreground/85",
                                isMarked && "border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-300/60 ring-offset-1 dark:bg-amber-500/20 dark:text-amber-100"
                              )}
                              onClick={() => goToQuestion(number)}
                            >
                              {number}
                              {isMarked ? <span className="absolute right-1 top-1 size-1 rounded-full bg-amber-500" aria-hidden="true" /> : null}
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
        <SheetContent side={isCompact ? "bottom" : "right"} className="p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle>{t("questionPalette")}</SheetTitle>
            <SheetDescription>{t("questionPaletteHint")}</SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-9rem)] px-6 pb-6 md:h-[calc(100vh-8rem)]">
            <div className="space-y-3 py-4">
              {passagePaletteSections.map((section) => {
                const isActivePassage = section.passageId === activePassageId;
                return (
                  <div
                    key={`sheet-palette-${section.passageId}`}
                    className={cn(
                      "rounded-xl border p-2.5 transition-colors",
                      isActivePassage
                        ? "border-blue-400/60 bg-blue-500/10"
                        : "cursor-pointer border-border/70 bg-background/70 hover:border-blue-300/50 hover:bg-muted/40"
                    )}
                    onClick={() => {
                      if (!isActivePassage) {
                        handlePassageChange(section.passageId);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                      onClick={() => handlePassageChange(section.passageId)}
                    >
                      <span className="text-sm font-semibold">
                        {t("passageLabel", { index: section.index })}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {section.answered}/{section.numbers.length}
                      </span>
                    </button>

                    {isActivePassage ? (
                      <div className="mt-2 grid grid-cols-5 gap-2">
                        {section.numbers.map((num) => {
                          const q = questionsByNumber.get(num);
                          const answered = q ? isAnswered(answers[q.id]) : false;
                          const isMarked = q ? marked.has(q.id) : false;
                          const isCurrent = num === activeQuestionNumber;

                          return (
                            <Button
                              key={num}
                              type="button"
                              variant="outline"
                              aria-label={t("goToQuestion", { number: num })}
                              className={cn(
                                "relative h-9 rounded-md border text-sm",
                                isCurrent && "border-blue-700 bg-blue-600 text-white hover:bg-blue-600",
                                !isCurrent && answered && "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/45 dark:bg-emerald-500/20 dark:text-emerald-200",
                                !isCurrent && !answered && "border-border bg-card",
                                isMarked && "border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-400 ring-offset-1 dark:bg-amber-500/20 dark:text-amber-100"
                              )}
                              onClick={() => {
                                goToQuestion(num);
                                if (isCompact) {
                                  setPaletteOpen(false);
                                }
                              }}
                            >
                              {num}
                              {isMarked ? <span className="absolute right-1 top-1 size-1.5 rounded-full bg-amber-500" aria-hidden="true" /> : null}
                            </Button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
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
            {modePickerStep === "choose" ? (
              <>
                <h3 className="text-lg font-semibold">
                  {t.has("modePickerTitle") ? t("modePickerTitle") : "Choose test mode"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t.has("modePickerDescription")
                    ? t("modePickerDescription")
                    : "Choose how you want to take this reading test."}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button type="button" onClick={() => setModePickerStep("realConfirm")}>
                    {t.has("modeReal") ? t("modeReal") : "Real mode"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => chooseAttemptMode("practice")}>
                    {t.has("modePractice") ? t("modePractice") : "Practice mode"}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t.has("realModeRule")
                    ? t("realModeRule")
                    : "Real mode: timer auto-starts, cannot be stopped, and test ends when time reaches zero."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.has("practiceModeRule")
                    ? t("practiceModeRule")
                    : "Practice mode: you can start, pause, and continue the timer anytime."}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold">
                  {t.has("realModeStartTitle")
                    ? t("realModeStartTitle")
                    : "Start Reading Real Mode?"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t.has("realModeStartDescription")
                    ? t("realModeStartDescription")
                    : "Real Mode will run in fullscreen and enforce strict exam guards."}
                </p>
                <ul className="mt-4 space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm text-foreground/90">
                  <li>
                    {t.has("realModeFullscreenRequired")
                      ? t("realModeFullscreenRequired")
                      : "Fullscreen is required to continue the session."}
                  </li>
                  <li>
                    {t.has("realModeNoCopySelect")
                      ? t("realModeNoCopySelect")
                      : "Copy and text selection are disabled during Real Mode."}
                  </li>
                  <li>
                    {t.has("realModeNoTabSwitch")
                      ? t("realModeNoTabSwitch")
                      : "Switching tabs or windows will interrupt the session."}
                  </li>
                </ul>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModePickerStep("choose")}
                    disabled={realModeStartPending}
                  >
                    {t.has("realModeCancelCta") ? t("realModeCancelCta") : "Back"}
                  </Button>
                  <Button type="button" onClick={() => void startRealMode()} disabled={realModeStartPending}>
                    {realModeStartPending
                      ? t.has("realModeStarting")
                        ? t("realModeStarting")
                        : "Starting..."
                      : t.has("realModeStartCta")
                        ? t("realModeStartCta")
                        : "Start Real Mode"}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      ) : null}

      {realModeLocked ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-border/80 bg-card/95 p-5 shadow-2xl sm:p-6">
            <h3 className="text-lg font-semibold">
              {realModeInterruption === "fullscreen"
                ? t.has("realModeFullscreenExitedTitle")
                  ? t("realModeFullscreenExitedTitle")
                  : "Fullscreen exited"
                : t.has("realModeInterruptedTitle")
                  ? t("realModeInterruptedTitle")
                  : "Exam session interrupted"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {realModeInterruption === "fullscreen"
                ? t.has("realModeFullscreenExitedDescription")
                  ? t("realModeFullscreenExitedDescription")
                  : "Real Mode requires fullscreen to continue. Return to fullscreen to keep your exam session active."
                : t.has("realModeInterruptedDescription")
                  ? t("realModeInterruptedDescription")
                  : "Real Mode requires you to stay in the active fullscreen test window. Return to continue or exit Real Mode."}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.has("realModeInterruptionCount")
                ? t("realModeInterruptionCount", {
                    fullscreen: realModeInterruptionCount.fullscreen,
                    visibility: realModeInterruptionCount.visibility,
                  })
                : `Interruptions — fullscreen: ${realModeInterruptionCount.fullscreen}, tab/window: ${realModeInterruptionCount.visibility}`}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={leaveRealMode}>
                {t.has("realModeExitButton") ? t("realModeExitButton") : "Exit Real Mode"}
              </Button>
              <Button type="button" onClick={() => void returnToRealMode()}>
                {realModeInterruption === "fullscreen"
                  ? t.has("realModeReturnFullscreenButton")
                    ? t("realModeReturnFullscreenButton")
                    : "Return to Fullscreen"
                  : t.has("realModeReturnTestButton")
                    ? t("realModeReturnTestButton")
                    : "Return to Test"}
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
              <Button onClick={finishTest} disabled={isSubmittingResult}>
                {t("confirmFinish")}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
