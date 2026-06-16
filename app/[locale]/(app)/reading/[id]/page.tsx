"use client";

import Link from "next/link";
import { type CSSProperties, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, BookmarkCheck, CheckCircle2, CircleDashed, Clock3, Grid2x2, Maximize2, Menu, Minimize2, MoveLeft, MoveRight, Play, RotateCcw, Square, User, XCircle } from "lucide-react";
import { LoadingModal } from "@/components/ui/loading-modal";
import { useLocale, useTranslations } from "next-intl";

import { getReadingTestById, saveRuntimeReadingTest, type ReadingFullTest, type ReadingQuestion } from "@/data/reading-tests";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { findEvidenceTextRange } from "@/lib/evidence-text";
import { cn } from "@/lib/utils";
import { formatAnswerForDisplay } from "@/lib/answer-display";
import {
  clearLatestAttemptProgress,
  createAttemptId,
  createAttemptTabId,
  claimAttemptTab,
  isAttemptTabOwner,
  loadAttemptProgress,
  loadLatestAttemptId,
  saveAttemptProgress,
  saveAttemptResult,
  releaseAttemptTab,
  type AttemptMode,
} from "@/lib/test-attempt-storage";
import { authApi } from "@/lib/api/auth";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { HighlightableText } from "@/components/test/HighlightableText";
import { FormattedInstructionText } from "@/components/test/FormattedInstructionText";
import { InlineBoldText } from "@/components/test/InlineBoldText";
import { TestNotesButton } from "@/components/test/TestNotesButton";
import {
  clampSplitPct,
  mergeRanges,
  subtractRangeFromRanges,
  loadReadingHighlights,
  saveReadingHighlights,
  type ReadingHighlight,
  type ReadingHighlightColor,
} from "@/lib/reading-highlights";
import { useTestAppearance } from "@/lib/test-appearance";
import { TestOptionsSheet } from "@/components/test/TestOptionsSheet";
import { adaptReadingBackendReview, type AdaptedReadingBackendReview } from "./result/_components/backendReviewAdapters";
import { studentAttemptsService } from "@/src/services/student/attempts.service";
import { studentMarathonService } from "@/src/services/student/marathon.service";
import {
  adaptMarathonReadingAttemptToDetail,
  adaptMarathonReadingReviewResponse,
} from "@/src/services/student/marathon-runner-adapters";
import { studentTestsService } from "@/src/services/student/tests.service";
import { StudentApiError } from "@/src/services/student/types";
import type { StudentAttemptDetail, StudentAttemptQuestion, StudentAttemptQuestionGroup, StudentAttemptReadingPassage, StudentTestRecord } from "@/src/services/student/types";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useLeaveConfirm } from "@/lib/use-leave-confirm";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { useAppSessionRole } from "../../_components/session/AppSessionContext";
import { enqueueGuestPendingAttempt } from "@/lib/guest-attempt-sync";

const DEFAULT_SPLIT = 50;
const HEADING_DND_MIME = "application/x-reading-heading";
const SUMMARY_WORD_BANK_DND_MIME = "application/x-reading-summary-word-bank";
const TFNG_OPTIONS: ["TRUE", "FALSE", "NOT GIVEN"] = ["TRUE", "FALSE", "NOT GIVEN"];
const YNNG_OPTIONS: ["YES", "NO", "NOT GIVEN"] = ["YES", "NO", "NOT GIVEN"];
const PASSAGE_PRACTICE_DURATION_MINUTES = 20;

type AnswerValue = string | string[];
type MatchingHeadingsQuestion = Extract<ReadingQuestion, { type: "matchingHeadings" }>;
type MatchingInfoQuestion = Extract<ReadingQuestion, { type: "matchingInfo" }>;

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
    return trimmed.length ? trimmed : null;
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

function extractParagraphHeaderLetter(paragraph: string) {
  const trimmed = paragraph.trim();
  if (!trimmed) return null;

  const boldOnly = trimmed.match(/^\*\*([A-Z])(?:[.)])?\*\*$/);
  if (boldOnly) return boldOnly[1];

  const plainOnly = trimmed.match(/^([A-Z])(?:[.)])?$/);
  if (plainOnly) return plainOnly[1];

  const boldPrefix = trimmed.match(/^\*\*([A-Z])(?:[.)])?\*\*(?:\s+|$)/);
  if (boldPrefix) return boldPrefix[1];

  const plainPrefix = trimmed.match(/^([A-Z])(?:[.)])?(?:\s+|$)/);
  if (plainPrefix) return plainPrefix[1];

  return null;
}

function extractMatchingHeadingTargetLetter(text: string) {
  const normalized = text.trim();
  if (!normalized) return null;
  const paragraphMatch = normalized.match(/paragraph\s+([A-Z])/i);
  if (paragraphMatch) return paragraphMatch[1].toUpperCase();
  const directMatch = normalized.match(/\b([A-Z])\b/);
  return directMatch ? directMatch[1].toUpperCase() : null;
}

function parseMatchingHeadingsFromInstruction(instruction?: string | null) {
  if (!instruction) return new Map<string, string>();
  const map = new Map<string, string>();
  const lines = instruction
    .split("\n")
    .map((line) => line.replace(/\*\*/g, "").trim())
    .filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^([ivxlcdm]+)\s+(.+)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const text = match[2].trim();
    if (!text || map.has(key)) continue;
    map.set(key, text);
  }
  return map;
}

function toRomanHeadingKey(index: number) {
  const romanKeys = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv"];
  return romanKeys[index] ?? String(index + 1);
}

function normalizeHeadingDisplayText(value: string) {
  return stripInlineBoldMarkup(value).replace(/\s+/g, " ").trim();
}

function parseMatchingHeadingOption(rawOption: string, index = -1) {
  const cleaned = normalizeHeadingDisplayText(rawOption);
  if (!cleaned) return { key: "", label: "" };

  const explicitMatch = cleaned.match(/^([ivxlcdm]+)(?:[\)\].:\-]|\s+)+(.+)$/i);
  if (explicitMatch) {
    return {
      key: explicitMatch[1].toLowerCase(),
      label: normalizeHeadingDisplayText(explicitMatch[2]),
    };
  }

  const keyOnlyMatch = cleaned.match(/^([ivxlcdm]+)$/i);
  if (keyOnlyMatch) {
    return { key: keyOnlyMatch[1].toLowerCase(), label: "" };
  }

  return {
    key: index >= 0 ? toRomanHeadingKey(index) : cleaned.toLowerCase(),
    label: cleaned,
  };
}

function normalizeTfngAnswerForBackend(value: string, options?: readonly string[]) {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  const usesYesNo = Array.isArray(options) && options.some((option) => {
    const token = option.trim().toUpperCase();
    return token === "YES" || token === "NO";
  });

  if (usesYesNo) {
    if (normalized === "YES") return "YES";
    if (normalized === "NO") return "NO";
    if (normalized === "NOT_GIVEN" || normalized === "NOTGIVEN") return "NOT_GIVEN";
    return value.trim();
  }

  if (normalized === "TRUE") return "TRUE";
  if (normalized === "FALSE") return "FALSE";
  if (normalized === "NOT_GIVEN" || normalized === "NOTGIVEN") return "NOT_GIVEN";
  return value.trim();
}

function normalizeLetterKeyAnswerForBackend(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^[A-Z]$/i.test(trimmed)) return trimmed.toUpperCase();
  const match = trimmed.match(/^\s*([A-Z])(?:\s*$|[\)\].:\-]\s+)/i);
  return match ? match[1].toUpperCase() : trimmed;
}

function normalizeRomanKeyAnswerForBackend(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^[ivxlcdm]+$/i.test(trimmed)) return trimmed.toLowerCase();
  const match = trimmed.match(/^\s*([ivxlcdm]+)(?:\s*$|[\)\].:\-]\s+|\s+)/i);
  return match ? match[1].toLowerCase() : trimmed;
}

function stripInlineBoldMarkup(value: string) {
  return value.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
}

function normalizeTemplateDisplayText(value: string) {
  return value.replace(/^(\s*)[-–—]\s+/gm, "$1• ");
}

type MatchingHeadingsBankProps = {
  options: Array<{ value: string; label: string }>;
  selectedOption: string | null;
  draggingOption: string | null;
  disabled: boolean;
  onSelectOption: (option: string) => void;
  onDragStartOption: (event: ReactDragEvent<HTMLButtonElement>, option: string) => void;
  onDragEndOption: () => void;
  hintText: string;
};

function MatchingHeadingsBank({
  options,
  selectedOption,
  draggingOption,
  disabled,
  onSelectOption,
  onDragStartOption,
  onDragEndOption,
  hintText,
}: MatchingHeadingsBankProps) {
  if (!options.length) return null;

  return (
    <div className="rounded-xl border border-border/70 bg-card/80 p-3">
      <p className="text-sm font-semibold text-foreground">List of Headings</p>
      <p className="mt-1 text-xs text-muted-foreground">{hintText}</p>
      <div className="mt-3 space-y-1.5">
        {options.map((option) => {
          const labelText = normalizeHeadingDisplayText(option.label || option.value);
          const isSelected = selectedOption === option.value;
          const isDragging = draggingOption === option.value;
          return (
            <button
              key={option.value}
              type="button"
              draggable={!disabled}
              onClick={() => {
                if (disabled) return;
                onSelectOption(option.value);
              }}
              onDragStart={(event) => {
                if (disabled) return;
                onDragStartOption(event, option.value);
              }}
              onDragEnd={onDragEndOption}
              className={cn(
                "flex w-full items-start gap-3 rounded-md border px-2.5 py-2 text-left text-sm transition-colors",
                isSelected
                  ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  : "border-border/70 bg-background/70 text-foreground/90 hover:border-blue-300/60",
                isDragging && "opacity-70",
                disabled && "cursor-not-allowed opacity-70"
              )}
            >
              <span className="mt-0.5 w-8 shrink-0 whitespace-nowrap font-semibold text-muted-foreground">
                {option.value}
              </span>
              <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug text-foreground/95">
                {labelText}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type MatchingInfoBankProps = {
  options: string[];
  hintText: string;
};

function MatchingInfoBank({
  options,
  hintText,
}: MatchingInfoBankProps) {
  if (!options.length) return null;
  const parsedOptions = options.map((option, index) => parseMatchingInfoOption(option, index));

  return (
    <div className="test-panel space-y-5 rounded-xl border border-border/80 bg-card/85 px-4 py-4 shadow-sm dark:bg-card/65">
      <p className="text-base italic leading-relaxed text-foreground">
        <span className="mr-2 font-bold not-italic">NB</span>
        {hintText}
      </p>
      <div className="space-y-2">
        <p className="text-lg font-bold text-foreground">List of Options</p>
        <div className="space-y-1.5">
          {parsedOptions.map((option) => (
            <div
              key={option.value}
              className="grid w-full grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3 rounded-lg border border-transparent px-3 py-2 text-left text-base leading-relaxed text-foreground"
            >
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-foreground shadow-sm dark:bg-background/50">
                {option.key}
              </span>
              <span className="min-w-0">
                {option.label || option.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  const raw = spans
    .map((span) => {
      const phrase = span.phrase.trim();
      if (!phrase) return null;
      const range = findEvidenceTextRange(paragraph, phrase);
      if (!range) return null;
      return {
        start: range.start,
        end: range.end,
        phrase: paragraph.slice(range.start, range.end),
        questionNumber: span.questionNumber,
      } satisfies ParagraphMatch;
    })
    .filter((item): item is ParagraphMatch => Boolean(item))
    .sort((a, b) => (a.start === b.start ? b.end - b.start - (a.end - a.start) : a.start - b.start));

  const filtered: ParagraphMatch[] = [];
  let cursor = -1;
  for (const match of raw) {
    const previous = filtered[filtered.length - 1];
    const isSameEvidenceRange = previous && previous.start === match.start && previous.end === match.end;
    if (match.start < cursor && !isSameEvidenceRange) continue;
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
    if (key && text) {
      const cleanedText = text.replace(new RegExp(`^${key}[\\)\\].:\\-\\s]+`, "i"), "").trim();
      return cleanedText ? `${key}. ${cleanedText}` : key;
    }
    if (text) return text;
    if (key) return key;
    return "";
  });

  const cleaned = list.map((item) => item.trim()).filter(Boolean);
  return cleaned.length ? cleaned : ["A", "B", "C"];
}

function toAlphabetKey(rawIndex: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let value = rawIndex + 1;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = alphabet[value % 26] + result;
    value = Math.floor(value / 26);
  }
  return result || "A";
}

function parseOptionChoice(option: string, index: number) {
  const trimmed = option.trim();
  const match = trimmed.match(/^\s*([A-Z])[\)\].:\-]\s*(.+)$/i);
  if (match) {
    const key = match[1].toUpperCase();
    const text = match[2].trim();
    return {
      key,
      text,
      label: `${key}. ${text}`,
    };
  }

  const key = toAlphabetKey(index);
  return {
    key,
    text: trimmed,
    label: trimmed ? `${key}. ${trimmed}` : key,
  };
}

function parseMatchingInfoOption(option: string, index: number) {
  const trimmed = option.trim();
  const prefixed = trimmed.match(/^\s*([A-Z])[\)\].:\-]\s*(.+)$/i);
  if (prefixed) {
    const key = prefixed[1].toUpperCase();
    return {
      value: key,
      key,
      label: prefixed[2].trim(),
    };
  }

  const paragraph = trimmed.match(/^\s*paragraph\s+([A-Z])(?:\s*[\)\].:\-]\s*(.+))?$/i);
  if (paragraph) {
    const key = paragraph[1].toUpperCase();
    return {
      value: key,
      key,
      label: paragraph[2]?.trim() ?? "",
    };
  }

  const keyOnly = trimmed.match(/^\s*([A-Z])\s*$/i);
  if (keyOnly) {
    const key = keyOnly[1].toUpperCase();
    return {
      value: key,
      key,
      label: "",
    };
  }

  const key = toAlphabetKey(index);
  return {
    value: key,
    key,
    label: trimmed,
  };
}

function resolveChoiceKeyFromRawValue(
  rawValue: string | string[] | null | undefined,
  parsedOptions: Array<{ key: string; label: string }>,
  rawOptions: string[],
) {
  if (typeof rawValue !== "string") return "";
  const normalized = rawValue.trim();
  if (!normalized) return "";

  const upper = normalized.toUpperCase();
  const byKey = parsedOptions.find((option) => option.key.toUpperCase() === upper);
  if (byKey) return byKey.key;

  const byLabel = parsedOptions.find((option) => option.label.toUpperCase() === upper);
  if (byLabel) return byLabel.key;

  const byRawOption = rawOptions.findIndex((option) => option.trim().toUpperCase() === upper);
  if (byRawOption >= 0) return parsedOptions[byRawOption]?.key ?? "";

  // Accept legacy "A" / "A)" / "A." / etc stored in localStorage.
  const keyLike = normalized.match(/^\s*([A-Z])(?:\s*$|[\)\].:\-]\s+)/i);
  if (keyLike) return keyLike[1].toUpperCase();

  return "";
}

function extractHeadingOptions(group: StudentAttemptQuestionGroup): string[] {
  const content = asRecord(group.group_content_json);
  const headings = asArray<unknown>(content?.headings)
    .map((item) => {
      const row = asRecord(item);
      const key = toStringSafe(row?.key);
      const text = toStringSafe(row?.text);
      return text || key;
    })
    .map((item) => item.trim())
    .filter(Boolean);

  return headings.length ? headings : ["Heading 1", "Heading 2", "Heading 3", "Heading 4", "Heading 5"];
}

function generateRangeOptions(startRaw: string, endRaw: string): string[] {
  const start = startRaw.trim();
  const end = endRaw.trim();
  if (!start || !end) return [];

  // Numeric range like 1-7
  if (/^\d+$/.test(start) && /^\d+$/.test(end)) {
    const from = Number(start);
    const to = Number(end);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to <= 0) return [];
    const step = from <= to ? 1 : -1;
    const result: string[] = [];
    for (let n = from; step > 0 ? n <= to : n >= to; n += step) result.push(String(n));
    return result;
  }

  // Letter range like A-I
  if (/^[A-Z]$/.test(start) && /^[A-Z]$/.test(end)) {
    const from = start.charCodeAt(0);
    const to = end.charCodeAt(0);
    const step = from <= to ? 1 : -1;
    const result: string[] = [];
    for (let c = from; step > 0 ? c <= to : c >= to; c += step) result.push(String.fromCharCode(c));
    return result;
  }

  return [];
}

function extractRangeFromInstructionText(text: string): string[] {
  const source = String(text ?? "");
  if (!source) return [];

  const explicitOptions = extractLetterOptionsFromInstructionText(source);
  if (explicitOptions.length) return explicitOptions;

  // Match "A-I" / "A - I" / "1-7", etc.
  const match = source.match(/\b([A-Z]|\d{1,2})\s*[-–—]\s*([A-Z]|\d{1,2})\b/);
  if (!match) return [];
  return generateRangeOptions(match[1] ?? "", match[2] ?? "");
}

function extractLetterOptionsFromInstructionText(text: string): string[] {
  const source = String(text ?? "");
  if (!source) return [];

  const options: string[] = [];
  const seen = new Set<string>();
  const lineRegex = /^\s*(?:[-*]\s*)?(?:\*\*)?([A-Z])(?:\*\*)?\s*[\)\].:\-]\s+\S.+$/gm;
  let match: RegExpExecArray | null;

  while ((match = lineRegex.exec(source))) {
    const key = String(match[1] ?? "").trim().toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    options.push(key);
  }

  return options.length >= 2 ? options : [];
}

function extractParagraphMarkersFromPassageText(passageText: string): string[] {
  const text = String(passageText ?? "");
  if (!text) return [];

  const markers: string[] = [];
  const seen = new Set<string>();

  // Prefer explicit header lines like "A", "A.", "A)", "**A**"
  const lineRegex = /^\s*(?:\*\*|\*)?([A-Z])(?:\*\*|\*)?\s*(?:[.)])?\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(text))) {
    const key = String(match[1] ?? "").trim().toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    markers.push(key);
  }

  return markers;
}

function extractMatchingChoiceOptions(
  group: StudentAttemptQuestionGroup,
  instructionText?: string,
  passageText?: string
): string[] {
  const content = asRecord(group.group_content_json);
  const optionRows = asArray<unknown>(content?.choices).length
    ? asArray<unknown>(content?.choices)
    : asArray<unknown>(content?.options).length
      ? asArray<unknown>(content?.options)
      : asArray<unknown>(content?.labels).length
        ? asArray<unknown>(content?.labels)
        : asArray<unknown>(content?.categories);

  const options = optionRows
    .map((item) => {
      const row = asRecord(item);
      const text = toStringSafe(row?.text);
      const label = toStringSafe(row?.label);
      const key = toStringSafe(row?.key);
      return text || label || key;
    })
    .map((item) => item.trim())
    .filter(Boolean);

  if (options.length) {
    return options;
  }

  // Reading MATCH_PARA_INFO doesn't accept shared group content on the backend.
  // Derive the available options from instructions or from the passage text headers (A, B, C...).
  const derivedFromInstruction = extractRangeFromInstructionText(instructionText ?? toStringSafe(group.instructions));
  if (derivedFromInstruction.length) {
    return derivedFromInstruction;
  }

  const derivedFromPassage = extractParagraphMarkersFromPassageText(passageText ?? "");
  if (derivedFromPassage.length) {
    return derivedFromPassage;
  }

  return ["A", "B", "C", "D", "E", "F"];
}

function extractSummaryInfo(group: StudentAttemptQuestionGroup): { summaryText: string; wordBank: string[] | null } {
  const content = asRecord(group.group_content_json);
  const orderedQuestions = group.questions
    .slice()
    .sort((left, right) => left.question_number - right.question_number);
  const questionNumbers = orderedQuestions.map((question) => question.question_number);

  const rawSummaryText =
    toStringSafe(content?.summary_text).trim()
    || toStringSafe(content?.template_text).trim()
    || toStringSafe(content?.note_text).trim()
    || toStringSafe(content?.text).trim();

  let summaryText = rawSummaryText;
  const hasNumberTokens = /\{\d+\}/.test(summaryText);
  if (summaryText && !hasNumberTokens && questionNumbers.length) {
    let cursor = 0;
    summaryText = summaryText.replace(/(_{2,}|\.{3,}|…+)/g, () => {
      if (cursor >= questionNumbers.length) return "_____";
      const token = `{${questionNumbers[cursor]}}`;
      cursor += 1;
      return token;
    });
  }

  if (!summaryText && questionNumbers.length) {
    summaryText = orderedQuestions
      .map((question) => `${extractQuestionPrompt(question) || `Question ${question.question_number}`} {${question.question_number}}`)
      .join("\n");
  }

  const wordBankEnabled = content?.word_bank_enabled === true || content?.summary_word_bank_enabled === true;
  const wordBankRaw = wordBankEnabled && Array.isArray(content?.word_bank) ? content.word_bank : null;
  const wordBank = wordBankRaw
    ? (wordBankRaw as unknown[]).map((item) => toStringSafe(item).trim()).filter(Boolean)
    : null;
  return { summaryText, wordBank: wordBank && wordBank.length ? wordBank : null };
}

function extractTableInfo(group: StudentAttemptQuestionGroup): { columns: string[]; rows: string[][] } {
  const content = asRecord(group.group_content_json);

  const columns = asArray<unknown>(content?.columns)
    .map((item) => {
      if (typeof item === "string") return item;
      const row = asRecord(item);
      return toStringSafe(row?.text ?? row?.label ?? row?.key);
    })
    .map((item) => item.trim())
    .filter(Boolean);

  const rowsRaw = asArray<unknown>(content?.rows);
  const rows = rowsRaw
    .map((row) => (Array.isArray(row) ? row : []))
    .map((row) =>
      row
        .map((cell) => toStringSafe(cell).trim())
        .filter((cell) => cell.length > 0)
    )
    .filter((row) => row.length > 0);

  const fallbackRows = group.questions
    .slice()
    .sort((left, right) => left.question_number - right.question_number)
    .map((question) => [extractQuestionPrompt(question), `{${question.question_number}}`]);

  const resolvedRows = rows.length ? rows : fallbackRows;
  const maxColumns = Math.max(0, ...resolvedRows.map((row) => row.length));
  const resolvedColumns = columns.length ? columns : Array.from({length: Math.max(maxColumns, 2)}, (_, index) => `Column ${index + 1}`);

  return {columns: resolvedColumns, rows: resolvedRows};
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
  const attemptQuestionId = toStringSafe(question.attempt_question_id).trim();
  const id = toStringSafe(question.id).trim();
  const canonicalId = toStringSafe(question.question_id).trim();

  // ALWAYS prioritize attempt_question_id - it's specific to THIS attempt, not a generic question
  if (attemptQuestionId) return attemptQuestionId;
  if (id && id !== canonicalId) return id;
  return canonicalId || "";
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
      .concat(asArray<unknown>(row?.attempt_question_id))
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

        const candidates = [
          toStringSafe(question.attempt_question_id).trim(),
          toStringSafe(question.id).trim()
        ]
          .filter((value) => value && UUID_PATTERN.test(value))
          .filter((value, index, source) => source.indexOf(value) === index);

        if (candidates.length > 0) {
          byNumber.set(number, candidates);
        }
      }
    }
  }

  return byNumber;
}

function collectAttemptScopedIdPool(attempt: StudentAttemptDetail) {
  const pool = new Set<string>();
  for (const passage of attempt.reading_passages) {
    for (const group of passage.question_groups) {
      for (const question of group.questions) {
        const attemptQuestionId = toStringSafe(question.attempt_question_id).trim();
        if (attemptQuestionId && UUID_PATTERN.test(attemptQuestionId)) {
          pool.add(attemptQuestionId);
        }
        const fallbackId = toStringSafe(question.id).trim();
        if (fallbackId && UUID_PATTERN.test(fallbackId)) {
          pool.add(fallbackId);
        }
      }
    }
  }
  return pool;
}

function collectRuntimeSubmitCandidatesByNumber(questions: ReadingQuestion[]) {
  const byNumber = new Map<number, string[]>();

  for (const question of questions) {
    const candidates = resolveSubmitCandidateIds(question)
      .filter((value) => UUID_PATTERN.test(value))
      .filter((value, index, source) => source.indexOf(value) === index);

    if (candidates.length > 0) {
      byNumber.set(question.number, candidates);
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
  const visited = new Set<unknown>();

  const mergeCandidates = (number: number, candidates: string[]) => {
    if (number <= 0 || !candidates.length) return;
    const previous = result.get(number) ?? [];
    result.set(
      number,
      [...previous, ...candidates]
        .filter((value) => UUID_PATTERN.test(value))
        .filter((value, index, source) => source.indexOf(value) === index)
    );
  };

  const walk = (value: unknown, depth = 0) => {
    if (depth > 8 || value === null || value === undefined) return;
    if (typeof value !== "object") return;
    if (visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach((item) => walk(item, depth + 1));
      return;
    }

    const row = asRecord(value);
    if (!row) return;

    const nestedQuestion = asRecord(row.question);
    const number = toNumberSafe(
      row.question_number
      ?? row.number
      ?? nestedQuestion?.question_number
      ?? asRecord(row.question_meta)?.question_number,
      0
    );

    if (number > 0) {
      const prioritized = [
        toStringSafe(row.attempt_question_id).trim(),
        toStringSafe(row.attempt_question).trim(),
        toStringSafe(row.question_answer_id).trim(),
        toStringSafe(row.question_answer).trim(),
        toStringSafe(row.id).trim(),
        toStringSafe(row.question_id).trim(),
        typeof row.question === "string" ? row.question.trim() : "",
        toStringSafe(nestedQuestion?.id).trim(),
        toStringSafe(nestedQuestion?.question_id).trim()
      ].filter(Boolean);
      const scanned = collectUuidStrings(row, 5);
      mergeCandidates(
        number,
        [...prioritized, ...scanned].filter((item, index, source) => source.indexOf(item) === index)
      );
    }

    Object.values(row).forEach((child) => walk(child, depth + 1));
  };

  walk(rawAttempt, 0);
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
  allowedAttemptScopedIds?: Set<string>;
  includeUnanswered?: boolean;
}) {
  return params.questions
    .map((question) => {
      const answer = toSubmitAnswer(params.answers[question.id]);
      const normalizedAnswer = (() => {
        if (question.type === "tfng" && typeof answer === "string") {
          return normalizeTfngAnswerForBackend(answer, question.options);
        }

        if (question.type === "mcq" && typeof answer === "string") {
          const parsedOptions = question.options.map((option, optionIndex) => parseOptionChoice(option, optionIndex));
          const resolvedKey = resolveChoiceKeyFromRawValue(answer, parsedOptions, question.options);
          return resolvedKey ? resolvedKey : normalizeLetterKeyAnswerForBackend(answer);
        }

        if (question.type === "matchingInfo" && typeof answer === "string") {
          return normalizeLetterKeyAnswerForBackend(answer);
        }

        if (question.type === "listSelection" && typeof answer === "string") {
          return normalizeLetterKeyAnswerForBackend(answer);
        }

        if (question.type === "matchingHeadings" && typeof answer === "string") {
          return normalizeRomanKeyAnswerForBackend(answer);
        }

        if (Array.isArray(answer)) {
          return answer.map((entry) => entry.trim()).filter(Boolean);
        }

        return answer;
      })();
      const isFlagged = params.marked.has(question.id);
      const fromAttempt = params.submitCandidatesByNumber.get(question.number) ?? [];
      const fromQuestion = resolveSubmitCandidateIds(question);
      const attemptScopedCandidateIds = [...fromAttempt]
        .map((value) => toStringSafe(value).trim())
        .filter((value) => value && UUID_PATTERN.test(value))
        .filter((value) => {
          if (!params.allowedAttemptScopedIds || params.allowedAttemptScopedIds.size === 0) {
            return true;
          }
          return params.allowedAttemptScopedIds.has(value);
        });
      const fallbackCandidateIds = fromQuestion
        .map((value) => toStringSafe(value).trim())
        .filter((value) => value && UUID_PATTERN.test(value));
      const candidateIds = (attemptScopedCandidateIds.length ? attemptScopedCandidateIds : fallbackCandidateIds)
        .filter((value, index, source) => source.indexOf(value) === index);
      if (!candidateIds.length || (!params.includeUnanswered && normalizedAnswer === null && !isFlagged)) {
        return null;
      }

      return {
        questionKey: question.id,
        questionNumber: question.number,
        candidateIds,
        answer: normalizedAnswer,
        is_flagged: isFlagged
      } satisfies BackendAttemptAnswerEntry;
    })
    .filter((item): item is BackendAttemptAnswerEntry => item !== null);
}

function toReadingBackendAnswerPayload(entries: BackendAttemptAnswerEntry[]) {
  return entries
    .map((entry) => {
      const questionId = entry.candidateIds[0] ?? "";
      if (!questionId) return null;
      return {
        question_id: questionId,
        attempt_question_id: questionId,
        answer: toBackendAnswerPayload(entry.answer),
        is_flagged: entry.is_flagged
      };
    })
    .filter(
      (item): item is {
        question_id: string;
        attempt_question_id: string;
        answer: {answer: string} | {answers: string[]} | null;
        is_flagged: boolean;
      } => item !== null
    );
}

function toMarathonSaveAnswers(
  payload: Array<{
    question_id: string;
    attempt_question_id: string;
    answer: {answer: string} | {answers: string[]} | null;
    is_flagged: boolean;
  }>
) {
  return payload.map((item) => ({
    question_id: item.question_id,
    answer: item.answer,
    is_flagged: item.is_flagged,
  }));
}

function mapBackendAttemptToReadingTest(
  testId: string,
  meta: StudentTestRecord,
  attempt: StudentAttemptDetail,
  scopedPassageId?: string
): ReadingFullTest {
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
      const matchingChoiceOptions = extractMatchingChoiceOptions(group, instruction, toStringSafe(passage.passage_text));

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

        if (qType === "TFNG" || qType === "YNNG") {
          const options = qType === "YNNG" ? YNNG_OPTIONS : TFNG_OPTIONS;
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
            options,
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

        if (
          qType === "MATCH_PARA_INFO"
          || qType === "MATCHING_INFORMATION"
          || qType === "MATCHING_ENDINGS"
          || qType === "MATCHING_SENTENCE_ENDINGS"
          || qType === "SENTENCE_ENDINGS"
          || qType === "MATCHING"
        ) {
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
            paragraphOptions: matchingChoiceOptions,
            correctAnswer: "",
            explanation: "",
            evidenceSpans
          });
          continue;
        }

        if (qType === "CLASSIFICATION" || qType === "MATCHING_FEATURES") {
          questions.push({
            id: questionId,
            number,
            passageId,
            type: "matchingInfo",
            backendQuestionId: submitQuestionId || undefined,
            backendQuestionCandidateIds: submitQuestionCandidates.length ? submitQuestionCandidates : undefined,
            groupTitle,
            groupInstruction: instruction,
            prompt: prompt || `Question ${number}`,
            paragraphOptions: matchingChoiceOptions,
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

        if (qType === "LIST_SELECTION" || qType === "SELECTING_FROM_A_LIST") {
          questions.push({
            id: questionId,
            number,
            passageId,
            type: "listSelection",
            backendQuestionId: submitQuestionId || undefined,
            backendQuestionCandidateIds: submitQuestionCandidates.length ? submitQuestionCandidates : undefined,
            groupTitle,
            groupInstruction: instruction,
            prompt: prompt || `Question ${number}`,
            listOptions: matchingChoiceOptions,
            correctAnswer: "",
            explanation: "",
            evidenceSpans
          });
          continue;
        }

        if (qType === "SUMMARY_COMPLETION" || qType === "NOTE_COMPLETION") {
          const summaryInfo = extractSummaryInfo(group);
          questions.push({
            id: questionId,
            number,
            passageId,
            type: "summaryCompletion",
            backendQuestionId: submitQuestionId || undefined,
            backendQuestionCandidateIds: submitQuestionCandidates.length ? submitQuestionCandidates : undefined,
            groupTitle,
            groupInstruction: instruction,
            prompt: prompt || toStringSafe(question.question_text, `Question ${number}`),
            summaryText: summaryInfo.summaryText,
            wordBank: summaryInfo.wordBank,
            correctAnswer: "",
            acceptableAnswers: [],
            explanation: "",
            evidenceSpans
          });
          continue;
        }

        if (qType === "TABLE_COMPLETION") {
          const tableInfo = extractTableInfo(group);
          questions.push({
            id: questionId,
            number,
            passageId,
            type: "tableCompletion",
            backendQuestionId: submitQuestionId || undefined,
            backendQuestionCandidateIds: submitQuestionCandidates.length ? submitQuestionCandidates : undefined,
            groupTitle,
            groupInstruction: instruction,
            prompt: prompt || toStringSafe(question.question_text, `Question ${number}`),
            tableColumns: tableInfo.columns,
            tableRows: tableInfo.rows,
            correctAnswer: "",
            acceptableAnswers: [],
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
  const durationMinutes = scopedPassageId
    ? PASSAGE_PRACTICE_DURATION_MINUTES
    : Math.max(1, Math.ceil(toNumberSafe(durationSeconds, 3600) / 60));

  return {
    id: toStringSafe(meta.id, testId),
    title: toStringSafe(meta.title, toStringSafe(attempt.practice_test_title, "Reading Test")),
    durationMinutes,
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

function buildReadingAttemptContentSignature(test: ReadingFullTest) {
  return test.questions
    .map((question) => `${question.number}:${question.id}:${question.type}`)
    .join("|");
}

export default function ReadingTestPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("readingTest");
  const role = useAppSessionRole();
  const isGuest = role === "guest";

  const testId = typeof params?.id === "string" ? params.id : "";
  const restartRequested = searchParams.get("restart") === "1";
  const modeParam = searchParams.get("mode");
  const scopedPassageId = searchParams.get("passageId")?.trim() ?? "";
  const marathonIdParam = searchParams.get("marathonId")?.trim() ?? "";
  const marathonDayNumber = Number(searchParams.get("dayNumber")?.trim() ?? "");
  const isMarathonContext = UUID_PATTERN.test(marathonIdParam) && Number.isInteger(marathonDayNumber) && marathonDayNumber > 0;
  const requestedMode: AttemptMode | null =
    modeParam === "real" || modeParam === "practice" ? modeParam : null;
  const reviewRequested = searchParams.get("review") === "1";
  const reviewAttemptParam = searchParams.get("attempt")?.trim() ?? "";
  const reviewAttemptId = reviewRequested && UUID_PATTERN.test(reviewAttemptParam) ? reviewAttemptParam : null;
  const shouldLoadFromBackend = Boolean(testId);
  const [test, setTest] = useState<ReadingFullTest | null>(null);
  const [backendAttemptId, setBackendAttemptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(shouldLoadFromBackend);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUserKey, setCurrentUserKey] = useState<string | null>(isGuest ? "guest" : null);

  useEffect(() => {
    if (isGuest) {
      setCurrentUserKey("guest");
      return;
    }

    let active = true;

    const loadCurrentUser = async () => {
      try {
        const response = await authApi.me();
        if (!active) return;
        const userId = typeof response.data?.id === "string" ? response.data.id.trim() : "";
        setCurrentUserKey(userId ? `user:${userId}` : "user:unknown");
      } catch {
        if (!active) return;
        setCurrentUserKey("user:unknown");
      }
    };

    void loadCurrentUser();

    return () => {
      active = false;
    };
  }, [isGuest]);

  useEffect(() => {
    if (!shouldLoadFromBackend || !testId) return;

    let active = true;

    const loadBackendTest = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        if (isMarathonContext) {
          if (isGuest) {
            throw new Error("Marathon content requires an enrolled student session.");
          }

          const marathonAttempt = reviewAttemptId
            ? await studentMarathonService.getAttempt(marathonIdParam, marathonDayNumber, reviewAttemptId)
            : await studentMarathonService.startAttempt(marathonIdParam, marathonDayNumber, { passage_id: testId });
          if (!active) return;

          const adapted = adaptMarathonReadingAttemptToDetail(marathonAttempt, testId);
          if (!adapted) {
            throw new Error("Failed to load marathon reading content.");
          }

          const mappedTest = mapBackendAttemptToReadingTest(testId, adapted.meta, adapted.attempt, adapted.attempt.scoped_reading_passage_id ?? undefined);
          if (!mappedTest.questions.length) {
            throw new Error("No questions returned for this marathon reading attempt.");
          }

          setBackendAttemptId(marathonAttempt.id);
          saveRuntimeReadingTest(mappedTest);
          setTest(mappedTest);
          return;
        }

        if (isGuest) {
          const cached = getReadingTestById(testId);
          if (cached) {
            setBackendAttemptId(null);
            setTest(cached);
            return;
          }

          const collected: StudentTestRecord[] = [];
          let nextPath = "/api/public/tests/reading?page_size=100";

          while (nextPath) {
            const response = await fetch(nextPath, { cache: "no-store" });
            if (!response.ok) break;
            const payload = (await response.json().catch(() => null)) as { results?: unknown; next?: unknown } | null;
            const results = asArray<StudentTestRecord>((payload as {results?: unknown} | null)?.results);
            collected.push(...results);

            const next = typeof payload?.next === "string" ? payload.next.trim() : "";
            if (!next) {
              nextPath = "";
              continue;
            }

            try {
              const url = new URL(next);
              nextPath = `/api/public/tests/reading${url.search}`;
            } catch {
              nextPath = "";
            }
          }

          const matched = collected.find((item) => String(item.id) === testId);
          if (!matched) {
            setTest(null);
            setBackendAttemptId(null);
            setLoadError(t("notFoundDesc"));
            return;
          }

          if (matched.active_for_registered_users) {
            setTest(null);
            setBackendAttemptId(null);
            setLoadError(t.has("requiresAccountDesc") ? t("requiresAccountDesc") : "This test requires an account.");
            return;
          }

          const attemptResponse = await fetch("/api/public/attempts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify({
              practice_test: testId,
              mode: requestedMode === "real" ? "REAL" : "PRACTICE"
            }),
            cache: "no-store"
          });
          if (!attemptResponse.ok) {
            setTest(null);
            setBackendAttemptId(null);
            setLoadError(t.has("requiresAccountDesc") ? t("requiresAccountDesc") : "This test requires an account.");
            return;
          }
          const attemptPayload = await attemptResponse.json().catch(() => null);
          const mappedTest = mapBackendAttemptToReadingTest(testId, matched, attemptPayload as StudentAttemptDetail, scopedPassageId);
          if (!mappedTest.questions.length) {
            throw new Error("No questions returned for this reading test.");
          }

          setBackendAttemptId(null);
          saveRuntimeReadingTest(mappedTest);
          setTest(mappedTest);
          return;
        }

        const listed = await studentTestsService.listReadingAllPages({ pageSize: 100 });
        if (!active) return;

        const matched = listed.results.find((item) => String(item.id) === testId);
        if (!matched) {
          setTest(null);
          setBackendAttemptId(null);
          setLoadError(t("notFoundDesc"));
          return;
        }

        let finalAttempt: StudentAttemptDetail;
        let finalAttemptId: string;

        if (reviewAttemptId) {
          finalAttempt = await studentAttemptsService.getById(reviewAttemptId);
          if (!active) return;
          finalAttemptId = reviewAttemptId;
        } else {
          const attempt = scopedPassageId
            ? await studentAttemptsService.createScoped({
                passage_id: scopedPassageId,
                mode: requestedMode === "real" ? "REAL" : "PRACTICE"
              })
            : await studentAttemptsService.create({
                practice_test: testId,
                mode: requestedMode === "real" ? "REAL" : "PRACTICE"
              });
          if (!active) return;

          const hydratedAttempt =
            hasAttemptQuestionData(attempt)
              ? attempt
              : await studentAttemptsService.getById(String(attempt.id));
          if (!active) return;

          finalAttempt = hydratedAttempt;
          finalAttemptId = String(hydratedAttempt.id);

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

              const freshAttempt = scopedPassageId
                ? await studentAttemptsService.createScoped({
                    passage_id: scopedPassageId,
                    mode: requestedMode === "real" ? "REAL" : "PRACTICE"
                  })
                : await studentAttemptsService.create({
                    practice_test: testId,
                    mode: requestedMode === "real" ? "REAL" : "PRACTICE"
                  });
              if (!active) return;
              finalAttempt = hasAttemptQuestionData(freshAttempt)
                ? freshAttempt
                : await studentAttemptsService.getById(String(freshAttempt.id));
              if (!active) return;
              finalAttemptId = String(finalAttempt.id);
            } catch {
              // Keep original attempt and surface generic empty-data error below.
            }
          }
        }

        const mappedTest = mapBackendAttemptToReadingTest(testId, matched, finalAttempt, scopedPassageId);
        if (!mappedTest.questions.length) {
          throw new Error("No questions returned for this reading attempt.");
        }
        setBackendAttemptId(finalAttemptId);
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
  }, [isGuest, isMarathonContext, marathonDayNumber, marathonIdParam, requestedMode, restartRequested, reviewAttemptId, scopedPassageId, shouldLoadFromBackend, t, testId]);

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
      isGuest={isGuest}
      currentUserKey={currentUserKey}
    />
  );
}

type ReadingTestClientProps = {
  test: ReadingFullTest;
  backendAttemptId?: string | null;
  restartRequested?: boolean;
  requestedMode?: AttemptMode | null;
  isGuest?: boolean;
  currentUserKey?: string | null;
};

function ReadingTestClient({
  test,
  backendAttemptId: initialBackendAttemptId = null,
  restartRequested = false,
  requestedMode = null,
  isGuest = false,
  currentUserKey = null
}: ReadingTestClientProps) {
  const searchParams = useSearchParams();
  const t = useTranslations("readingTest");
  const tReadingResult = useTranslations("readingResult");
  const tOptions = useTranslations("testOptions");
  const locale = useLocale();
  const router = useRouter();
  const reviewDeepLinkAttemptIdRaw = searchParams.get("attempt")?.trim() ?? "";
  const reviewDeepLinkActive = searchParams.get("review") === "1" && UUID_PATTERN.test(reviewDeepLinkAttemptIdRaw);
  const reviewDeepLinkAttemptId = reviewDeepLinkActive ? reviewDeepLinkAttemptIdRaw : null;
  const marathonIdParam = searchParams.get("marathonId")?.trim() ?? "";
  const marathonDayNumber = Number(searchParams.get("dayNumber")?.trim() ?? "");
  const isMarathonContext = UUID_PATTERN.test(marathonIdParam) && Number.isInteger(marathonDayNumber) && marathonDayNumber > 0;
  const returnToParam = searchParams.get("returnTo")?.trim() ?? "";
  const returnLabelParam = searchParams.get("returnLabel")?.trim() ?? "";
  const returnQuerySuffix = useMemo(() => {
    const params = new URLSearchParams();
    if (returnToParam.startsWith("/")) {
      params.set("returnTo", returnToParam);
      if (returnLabelParam) params.set("returnLabel", returnLabelParam);
    }
    if (isMarathonContext) {
      params.set("marathonId", marathonIdParam);
      params.set("dayNumber", String(marathonDayNumber));
    }
    const serialized = params.toString();
    return serialized ? `&${serialized}` : "";
  }, [isMarathonContext, marathonDayNumber, marathonIdParam, returnLabelParam, returnToParam]);
  type RealModeInterruptionReason = "fullscreen" | "visibility";
  const [attemptId, setAttemptId] = useState<string>("");
  const [startedAt, setStartedAt] = useState<number>(0);
  const [finishOpen, setFinishOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(reviewDeepLinkActive);
  const [reviewAnswersVisible, setReviewAnswersVisible] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  const [activePassageId, setActivePassageId] = useState<"p1" | "p2" | "p3">("p1");
  const [activeQuestionNumber, setActiveQuestionNumber] = useState(1);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"passage" | "questions">("passage");
  const [selectedHeadingOption, setSelectedHeadingOption] = useState<string | null>(null);
  const [draggingHeadingOption, setDraggingHeadingOption] = useState<string | null>(null);
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
  const [backendAttemptId, setBackendAttemptId] = useState<string | null>(initialBackendAttemptId);
  const attemptTabIdRef = useRef(createAttemptTabId());
  const attemptContentSignature = useMemo(() => buildReadingAttemptContentSignature(test), [test]);
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
    fullscreenSupported,
    enterFullscreen,
    exitFullscreen,
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
  const backendAttemptLifecycleRef = useRef<"active" | "submitting" | "submitted">("active");
  const initialBackendSaveAttemptRef = useRef<string | null>(null);
  const restartNeedsFreshBackendAttemptRef = useRef(false);
  const leaveWarningMessage = t.has("leaveWarning")
    ? t("leaveWarning")
    : "Are you sure you want to quit this test? Your results will not be saved.";

  const leaveConfirm = useLeaveConfirm({
    enabled: Boolean(attemptId) && !reviewMode,
    title: t.has("leaveTitle") ? t("leaveTitle") : "Leave test?",
    message: leaveWarningMessage,
    confirmText: t.has("leaveConfirm") ? t("leaveConfirm") : "Quit test",
    cancelText: t.has("cancel") ? t("cancel") : "Cancel",
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
    setReviewAnswersVisible(false);
    setBackendReviewData(null);
    setExpandedExplanations(new Set());
    setActivePassageId("p1");
    setActiveQuestionNumber(1);
    setAnswers({});
    setMarked(new Set());
    setPaletteOpen(false);
    setMobilePanel("passage");
    setSelectedHeadingOption(null);
    setDraggingHeadingOption(null);
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
    if (!isGuest && !currentUserKey) {
      return;
    }
    initDoneRef.current = true;

    if (reviewDeepLinkActive && reviewDeepLinkAttemptId) {
      const initTimer = window.setTimeout(() => {
        setAttemptId(createAttemptId());
        setStartedAt(Date.now());
        setAttemptMode("practice");
        setTimerRunning(false);
        setFinishOpen(false);
        setRestartOpen(false);
        setReviewMode(true);
        setReviewAnswersVisible(false);
        setBackendAttemptId(reviewDeepLinkAttemptId);
        setExpandedExplanations(new Set());
        setAnswers({});
        setMarked(new Set());
        setPaletteOpen(false);
      }, 0);
      return () => window.clearTimeout(initTimer);
    }

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
    const expectedBackendAttemptId = toStringSafe(initialBackendAttemptId).trim();
    const savedBackendAttemptId = toStringSafe(saved?.backendAttemptId).trim();
    const expectedOwnerKey = isGuest ? "guest" : currentUserKey;
    const savedOwnerKey = toStringSafe(saved?.ownerKey).trim();
    const savedContentSignature = toStringSafe(saved?.contentSignature).trim();
    const canRestoreSaved =
      Boolean(saved)
      && (isGuest
        ? !savedBackendAttemptId
        : expectedBackendAttemptId
          ? savedBackendAttemptId === expectedBackendAttemptId
          : !savedBackendAttemptId)
      && Boolean(expectedOwnerKey)
      && savedOwnerKey === expectedOwnerKey
      && savedContentSignature === attemptContentSignature;

    if (saved && !canRestoreSaved) {
      clearLatestAttemptProgress("reading", test.id);
      releaseAttemptTab("reading", test.id, saved.attemptId, saved.tabId ?? attemptTabIdRef.current);
    }

    if (saved && canRestoreSaved) {
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
  }, [attemptContentSignature, currentUserKey, initialBackendAttemptId, isGuest, requestedMode, restartRequested, reviewDeepLinkActive, reviewDeepLinkAttemptId, test.id]);

  useEffect(() => {
    if (!attemptId || reviewDeepLinkActive) return;
    const tabId = attemptTabIdRef.current;
    claimAttemptTab("reading", test.id, attemptId, tabId);

    return () => {
      releaseAttemptTab("reading", test.id, attemptId, tabId);
    };
  }, [attemptId, reviewDeepLinkActive, test.id]);

  useEffect(() => {
    if (reviewDeepLinkActive) {
      return;
    }
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
  }, [attemptMode, requestedMode, restartRequested, reviewDeepLinkActive]);

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

  const passageMatchingHeadingQuestions = useMemo(
    () => passageQuestions.filter((question): question is MatchingHeadingsQuestion => question.type === "matchingHeadings"),
    [passageQuestions]
  );

  const matchingHeadingQuestionByLetter = useMemo(() => {
    const map = new Map<string, MatchingHeadingsQuestion>();
    passageMatchingHeadingQuestions
      .forEach((question) => {
        const letter = extractMatchingHeadingTargetLetter(question.target ?? question.prompt);
        if (!letter || map.has(letter)) return;
        map.set(letter, question);
      });
    return map;
  }, [passageMatchingHeadingQuestions]);

  const reviewQuestions = useMemo(
    () => backendReviewData?.questions ?? test.questions,
    [backendReviewData, test.questions]
  );
  const reviewQuestionById = useMemo(
    () => new Map(reviewQuestions.map((question) => [question.id, question])),
    [reviewQuestions]
  );
  const reviewQuestionByNumber = useMemo(
    () => new Map(reviewQuestions.map((question) => [question.number, question])),
    [reviewQuestions]
  );
  const reviewAnswers = useMemo(
    () => {
      if (!backendReviewData) return answers;

      const normalized = normalizeBackendReviewAnswers(backendReviewData.answers);
      const merged: Record<string, AnswerValue> = {...normalized};
      const runtimeQuestionByNumber = new Map(test.questions.map((question) => [question.number, question]));

      backendReviewData.questions.forEach((reviewQuestion) => {
        const reviewAnswer = normalized[reviewQuestion.id];
        if (reviewAnswer === undefined) return;

        const runtimeQuestion = runtimeQuestionByNumber.get(reviewQuestion.number);
        if (runtimeQuestion) {
          merged[runtimeQuestion.id] = reviewAnswer;
        }
      });

      return merged;
    },
    [answers, backendReviewData, test.questions]
  );
  const displayedAnswers = reviewMode ? reviewAnswers : answers;
  const answeredNumbers = useMemo(() => {
    const set = new Set<number>();
    test.questions.forEach((question) => {
      if (isAnswered(displayedAnswers[question.id])) {
        set.add(question.number);
      }
    });
    return set;
  }, [displayedAnswers, test.questions]);

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
  const gradingByNumber = useMemo(() => {
    const map = new Map<number, (typeof grading.byQuestion)[string]>();
    reviewQuestions.forEach((question) => {
      map.set(question.number, grading.byQuestion[question.id]);
    });
    return map;
  }, [grading.byQuestion, reviewQuestions]);

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
    setBackendAttemptId(initialBackendAttemptId);
  }, [initialBackendAttemptId, test.id]);

  useEffect(() => {
    if (reviewDeepLinkActive) return;
    if (!attemptId || !attemptMode) return;
    if (!isAttemptTabOwner("reading", test.id, attemptId, attemptTabIdRef.current)) return;
    saveAttemptProgress({
      attemptId,
      backendAttemptId: backendAttemptId ?? undefined,
      ownerKey: isGuest ? "guest" : currentUserKey ?? undefined,
      contentSignature: attemptContentSignature,
      tabId: attemptTabIdRef.current,
      module: "reading",
      testId: test.id,
      mode: attemptMode,
      answers,
      markedQuestionIds: [...marked],
      startedAt,
      timeRemainingSec: remainingSeconds,
      timerUsed: timerRunning || remainingSeconds !== test.durationMinutes * 60,
    });
  }, [answers, attemptContentSignature, attemptId, attemptMode, backendAttemptId, currentUserKey, isGuest, marked, remainingSeconds, reviewDeepLinkActive, startedAt, test.durationMinutes, test.id, timerRunning]);

  useEffect(() => {
    if (!reviewDeepLinkActive || !reviewDeepLinkAttemptId) return;
    let active = true;

    const loadReview = async () => {
      try {
        const reviewResponse = isMarathonContext
          ? await (async () => {
              const [attemptResponse, resultResponse] = await Promise.all([
                studentMarathonService.getAttempt(marathonIdParam, marathonDayNumber, reviewDeepLinkAttemptId),
                studentMarathonService.reviewAttempt(marathonIdParam, marathonDayNumber, reviewDeepLinkAttemptId),
              ]);
              return adaptMarathonReadingReviewResponse({
                attempt: attemptResponse,
                result: resultResponse,
                routeId: test.id,
              });
            })()
          : await studentAttemptsService.review(reviewDeepLinkAttemptId);
        if (!active) return;
        if (!reviewResponse) return;
        setBackendReviewData(adaptReadingBackendReview(reviewResponse));
      } catch {
        // Keep review mode fallback UI (no explanations/evidence) on failure.
      }
    };

    void loadReview();

    return () => {
      active = false;
    };
  }, [isMarathonContext, marathonDayNumber, marathonIdParam, reviewDeepLinkActive, reviewDeepLinkAttemptId, test.id]);

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
    (options?: {strict?: boolean; includeAnswers?: boolean; context?: string; finishedAtMs?: number; allowDuringSubmit?: boolean}) => {
      const strict = Boolean(options?.strict);
      const includeAnswers = options?.includeAnswers ?? true;

      const runSave = async () => {
        if (!backendAttemptId || reviewMode) return;
        if (backendAttemptLifecycleRef.current !== "active" && !options?.allowDuringSubmit) return;
        if (attemptId && !isAttemptTabOwner("reading", test.id, attemptId, attemptTabIdRef.current)) return;

        const runtimeSubmitCandidatesByNumber = collectRuntimeSubmitCandidatesByNumber(test.questions);
        const activeEntries = includeAnswers
          ? collectBackendAttemptAnswerEntries({
              questions: test.questions,
              answers,
              marked,
              submitCandidatesByNumber: runtimeSubmitCandidatesByNumber
            })
          : [];

        const payloadAnswers = toReadingBackendAnswerPayload(activeEntries)
          .filter((item) => item.answer !== null || item.is_flagged);

        if (includeAnswers && activeEntries.length > 0 && payloadAnswers.length === 0) {
          if (strict) {
            throw new Error("No valid attempt question IDs resolved for current answers.");
          }
          return;
        }

        const savePayload = {
          time_used_seconds: resolveTimeUsedSeconds(options?.finishedAtMs),
          answers: payloadAnswers
        };

        try {
          if (isMarathonContext) {
            await studentMarathonService.saveAttempt(marathonIdParam, marathonDayNumber, backendAttemptId, {
              time_used_seconds: savePayload.time_used_seconds,
              answers: toMarathonSaveAnswers(savePayload.answers),
            });
          } else {
            await studentAttemptsService.save(backendAttemptId, savePayload);
          }
          return;
        } catch (error) {
          const failedQuestionIds = extractValidationAnswerQuestionIdFailures(error);
          if (!failedQuestionIds.size) {
            throw error;
          }

          try {
            const freshSnapshot = await (isMarathonContext
              ? (() => {
                  const response = studentMarathonService.getAttempt(marathonIdParam, marathonDayNumber, backendAttemptId);
                  return response.then((attemptResponse) => adaptMarathonReadingAttemptToDetail(attemptResponse, test.id)?.attempt ?? null);
                })()
              : studentAttemptsService.getById(backendAttemptId));
            if (!freshSnapshot) {
              throw error;
            }
            const freshByNumber = collectAttemptSubmitCandidatesByNumber(freshSnapshot);
            const freshAllowedAttemptScopedIds = collectAttemptScopedIdPool(freshSnapshot);
            const retryEntries = includeAnswers
              ? collectBackendAttemptAnswerEntries({
                  questions: test.questions,
                  answers,
                  marked,
                  submitCandidatesByNumber: freshByNumber,
                  allowedAttemptScopedIds: freshAllowedAttemptScopedIds
                })
              : [];
            const retryPayloadAnswers = toReadingBackendAnswerPayload(retryEntries)
              .filter((item) => item.answer !== null || item.is_flagged);

            if (isMarathonContext) {
              await studentMarathonService.saveAttempt(marathonIdParam, marathonDayNumber, backendAttemptId, {
                time_used_seconds: resolveTimeUsedSeconds(options?.finishedAtMs),
                answers: toMarathonSaveAnswers(retryPayloadAnswers),
              });
            } else {
              await studentAttemptsService.save(backendAttemptId, {
                time_used_seconds: resolveTimeUsedSeconds(options?.finishedAtMs),
                answers: retryPayloadAnswers
              });
            }
            return;
          } catch (retryError) {
            if (strict) {
              throw retryError;
            }
          }
        }
      };

      const run = backendSaveChainRef.current.then(runSave, runSave);
      backendSaveChainRef.current = run.catch(() => undefined);

      if (strict) {
        return run;
      }

      return run.catch(() => undefined);
    },
    [answers, attemptId, backendAttemptId, isMarathonContext, marked, marathonDayNumber, marathonIdParam, resolveTimeUsedSeconds, reviewMode, test.id, test.questions]
  );

  useEffect(() => {
    backendAttemptLifecycleRef.current = "active";
    if (!backendAttemptId) {
      initialBackendSaveAttemptRef.current = null;
    }
  }, [backendAttemptId, test.id]);

  useEffect(() => {
    if (isGuest) {
      restartNeedsFreshBackendAttemptRef.current = false;
      return;
    }
    if (!attemptMode || reviewMode) {
      return;
    }
    if (!restartNeedsFreshBackendAttemptRef.current) {
      return;
    }

    restartNeedsFreshBackendAttemptRef.current = false;
    let active = true;

    const createFreshAttemptAfterRestart = async () => {
      try {
        let hydratedAttempt: StudentAttemptDetail | null = null;
        if (isMarathonContext) {
          const createdAttempt = await studentMarathonService.startAttempt(marathonIdParam, marathonDayNumber, { passage_id: test.id });
          hydratedAttempt = adaptMarathonReadingAttemptToDetail(createdAttempt, test.id)?.attempt ?? null;
        } else {
          const createdAttempt = await studentAttemptsService.create({
            practice_test: test.id,
            mode: attemptMode === "real" ? "REAL" : "PRACTICE"
          });
          hydratedAttempt = hasAttemptQuestionData(createdAttempt)
            ? createdAttempt
            : await studentAttemptsService.getById(String(createdAttempt.id));
        }
        if (!active) return;
        if (!hydratedAttempt) {
          throw new Error("Failed to restart marathon reading attempt.");
        }

        setBackendAttemptId(String(hydratedAttempt.id));
        initialBackendSaveAttemptRef.current = null;
      } catch {
        if (!active) return;
        setBackendAttemptId(null);
      }
    };

    void createFreshAttemptAfterRestart();

    return () => {
      active = false;
    };
  }, [attemptMode, isGuest, isMarathonContext, marathonDayNumber, marathonIdParam, reviewMode, test.id]);

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
    }, 3000);
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
  const reviewCorrectCount = grading.correctCount;
  const reviewTotalCount = grading.total;
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
        return count + (isAnswered(displayedAnswers[question.id]) ? 1 : 0);
      }, 0);

      return {
        passageId: passage.id,
        index: index + 1,
        numbers,
        answered,
      };
    });
  }, [displayedAnswers, questionsByNumber, test.passages, test.questions]);
  const activePassagePaletteSection = useMemo(
    () =>
      passagePaletteSections.find((section) => section.passageId === activePassageId)
      ?? passagePaletteSections[0]
      ?? null,
    [activePassageId, passagePaletteSections]
  );
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
      headerLetter: extractParagraphHeaderLetter(paragraph),
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

  const assignMatchingHeading = useCallback((questionId: string, headingValue: string) => {
    const normalized = headingValue.trim();
    if (!normalized) return;
    setAnswers((prev) => ({ ...prev, [questionId]: normalized }));
    setSelectedHeadingOption(null);
  }, []);

  const clearMatchingHeading = useCallback((questionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: "" }));
  }, []);

  const assignMatchingInfo = useCallback((questionId: string, optionValue: string) => {
    const normalized = optionValue.trim();
    if (!normalized) return;
    setAnswers((prev) => ({ ...prev, [questionId]: normalized }));
  }, []);

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
      const baseQuestion = test.questions.find((item) => item.id === questionId);
      const question =
        reviewQuestionById.get(questionId)
        ?? (baseQuestion ? reviewQuestionByNumber.get(baseQuestion.number) : null)
        ?? baseQuestion
        ?? null;
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
    [activePassageId, reviewQuestionById, reviewQuestionByNumber, test.questions]
  );

  const finishTest = useCallback(async () => {
    if (!attemptId || isSubmittingResult) return;
    if (backendAttemptLifecycleRef.current !== "active") return;
    if (!isAttemptTabOwner("reading", test.id, attemptId, attemptTabIdRef.current)) return;
    backendAttemptLifecycleRef.current = "submitting";
    setIsSubmittingResult(true);

    const finishedAt = Date.now();
    const timerUsed = timerRunning || remainingSeconds !== test.durationMinutes * 60;
    const timeUsedSeconds = resolveTimeUsedSeconds(finishedAt);

    try {
      if (backendAttemptId) {
        await saveAttemptToBackend({
          strict: true,
          includeAnswers: true,
          context: "finish",
          finishedAtMs: finishedAt,
          allowDuringSubmit: true
        });

        const buildSubmitAnswers = (
          submitCandidatesByNumber: Map<number, string[]>,
          allowedAttemptScopedIds?: Set<string>
        ) => toReadingBackendAnswerPayload(collectBackendAttemptAnswerEntries({
          questions: test.questions,
          answers,
          marked,
          submitCandidatesByNumber,
          allowedAttemptScopedIds,
          includeUnanswered: true
        }));

        try {
          if (isMarathonContext) {
            await studentMarathonService.submitAttempt(marathonIdParam, marathonDayNumber, backendAttemptId, {
              time_used_seconds: timeUsedSeconds,
              answers: toMarathonSaveAnswers(buildSubmitAnswers(collectRuntimeSubmitCandidatesByNumber(test.questions))),
            });
          } else {
            await studentAttemptsService.submit(backendAttemptId, {
              time_used_seconds: timeUsedSeconds,
              answers: buildSubmitAnswers(collectRuntimeSubmitCandidatesByNumber(test.questions))
            });
          }
        } catch (error) {
          if (isMarathonContext) {
            throw error;
          }
          const failedQuestionIds = extractValidationAnswerQuestionIdFailures(error);
          if (!failedQuestionIds.size) {
            throw error;
          }

          const freshSnapshot = await studentAttemptsService.getById(backendAttemptId);
          await studentAttemptsService.submit(backendAttemptId, {
            time_used_seconds: timeUsedSeconds,
            answers: buildSubmitAnswers(
              collectAttemptSubmitCandidatesByNumber(freshSnapshot),
              collectAttemptScopedIdPool(freshSnapshot)
            )
          });
        }
      }

      backendAttemptLifecycleRef.current = "submitted";
      saveAttemptResult({
        attemptId,
        backendAttemptId: backendAttemptId ?? undefined,
        ownerKey: isGuest ? "guest" : currentUserKey ?? undefined,
        contentSignature: attemptContentSignature,
        tabId: attemptTabIdRef.current,
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

      if (isGuest && !backendAttemptId) {
        const keyToBackend = new Map<string, string>();
        test.questions.forEach((question) => {
          const backendKey = (question.backendQuestionId ?? question.id).trim();
          if (backendKey) {
            keyToBackend.set(question.id, backendKey);
          }
        });

        const queuedAnswers: Record<string, string | string[] | null> = {};
        for (const [key, value] of Object.entries(answers)) {
          const backendKey = keyToBackend.get(key) ?? key;
          if (typeof value === "string") {
            const trimmed = value.trim();
            queuedAnswers[backendKey] = trimmed.length ? trimmed : null;
          } else if (Array.isArray(value)) {
            const cleaned = value.map((entry) => entry.trim()).filter(Boolean);
            queuedAnswers[backendKey] = cleaned.length ? cleaned : null;
          } else {
            queuedAnswers[backendKey] = null;
          }
        }

        const queuedMarked = [...marked].map((key) => keyToBackend.get(key) ?? key);

        enqueueGuestPendingAttempt({
          module: "reading",
          testId: test.id,
          localAttemptId: attemptId,
          mode: attemptMode ?? "practice",
          finishedAt,
          timeUsedSeconds,
          answers: queuedAnswers,
          markedQuestionIds: queuedMarked
        });
      }

      setFinishOpen(false);
      setTimerRunning(false);

      if (backendAttemptId) {
        if (isMarathonContext) {
          router.push(`/${locale}/reading/${test.id}/result?attempt=${backendAttemptId}${returnQuerySuffix}`);
          return;
        }
        router.push(`/${locale}/reading/${test.id}/result?attempt=${backendAttemptId}${returnQuerySuffix}`);
        return;
      }

      if (isGuest) {
        router.push(`/${locale}/reading/${test.id}/result?attempt=${attemptId}${returnQuerySuffix}`);
        return;
      }

      // Fallback: if backend attempt is missing, keep the in-test review mode.
      setReviewMode(true);
      setReviewAnswersVisible(false);
    } catch {
      backendAttemptLifecycleRef.current = "active";
      // Keep submit failure silent in UI logs.
    } finally {
      setIsSubmittingResult(false);
    }
  }, [
    answers,
    attemptContentSignature,
    attemptId,
    attemptMode,
    backendAttemptId,
    currentUserKey,
    isGuest,
    isMarathonContext,
    isSubmittingResult,
    marathonDayNumber,
    marathonIdParam,
    marked,
    remainingSeconds,
    resolveTimeUsedSeconds,
    saveAttemptToBackend,
    startedAt,
    test.durationMinutes,
    test.id,
    test.questions,
    timerRunning,
    router,
    locale,
  ]);

  const requestRealModeFullscreen = useCallback(async () => {
    if (!fullscreenSupported) {
      return true;
    }
    if (isFullscreen) {
      return true;
    }

    try {
      fullscreenRequestInFlightRef.current = true;
      return await enterFullscreen();
    } catch {
      return false;
    } finally {
      window.setTimeout(() => {
        fullscreenRequestInFlightRef.current = false;
      }, 120);
    }
  }, [enterFullscreen, fullscreenSupported, isFullscreen]);

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
    void exitFullscreen();
  }, [exitFullscreen]);

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
    if (!fullscreenSupported || !isRealMode || reviewMode || isFullscreen || realModeInterruption !== null) {
      return;
    }
    void requestRealModeFullscreen().then((enteredFullscreen) => {
      if (!enteredFullscreen) {
        triggerRealModeInterruption("fullscreen");
      }
    });
  }, [fullscreenSupported, isFullscreen, isRealMode, realModeInterruption, requestRealModeFullscreen, reviewMode, triggerRealModeInterruption]);

  useEffect(() => {
    if (!fullscreenSupported || !isRealMode || reviewMode || realModeInterruption !== null) {
      return;
    }
    if (isFullscreen || fullscreenRequestInFlightRef.current) {
      return;
    }
    triggerRealModeInterruption("fullscreen");
  }, [fullscreenSupported, isFullscreen, isRealMode, realModeInterruption, reviewMode, triggerRealModeInterruption]);

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
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("copy", onCopy);
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
    setRestartOpen(true);
  };

  const confirmRestartTest = () => {
    setRestartOpen(false);
    restartNeedsFreshBackendAttemptRef.current = true;
    setBackendAttemptId(null);
    initialBackendSaveAttemptRef.current = null;
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
            <Link
              href={`/${locale}`}
              aria-label="Go to home"
              className="flex min-w-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
            >
              <BrandIcon size={32} />
              <p className="truncate text-base font-semibold sm:text-lg">EnglishLabs</p>
            </Link>
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
            {fullscreenSupported ? (
              <Button
                type="button"
                variant="outline"
                onClick={toggleFullscreen}
                className="h-9 w-9 rounded-xl border-border/70 bg-background/60 p-0 sm:h-10 sm:w-10"
                aria-label={isFullscreen ? tOptions("exitFullscreen") : tOptions("enterFullscreen")}
              >
                {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setOptionsOpen(true)}
              className="h-9 w-9 rounded-xl border-border/70 bg-background/60 p-0 sm:h-10 sm:w-10"
              aria-label={tOptions("title")}
            >
              <Menu className="size-4" />
            </Button>
            <TestNotesButton storageKey={`reading:${test.id}:notes`} />
            <Button
              type="button"
              variant="outline"
              onClick={() => setHighlights([])}
              className="h-9 rounded-xl px-3 text-xs sm:h-10 sm:text-sm"
            >
              {t.has("clearHighlights") ? t("clearHighlights") : "Clear highlights"}
            </Button>
            {reviewMode ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setReviewAnswersVisible((visible) => !visible)}
                className="h-9 rounded-xl border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-500/35 dark:bg-blue-500/15 dark:text-blue-100 dark:hover:bg-blue-500/20 sm:h-10 sm:text-sm"
              >
                {reviewAnswersVisible
                  ? (tReadingResult.has("hideAnswers") ? tReadingResult("hideAnswers") : "Hide answers")
                  : (tReadingResult.has("showAnswers") ? tReadingResult("showAnswers") : "Show answers")}
              </Button>
            ) : null}
            {reviewMode ? (
              <Badge variant="secondary" className="h-9 rounded-xl border border-emerald-300/60 bg-emerald-100/80 px-3 text-xs font-semibold text-emerald-900 dark:border-emerald-500/45 dark:bg-emerald-500/20 dark:text-emerald-100 sm:h-10 sm:text-sm">
                {t.has("correctOutOfTotal")
                  ? t("correctOutOfTotal", { correct: reviewCorrectCount, total: reviewTotalCount })
                  : `Correct: ${reviewCorrectCount}/${reviewTotalCount}`}
              </Badge>
            ) : null}
            {reviewMode ? (
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
                {passageParagraphs.map(({ paragraph, index, start: paragraphStart, headerLetter }) => {
                  const paragraphId = `para-${activePassageId}-${index}`;
                  const paragraphHighlights = highlightsForPassage.filter((span) => span.paragraphIndex === index);
                  const matches = findParagraphMatches(paragraph, paragraphHighlights);
                  const answerLocalHighlights = matches.map((match, matchIndex) => ({
                    id: `answer-${activePassageId}-${index}-${matchIndex}`,
                    start: match.start,
                    end: match.end,
                    questionNumber: match.questionNumber,
                  }));
                  const headingQuestion = headerLetter ? matchingHeadingQuestionByLetter.get(headerLetter) : null;
                  const headingAnswerValue = headingQuestion ? displayedAnswers[headingQuestion.id] : undefined;
                  const headingAnswer = typeof headingAnswerValue === "string" ? headingAnswerValue : "";
                  const headingOptions = headingQuestion
                    ? headingQuestion.headingOptions
                        .map((option, index) => parseMatchingHeadingOption(option, index))
                        .filter((option) => Boolean(option.key))
                    : [];
                  const headingOptionLabelByKey = new Map<string, string>();
                  const headingInstructionLabels = parseMatchingHeadingsFromInstruction(headingQuestion?.groupInstruction);
                  headingOptions.forEach((option) => {
                    const labelFromInstruction = headingInstructionLabels.get(option.key);
                    headingOptionLabelByKey.set(
                      option.key,
                      normalizeHeadingDisplayText(labelFromInstruction ?? option.label ?? option.key)
                    );
                  });
                  const headingAnswerKey = headingAnswer ? parseMatchingHeadingOption(headingAnswer).key || headingAnswer : "";
                  const headingAnswerLabel = headingAnswerKey ? normalizeHeadingDisplayText(headingOptionLabelByKey.get(headingAnswerKey) ?? "") : "";
                  const headingAnswerDisplay = headingAnswerKey
                    ? headingAnswerLabel && headingAnswerLabel !== headingAnswerKey
                      ? `${headingAnswerKey} - ${headingAnswerLabel}`
                      : headingAnswerKey
                    : "";
                  const reviewedHeadingQuestion =
                    headingQuestion
                      ? reviewQuestionById.get(headingQuestion.id)
                        ?? reviewQuestionByNumber.get(headingQuestion.number)
                        ?? headingQuestion
                      : null;
                  const reviewedHeadingCorrectAnswerRaw = reviewedHeadingQuestion
                    ? formatAnswerForDisplay(reviewedHeadingQuestion.correctAnswer)
                    : "";
                  const reviewedHeadingCorrectAnswerKey = reviewedHeadingCorrectAnswerRaw
                    ? parseMatchingHeadingOption(reviewedHeadingCorrectAnswerRaw).key || reviewedHeadingCorrectAnswerRaw
                    : "";
                  const reviewedHeadingCorrectAnswerLabel = reviewedHeadingCorrectAnswerKey
                    ? normalizeHeadingDisplayText(headingOptionLabelByKey.get(reviewedHeadingCorrectAnswerKey) ?? "")
                    : "";
                  const reviewedHeadingCorrectAnswerDisplay = reviewedHeadingCorrectAnswerKey
                    ? reviewedHeadingCorrectAnswerLabel && reviewedHeadingCorrectAnswerLabel !== reviewedHeadingCorrectAnswerKey
                      ? `${reviewedHeadingCorrectAnswerKey} - ${reviewedHeadingCorrectAnswerLabel}`
                      : reviewedHeadingCorrectAnswerKey
                    : "";
                  const headingOptionKeys = headingOptions.map((option) => option.key);

                  return (
                    <div id={paragraphId} key={paragraphId} className="space-y-2">
                      {headingQuestion && headerLetter ? (
                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/15 px-2.5 py-2">
                          <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[11px] font-semibold">
                            {headerLetter}
                          </Badge>
                          <div
                            role="button"
                            tabIndex={reviewMode ? -1 : 0}
                            aria-label={`Paragraph ${headerLetter} heading drop zone`}
                            onClick={() => {
                              if (reviewMode || !selectedHeadingOption) return;
                              if (!headingOptionKeys.includes(selectedHeadingOption)) return;
                              assignMatchingHeading(headingQuestion.id, selectedHeadingOption);
                            }}
                            onKeyDown={(event) => {
                              if (reviewMode || !selectedHeadingOption) return;
                              if (event.key !== "Enter" && event.key !== " ") return;
                              event.preventDefault();
                              if (!headingOptionKeys.includes(selectedHeadingOption)) return;
                              assignMatchingHeading(headingQuestion.id, selectedHeadingOption);
                            }}
                            onDragOver={(event) => {
                              if (reviewMode) return;
                              event.preventDefault();
                              event.dataTransfer.dropEffect = "move";
                            }}
                            onDrop={(event) => {
                              if (reviewMode) return;
                              event.preventDefault();
                              const raw =
                                event.dataTransfer.getData(HEADING_DND_MIME)
                                || event.dataTransfer.getData("text/plain");
                              const dropped = raw.trim();
                              if (!dropped || !headingOptionKeys.includes(dropped)) return;
                              assignMatchingHeading(headingQuestion.id, dropped);
                            }}
                            className={cn(
                              "min-w-36 flex-1 rounded-md border-2 border-dashed px-2.5 py-1.5 text-xs transition-colors",
                              headingAnswer
                                ? "border-blue-400/80 bg-blue-50/50 text-foreground dark:bg-blue-900/20"
                                : "border-border/80 bg-background/80 text-muted-foreground",
                              !reviewMode && "cursor-pointer hover:border-blue-300/70"
                            )}
                          >
                            {headingAnswerDisplay || (t.has("selectHeading") ? t("selectHeading") : "Select heading")}
                          </div>
                          {reviewMode && reviewAnswersVisible && headingQuestion ? (
                            <div className="w-full rounded-md border border-border/70 bg-background/65 px-2.5 py-2 text-xs text-muted-foreground">
                              <p>
                                <strong className="font-bold text-foreground">
                                  {(t.has("yourAnswer") ? t("yourAnswer") : "Your answer")}:
                                </strong>{" "}
                                <strong className="font-bold text-foreground">
                                  {headingAnswerDisplay || (t.has("noAnswer") ? t("noAnswer") : "No answer")}
                                </strong>
                              </p>
                              <p className="mt-1">
                                <strong className="font-bold text-foreground">
                                  {(t.has("correctAnswer") ? t("correctAnswer") : "Correct answer")}:
                                </strong>{" "}
                                <strong className="font-bold text-emerald-700 dark:text-emerald-200">
                                  {reviewedHeadingCorrectAnswerDisplay || (t.has("notAvailable") ? t("notAvailable") : "Not available")}
                                </strong>
                              </p>
                            </div>
                          ) : null}
                          {headingAnswer && !reviewMode ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => clearMatchingHeading(headingQuestion.id)}
                              className="h-6 rounded-md px-2 text-[11px]"
                            >
                              {t.has("clearSelection") ? t("clearSelection") : "Clear"}
                            </Button>
                          ) : null}
                        </div>
                      ) : null}

                      <p className="test-body-copy wrap-break-word text-foreground/90">
                        <HighlightableText
                          text={paragraph}
                          enableMarkdownBold
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
                    </div>
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
          <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background/45">
            <div ref={questionsScrollRef} className="min-h-0 flex-1 min-w-0 overflow-y-auto px-3 py-4 sm:px-4 lg:px-5 lg:py-6 [scrollbar-color:hsl(var(--border))_transparent]">
              <div className="space-y-7 pb-8">
                {groupedQuestions.map((group) => {
                  const matchingHeadingGroupQuestions = group.questions.filter(
                    (question): question is MatchingHeadingsQuestion => question.type === "matchingHeadings"
                  );
                  const visibleGroupQuestions = group.questions.filter((question) => question.type !== "matchingHeadings");
                  const matchingInfoGroupQuestions = visibleGroupQuestions.filter(
                    (question): question is MatchingInfoQuestion => question.type === "matchingInfo"
                  );
                  const matchingHeadingGroupOptionsRaw = (matchingHeadingGroupQuestions[0]?.headingOptions ?? [])
                    .map((option, index) => parseMatchingHeadingOption(option, index))
                    .filter((option) => Boolean(option.key))
                    .filter((option, index, source) => source.findIndex((item) => item.key === option.key) === index);
                  const matchingHeadingDescriptions = parseMatchingHeadingsFromInstruction(group.instruction);
                  const matchingHeadingGroupOptions = matchingHeadingGroupOptionsRaw.map((option) => ({
                    value: option.key,
                    label: matchingHeadingDescriptions.get(option.key) ?? option.label ?? option.key,
                  }));
                  const matchingInfoGroupOptions = matchingInfoGroupQuestions
                    .flatMap((question) => question.paragraphOptions)
                    .map((option) => option.trim())
                    .filter(Boolean)
                    .filter((option, index, source) => source.indexOf(option) === index);
                  const matchingInfoGroupParsedOptions = matchingInfoGroupOptions
                    .map((option, optionIndex) => parseMatchingInfoOption(option, optionIndex))
                    .filter((option, index, source) => source.findIndex((item) => item.key === option.key) === index);
                  const showMatchingInfoBank = matchingInfoGroupOptions.some((option, optionIndex) => {
                    const parsed = parseMatchingInfoOption(option, optionIndex);
                    return Boolean(parsed.label) && !/^\s*(?:paragraph\s+)?[A-Z]\s*[\)\].:\-]/i.test(option.trim());
                  });

                  if (!visibleGroupQuestions.length && !matchingHeadingGroupQuestions.length) {
                    return null;
                  }
                  const renderedSharedBlocksInGroup = new Set<string>();

                  return (
                    <section key={group.title} className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{group.title}</h3>
                        {group.instruction ? (
                          <div className="mt-1 wrap-break-word text-sm leading-relaxed text-foreground/85">
                            <FormattedInstructionText text={group.instruction} />
                          </div>
                        ) : null}
                      </div>

                      {matchingHeadingGroupQuestions.length ? (
                        <MatchingHeadingsBank
                          options={matchingHeadingGroupOptions}
                          selectedOption={selectedHeadingOption}
                          draggingOption={draggingHeadingOption}
                          disabled={reviewMode}
                          hintText={
                            t.has("dragHeadingHint")
                              ? t("dragHeadingHint")
                              : "Drag a heading and drop it onto a paragraph header. On mobile, tap a heading then tap a header drop zone."
                          }
                          onSelectOption={(optionValue) =>
                            setSelectedHeadingOption((prev) => (prev === optionValue ? null : optionValue))
                          }
                          onDragStartOption={(event, optionValue) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData(HEADING_DND_MIME, optionValue);
                            event.dataTransfer.setData("text/plain", optionValue);
                            setDraggingHeadingOption(optionValue);
                            setSelectedHeadingOption(optionValue);
                          }}
                          onDragEndOption={() => setDraggingHeadingOption(null)}
                        />
                      ) : null}

                      {showMatchingInfoBank && matchingInfoGroupOptions.length ? (
                        <MatchingInfoBank
                          options={matchingInfoGroupOptions}
                          hintText={
                            t.has("dragMatchingInfoHint")
                              ? t("dragMatchingInfoHint")
                              : "You may use any letter more than once."
                          }
                        />
                      ) : null}

                      <div className="space-y-3">
                        {visibleGroupQuestions.map((question) => {
                          const reviewedQuestion =
                            reviewQuestionById.get(question.id)
                            ?? reviewQuestionByNumber.get(question.number)
                            ?? question;
                          const active = activeQuestionNumber === question.number;
                          const value = displayedAnswers[question.id];
                          const result = gradingByNumber.get(question.number) ?? grading.byQuestion[question.id];
                          const answered = isAnswered(value);
                          const isCorrect = result?.isCorrect;
                          const isMarked = marked.has(question.id);
                          const reviewedCorrectAnswer = formatAnswerForDisplay(reviewedQuestion.correctAnswer);
                          const reviewedExplanation = reviewedQuestion.explanation?.trim()
                            ? reviewedQuestion.explanation
                            : (t.has("notAvailable") ? t("notAvailable") : "Not available");
                          const promptStart = 0;
                          const tfngOptionStarts =
                            question.type === "tfng"
                              ? question.options.map((_, optionIndex) =>
                                  question.prompt.length +
                                  1 +
                                  question.options.slice(0, optionIndex).reduce((sum, option) => sum + option.length + 1, 0)
                                )
                              : [];
                          const mcqChoices =
                            question.type === "mcq"
                              ? question.options.map((option, optionIndex) => parseOptionChoice(option, optionIndex))
                              : [];
                          const resolvedMcqKey =
                            question.type === "mcq"
                              ? resolveChoiceKeyFromRawValue(value, mcqChoices, question.options)
                              : "";
                          const mcqOptionLabels = question.type === "mcq" ? mcqChoices.map((choice) => choice.label) : [];
                          const mcqOptionStarts =
                            question.type === "mcq"
                              ? mcqOptionLabels.map((_, optionIndex) =>
                                  question.prompt.length +
                                  1 +
                                  mcqOptionLabels.slice(0, optionIndex).reduce((sum, option) => sum + option.length + 1, 0)
                                )
                              : [];
                          const isSummary = question.type === "summaryCompletion";
                          const isTable = question.type === "tableCompletion";
                          const isListSelection = question.type === "listSelection";
                          const isMatchingInfo = question.type === "matchingInfo";
                          const isMatchingInfoSharedBlock = isMatchingInfo && matchingInfoGroupQuestions.length > 0;
                          const isSharedQuestionBlock = isSummary || isTable || isListSelection || isMatchingInfoSharedBlock;
                          const listSelectionQuestions = isListSelection
                            ? visibleGroupQuestions.filter((item): item is Extract<ReadingQuestion, {type: "listSelection"}> => item.type === "listSelection")
                            : [];
                          if (isListSelection && listSelectionQuestions[0]?.id !== question.id) {
                            return null;
                          }
                          if (isMatchingInfo && matchingInfoGroupQuestions[0]?.id !== question.id) {
                            return null;
                          }
                          const sharedBlockKey = isSummary
                            ? `summary:${question.summaryText}`
                            : isTable
                              ? `table:${JSON.stringify({columns: question.tableColumns, rows: question.tableRows})}`
                              : isListSelection
                                ? `list:${JSON.stringify({
                                    options: question.listOptions,
                                    numbers: listSelectionQuestions.map((item) => item.number)
                                  })}`
                                : isMatchingInfoSharedBlock
                                  ? `matching-info:${matchingInfoGroupQuestions.map((item) => item.id).join(",")}`
                                  : "";
                          const isDuplicateSharedBlock = Boolean(sharedBlockKey) && renderedSharedBlocksInGroup.has(sharedBlockKey);
                          if (isDuplicateSharedBlock) {
                            return null;
                          }
                          if (sharedBlockKey) {
                            renderedSharedBlocksInGroup.add(sharedBlockKey);
                          }
                          const matchingInfoRawOptions = isMatchingInfoSharedBlock ? matchingInfoGroupOptions : [];
                          const matchingInfoParsedOptions = isMatchingInfoSharedBlock ? matchingInfoGroupParsedOptions : [];
                          const matchingInfoBlockActive = isMatchingInfoSharedBlock
                            && matchingInfoGroupQuestions.some((item) => item.number === activeQuestionNumber);
                          const articleActive = active || matchingInfoBlockActive;
                          const hasSharedShell = isSharedQuestionBlock;

                          return (
                            <article
                              key={question.id}
                              className={cn(
                                "scroll-mt-24 transition-all duration-200",
                                hasSharedShell
                                  ? "test-panel rounded-xl border p-4 hover:border-border hover:bg-accent/20"
                                  : "px-1 py-2",
                                hasSharedShell
                                  ? (articleActive
                                      ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40"
                                      : "border-border/80 bg-card/90")
                                  : (articleActive
                                      ? "rounded-lg bg-blue-500/5"
                                      : "bg-transparent"),
                                hasSharedShell && isMarked && "border-l-4 border-l-amber-400 bg-amber-50/40 dark:bg-amber-500/10",
                                !hasSharedShell && isMarked && !reviewMode && "rounded-lg bg-amber-50/30 dark:bg-amber-500/10"
                              )}
                              onClick={() => setActiveQuestionNumber(question.number)}
                              ref={(el) => {
                                if (!el) {
                                  questionRefs.current.delete(question.number);
                                  return;
                                }
                                questionRefs.current.set(question.number, el);
                                // Shared blocks render once but carry multiple questions.
                                if (question.type === "summaryCompletion" || question.type === "tableCompletion" || question.type === "listSelection" || question.type === "matchingInfo") {
                                  visibleGroupQuestions.forEach((q) => {
                                    if (q.type === "summaryCompletion" || q.type === "tableCompletion" || q.type === "listSelection" || q.type === "matchingInfo") {
                                      questionRefs.current.set(q.number, el);
                                    }
                                  });
                                }
                              }}
                            >
                              <div className={cn("flex items-start justify-between gap-2", !isSharedQuestionBlock && "mb-2")}>
                                {!isSharedQuestionBlock ? (
                                  <p className="min-w-0 wrap-break-word text-base font-medium leading-relaxed text-foreground">
                                    {question.number}.{" "}
                                    <HighlightableText
                                      text={question.prompt}
                                      userHighlights={getQuestionLocalHighlights(question.id, promptStart, question.prompt.length)}
                                      notesStorageKey={`reading:${test.id}:notes`}
                                      noteScopeKey={`${question.id}:prompt`}
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
                                ) : null}
                                {isMarked && !reviewMode ? (
                                  <Badge variant="secondary" className="shrink-0 rounded-full border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/50 dark:bg-amber-500/20 dark:text-amber-200">
                                    <Bookmark className="size-3.5" />
                                    Marked
                                  </Badge>
                                ) : null}
                                {reviewMode && !isSharedQuestionBlock ? (
                                  <div className="flex shrink-0 items-start gap-1.5">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => openExplanation(question)}
                                      className="h-7 rounded-md px-2 text-[11px]"
                                    >
                                      {expandedExplanations.has(question.id)
                                        ? (t.has("hideExplanation") ? t("hideExplanation") : "Hide explanation")
                                        : (t.has("explain") ? t("explain") : "Explain")}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => jumpToEvidenceFromReview(question.id)}
                                      className="h-7 rounded-md border-border/70 px-2 text-[11px]"
                                    >
                                      {t.has("jumpToEvidence") ? t("jumpToEvidence") : "Jump to evidence"}
                                    </Button>
                                    <span
                                      className={cn(
                                        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold leading-none",
                                        !answered && "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
                                        answered && isCorrect && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
                                        answered && !isCorrect && "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                                      )}
                                    >
                                      {!answered ? (
                                        <CircleDashed className="size-3.5" aria-hidden="true" />
                                      ) : isCorrect ? (
                                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                      ) : (
                                        <XCircle className="size-3.5" aria-hidden="true" />
                                      )}
                                      {!answered ? "Skipped" : isCorrect ? "Correct" : "Incorrect"}
                                    </span>
                                  </div>
                                ) : null}
                              </div>

                                {reviewMode && reviewAnswersVisible && !isSharedQuestionBlock ? (
                                  <div className="mb-3 space-y-1 text-xs">
                                    <p className="test-muted-copy text-muted-foreground">
                                      {(t.has("yourAnswer") ? t("yourAnswer") : "Your answer")}:{" "}
                                      <span className="font-semibold text-foreground">
                                        {formatAnswerForDisplay(value) || (t.has("noAnswer") ? t("noAnswer") : "No answer")}
                                      </span>
                                    </p>
                                    <p className="test-muted-copy text-muted-foreground">
                                      {(t.has("correctAnswer") ? t("correctAnswer") : "Correct answer")}:{" "}
                                      <span className="font-semibold text-emerald-700 dark:text-emerald-200">
                                        {reviewedCorrectAnswer || (t.has("notAvailable") ? t("notAvailable") : "Not available")}
                                      </span>
                                    </p>
                                  </div>
                                ) : null}

                              {question.type === "tfng" ? (
                                <div className="flex flex-wrap gap-4">
                                  {question.options.map((option, optionIndex) => (
                                    <label key={option} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                                      <input
                                        type="radio"
                                        name={question.id}
                                        value={option}
                                        checked={formatAnswerForDisplay(typeof value === "string" ? value : "") === formatAnswerForDisplay(option)}
                                        disabled={reviewMode}
                                        onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                                        className="size-4 accent-blue-600"
                                      />
                                      <HighlightableText
                                        text={formatAnswerForDisplay(option)}
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
                                  {mcqChoices.map((choice, optionIndex) => (
                                    <label key={`${question.id}:mcq:${choice.key}:${optionIndex}`} className="flex cursor-pointer items-start gap-2 text-sm">
                                      <input
                                        type="radio"
                                        name={question.id}
                                        value={choice.key}
                                        checked={resolvedMcqKey === choice.key}
                                        disabled={reviewMode}
                                        onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                                        className="mt-0.5 size-4 accent-blue-600"
                                      />
                                      <span className="wrap-break-word">
                                        <HighlightableText
                                          text={choice.label}
                                          userHighlights={getQuestionLocalHighlights(
                                            question.id,
                                            mcqOptionStarts[optionIndex] ?? 0,
                                            choice.label.length
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

                              {question.type === "listSelection" ? (() => {
                                const parsedOptions = question.listOptions.map((option, optionIndex) => parseOptionChoice(option, optionIndex));
                                const orderedOptionKeys = parsedOptions.map((option) => option.key);
                                const selectedKeys = new Set(
                                  listSelectionQuestions
                                    .map((item) => resolveChoiceKeyFromRawValue(displayedAnswers[item.id], parsedOptions, question.listOptions))
                                    .filter(Boolean)
                                );
                                const maxSelections = Math.max(1, listSelectionQuestions.length);
                                const groupNumbers = listSelectionQuestions.map((item) => item.number);
                                const toggleListSelection = (choiceKey: string) => {
                                  if (reviewMode) return;
                                  const current = new Set(selectedKeys);
                                  if (current.has(choiceKey)) {
                                    current.delete(choiceKey);
                                  } else if (current.size < maxSelections) {
                                    current.add(choiceKey);
                                  } else {
                                    return;
                                  }
                                  const nextKeys = orderedOptionKeys.filter((key) => current.has(key));

                                  setAnswers((prev) => {
                                    const next = {...prev};
                                    listSelectionQuestions.forEach((item, itemIndex) => {
                                      next[item.id] = nextKeys[itemIndex] ?? "";
                                    });
                                    return next;
                                  });

                                  const focusIndex = Math.min(
                                    Math.max(nextKeys.indexOf(choiceKey), 0),
                                    listSelectionQuestions.length - 1
                                  );
                                  const nextActive = listSelectionQuestions[focusIndex]?.number ?? listSelectionQuestions[0]?.number;
                                  if (nextActive) {
                                    setActiveQuestionNumber(nextActive);
                                  }
                                };

                                return (
                                  <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="wrap-break-word text-sm font-medium">
                                        <InlineBoldText text={question.prompt} />
                                      </p>
                                    </div>

                                    <div className="space-y-2">
                                      {parsedOptions.map((choice) => {
                                        const checked = selectedKeys.has(choice.key);
                                        return (
                                          <label
                                            key={`${question.id}-list-option-${choice.key}`}
                                            className="flex min-w-0 items-start gap-2 text-sm"
                                          >
                                            <input
                                              type="checkbox"
                                              name={`list-selection-${groupNumbers[0] ?? question.number}`}
                                              value={choice.key}
                                              checked={checked}
                                              disabled={reviewMode}
                                              onChange={() => toggleListSelection(choice.key)}
                                              onFocus={() => setActiveQuestionNumber(groupNumbers[0] ?? question.number)}
                                              className="mt-0.5"
                                            />
                                            <span className="inline-flex min-w-0 items-center gap-2 wrap-break-word">
                                              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-border/70 bg-muted/35 px-2 text-xs font-semibold text-foreground">
                                                {choice.key}
                                              </span>
                                              <span>
                                                <InlineBoldText text={choice.text || choice.label} />
                                              </span>
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>

                                    {reviewMode ? (
                                      <div className="space-y-2">
                                        {listSelectionQuestions.map((targetQuestion) => {
                                          const targetReviewedQuestion =
                                            reviewQuestionById.get(targetQuestion.id)
                                            ?? reviewQuestionByNumber.get(targetQuestion.number)
                                            ?? targetQuestion;
                                          const targetReviewedCorrectAnswer = formatAnswerForDisplay(targetReviewedQuestion.correctAnswer);
                                          const targetReviewedExplanation = targetReviewedQuestion.explanation?.trim()
                                            ? targetReviewedQuestion.explanation
                                            : (t.has("notAvailable") ? t("notAvailable") : "Not available");

                                          return (
                                            <div
                                              key={`${question.id}-list-review-${targetQuestion.id}`}
                                              className="rounded-lg border border-border/70 bg-muted/20 p-3"
                                            >
                                              <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-xs font-semibold text-muted-foreground">
                                                  Q{targetQuestion.number}
                                                  {reviewAnswersVisible ? (
                                                    <>
                                                      : {(t.has("correctAnswer") ? t("correctAnswer") : "Correct answer")}{" "}
                                                      <span className="text-foreground">{targetReviewedCorrectAnswer || (t.has("notAvailable") ? t("notAvailable") : "Not available")}</span>
                                                    </>
                                                  ) : null}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(event) => {
                                                      event.stopPropagation();
                                                      openExplanation(targetQuestion);
                                                    }}
                                                    className="h-6 rounded-md px-2 text-[10px]"
                                                  >
                                                    {expandedExplanations.has(targetQuestion.id)
                                                      ? (t.has("hideExplanation") ? t("hideExplanation") : "Hide explanation")
                                                      : (t.has("explain") ? t("explain") : "Explain")}
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(event) => {
                                                      event.stopPropagation();
                                                      jumpToEvidenceFromReview(targetQuestion.id);
                                                    }}
                                                    className="h-6 rounded-md border-border/70 px-2 text-[10px]"
                                                  >
                                                    {t.has("jumpToEvidence") ? t("jumpToEvidence") : "Jump to evidence"}
                                                  </Button>
                                                </div>
                                              </div>
                                              {expandedExplanations.has(targetQuestion.id) ? (
                                                <div className="mt-2 rounded-md border border-border/70 bg-background/70 p-2 text-xs text-foreground/90 dark:bg-background/25">
                                                  {targetReviewedExplanation}
                                                </div>
                                              ) : null}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })() : null}

                              {isMatchingInfoSharedBlock ? (
                                <div className="test-panel overflow-x-auto rounded-xl border border-border/80 bg-card/85 shadow-sm dark:bg-card/60">
                                  <table className="min-w-full border-collapse text-[15px] sm:text-base">
                                    <thead>
                                      <tr className="bg-muted/50 dark:bg-muted/25">
                                        <th className="min-w-96 border-b border-r border-border/80 px-3 py-4 text-left font-semibold text-foreground" aria-label="Question" />
                                        {matchingInfoParsedOptions.map((option) => (
                                          <th
                                            key={`${question.id}-matching-info-head-${option.value}`}
                                            className="w-12 border-b border-r border-border/80 px-2 py-4 text-center text-base font-bold text-foreground last:border-r-0 sm:w-14"
                                          >
                                            {option.key}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {matchingInfoGroupQuestions.map((targetQuestion) => {
                                        const targetValue = displayedAnswers[targetQuestion.id];
                                        const selectedKey = resolveChoiceKeyFromRawValue(
                                          typeof targetValue === "string" ? targetValue : "",
                                          matchingInfoParsedOptions,
                                          matchingInfoRawOptions
                                        );
                                        const targetActive = activeQuestionNumber === targetQuestion.number;
                                        const targetMarked = marked.has(targetQuestion.id);
                                        const targetResult =
                                          gradingByNumber.get(targetQuestion.number) ?? grading.byQuestion[targetQuestion.id];
                                        const targetAnswered = isAnswered(targetValue);
                                        const targetReviewedQuestion =
                                          reviewQuestionById.get(targetQuestion.id)
                                          ?? reviewQuestionByNumber.get(targetQuestion.number)
                                          ?? targetQuestion;
                                        const targetReviewedCorrectAnswer = formatAnswerForDisplay(targetReviewedQuestion.correctAnswer);
                                        const targetReviewedExplanation = targetReviewedQuestion.explanation?.trim()
                                          ? targetReviewedQuestion.explanation
                                          : (t.has("notAvailable") ? t("notAvailable") : "Not available");

                                        return (
                                          <tr
                                            key={`${question.id}-matching-info-row-${targetQuestion.id}`}
                                            className={cn(
                                              "align-top transition-colors",
                                              targetActive && "bg-blue-50/60 dark:bg-blue-950/20",
                                              targetMarked && "bg-amber-50/45 dark:bg-amber-500/10"
                                            )}
                                            onClick={() => setActiveQuestionNumber(targetQuestion.number)}
                                          >
                                            <td className="border-b border-r border-border/80 bg-background/55 px-3 py-3 leading-relaxed text-foreground dark:bg-background/20">
                                              <div className="flex min-w-0 items-start gap-3">
                                                <span className={cn(
                                                  "inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border px-2 text-base font-bold leading-none shadow-sm",
                                                  targetActive
                                                    ? "border-blue-400 bg-blue-500 text-white"
                                                    : "border-border bg-background text-foreground dark:bg-card/80"
                                                )}>
                                                  {targetQuestion.number}
                                                </span>
                                                <div className="min-w-0 flex-1 space-y-2">
                                                  <div className="wrap-break-word">
                                                    <HighlightableText
                                                      text={targetQuestion.prompt}
                                                      userHighlights={getQuestionLocalHighlights(targetQuestion.id, 0, targetQuestion.prompt.length)}
                                                      notesStorageKey={`reading:${test.id}:notes`}
                                                      noteScopeKey={`${targetQuestion.id}:prompt`}
                                                      markLabel={t.has("markText") ? t("markText") : "Mark"}
                                                      unmarkLabel={t.has("unmarkText") ? t("unmarkText") : "Unmark"}
                                                      onToggle={({ start, end, color, action }) =>
                                                        toggleHighlight({
                                                          scope: "question",
                                                          questionId: targetQuestion.id,
                                                          start,
                                                          end,
                                                          color,
                                                          action,
                                                        })
                                                      }
                                                    />
                                                  </div>
                                                  {reviewMode && reviewAnswersVisible ? (
                                                    <div className="space-y-1 text-xs text-muted-foreground">
                                                      <p>
                                                        {(t.has("yourAnswer") ? t("yourAnswer") : "Your answer")}:{" "}
                                                        <span className="font-medium text-foreground">
                                                          {formatAnswerForDisplay(targetValue) || (t.has("noAnswer") ? t("noAnswer") : "No answer")}
                                                        </span>
                                                      </p>
                                                      <p>
                                                        {(t.has("correctAnswer") ? t("correctAnswer") : "Correct answer")}:{" "}
                                                        <span className="font-medium text-emerald-700 dark:text-emerald-200">
                                                          {targetReviewedCorrectAnswer || (t.has("notAvailable") ? t("notAvailable") : "Not available")}
                                                        </span>
                                                      </p>
                                                    </div>
                                                  ) : null}
                                                  {expandedExplanations.has(targetQuestion.id) ? (
                                                    <div className="rounded-md border border-border/70 bg-muted/25 p-2 text-xs text-foreground/90">
                                                      {targetReviewedExplanation}
                                                    </div>
                                                  ) : null}
                                                </div>
                                                {targetMarked && !reviewMode ? (
                                                  <Bookmark className="mt-1 size-4 shrink-0 text-amber-500" aria-label="Marked" />
                                                ) : null}
                                                {reviewMode ? (
                                                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={(event) => {
                                                        event.stopPropagation();
                                                        openExplanation(targetQuestion);
                                                      }}
                                                      className="h-6 rounded-md px-2 text-[10px]"
                                                    >
                                                      {expandedExplanations.has(targetQuestion.id)
                                                        ? (t.has("hideExplanation") ? t("hideExplanation") : "Hide explanation")
                                                        : (t.has("explain") ? t("explain") : "Explain")}
                                                    </Button>
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={(event) => {
                                                        event.stopPropagation();
                                                        jumpToEvidenceFromReview(targetQuestion.id);
                                                      }}
                                                      className="h-6 rounded-md border-border/70 px-2 text-[10px]"
                                                    >
                                                      {t.has("jumpToEvidence") ? t("jumpToEvidence") : "Jump to evidence"}
                                                    </Button>
                                                    <span
                                                      className={cn(
                                                        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold leading-none",
                                                        !targetAnswered && "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
                                                        targetAnswered && targetResult?.isCorrect && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
                                                        targetAnswered && !targetResult?.isCorrect && "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                                                      )}
                                                    >
                                                      {!targetAnswered ? (
                                                        <CircleDashed className="size-3.5" aria-hidden="true" />
                                                      ) : targetResult?.isCorrect ? (
                                                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                                      ) : (
                                                        <XCircle className="size-3.5" aria-hidden="true" />
                                                      )}
                                                      {!targetAnswered ? "Skipped" : targetResult?.isCorrect ? "Correct" : "Incorrect"}
                                                    </span>
                                                  </div>
                                                ) : null}
                                              </div>
                                            </td>
                                            {matchingInfoParsedOptions.map((option) => (
                                              <td
                                                key={`${targetQuestion.id}-matching-info-cell-${option.value}`}
                                                className={cn(
                                                  "border-b border-r border-border/80 bg-background/55 px-2 py-3 text-center align-middle last:border-r-0 dark:bg-background/20",
                                                  !reviewMode && "cursor-pointer hover:bg-blue-500/10"
                                                )}
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  setActiveQuestionNumber(targetQuestion.number);
                                                  if (!reviewMode) {
                                                    assignMatchingInfo(targetQuestion.id, option.value);
                                                  }
                                                }}
                                              >
                                                <input
                                                  type="radio"
                                                  name={targetQuestion.id}
                                                  value={option.value}
                                                  checked={selectedKey === option.key}
                                                  disabled={reviewMode}
                                                  onChange={() => assignMatchingInfo(targetQuestion.id, option.value)}
                                                  onFocus={() => setActiveQuestionNumber(targetQuestion.number)}
                                                  aria-label={`Question ${targetQuestion.number}, ${option.key}`}
                                                  className="size-5 accent-blue-600"
                                                />
                                              </td>
                                            ))}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
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

                              {question.type === "tableCompletion" ? (
                                <div className="space-y-3">
                                  <div className="overflow-x-auto rounded-lg border border-border/70 bg-background/70 dark:bg-muted/20">
                                    <table className="min-w-full border-collapse text-sm">
                                      <thead>
                                        <tr className="bg-muted/40">
                                          {question.tableColumns.map((column, columnIndex) => (
                                            <th key={`${question.id}-th-${columnIndex}`} className="border border-border/60 px-3 py-2 text-left font-semibold text-foreground/90">
                                              <InlineBoldText text={column} />
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {question.tableRows.map((row, rowIndex) => (
                                          <tr key={`${question.id}-row-${rowIndex}`} className="align-top">
                                            {row.map((cell, cellIndex) => (
                                              <td key={`${question.id}-cell-${rowIndex}-${cellIndex}`} className="border border-border/60 px-3 py-2 text-foreground/90">
                                                <div className="flex flex-wrap items-baseline gap-1.5">
                                                  {cell.split(/(\{\d+\})/g).map((part, partIndex) => {
                                                    const tokenMatch = part.match(/^\{(\d+)\}$/);
                                                    if (!tokenMatch) {
                                                      return part ? (
                                                        <InlineBoldText
                                                          key={`${question.id}-cell-text-${rowIndex}-${cellIndex}-${partIndex}`}
                                                          text={normalizeTemplateDisplayText(part)}
                                                        />
                                                      ) : null;
                                                    }

                                                    const targetNumber = Number(tokenMatch[1]);
                                                    const targetQuestion = questionsByNumber.get(targetNumber);
                                                    if (!targetQuestion) {
                                                      return (
                                                        <span key={`${question.id}-cell-missing-${rowIndex}-${cellIndex}-${partIndex}`} className="text-xs text-muted-foreground">
                                                          {part}
                                                        </span>
                                                      );
                                                    }

                                                    const targetValue = displayedAnswers[targetQuestion.id];
                                                    const isActiveBlank = activeQuestionNumber === targetNumber;
                                                    const targetReviewedQuestion =
                                                      reviewQuestionById.get(targetQuestion.id)
                                                      ?? reviewQuestionByNumber.get(targetQuestion.number)
                                                      ?? targetQuestion;
                                                    const targetReviewedCorrectAnswer = formatAnswerForDisplay(targetReviewedQuestion.correctAnswer);
                                                    const targetReviewedExplanation = targetReviewedQuestion.explanation?.trim()
                                                      ? targetReviewedQuestion.explanation
                                                      : (t.has("notAvailable") ? t("notAvailable") : "Not available");

                                                    return (
                                                      <span key={`${question.id}-cell-input-${rowIndex}-${cellIndex}-${partIndex}`} className="inline-flex flex-col items-start gap-1.5">
                                                        <span className="inline-flex items-baseline gap-1">
                                                          <span
                                                            className={cn(
                                                              "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                                                              isActiveBlank ? "bg-blue-600" : "bg-muted-foreground/50"
                                                            )}
                                                          >
                                                            {targetNumber}
                                                          </span>
                                                          <Input
                                                            aria-label={`Question ${targetNumber}`}
                                                            value={typeof targetValue === "string" ? targetValue : ""}
                                                            disabled={reviewMode}
                                                            onPointerDown={(event) => {
                                                              event.stopPropagation();
                                                            }}
                                                            onClick={(event) => {
                                                              event.stopPropagation();
                                                            }}
                                                            onFocus={() => {
                                                              if (activeQuestionNumber !== targetNumber) {
                                                                setActiveQuestionNumber(targetNumber);
                                                              }
                                                            }}
                                                            onChange={(event) => setAnswers((prev) => ({...prev, [targetQuestion.id]: event.target.value}))}
                                                            placeholder="..."
                                                            className={cn(
                                                              "test-input-surface h-8 w-28 rounded-md px-2 text-sm sm:w-36",
                                                              isActiveBlank
                                                                ? "border-blue-400 bg-blue-50/50 ring-1 ring-blue-400/30 dark:bg-blue-900/20"
                                                                : "border-blue-300/40 bg-background/80 dark:bg-muted/30"
                                                            )}
                                                          />
                                                        </span>
                                                        {reviewMode ? (
                                                          <span className="pl-6">
                                                            {reviewAnswersVisible ? (
                                                              <span className="test-muted-copy mb-1 block text-xs text-muted-foreground">
                                                                <strong className="font-bold text-foreground">Answer:</strong>{" "}
                                                                <strong className="font-bold text-emerald-700 dark:text-emerald-200">
                                                                  {targetReviewedCorrectAnswer || (t.has("notAvailable") ? t("notAvailable") : "Not available")}
                                                                </strong>
                                                              </span>
                                                            ) : null}
                                                            <span className="flex flex-wrap items-center gap-1.5">
                                                              <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(event) => {
                                                                  event.stopPropagation();
                                                                  openExplanation(targetQuestion);
                                                                }}
                                                                className="h-6 rounded-md px-2 text-[10px]"
                                                              >
                                                                {expandedExplanations.has(targetQuestion.id)
                                                                  ? (t.has("hideExplanation") ? t("hideExplanation") : "Hide explanation")
                                                                  : (t.has("explain") ? t("explain") : "Explain")}
                                                              </Button>
                                                              <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(event) => {
                                                                  event.stopPropagation();
                                                                  jumpToEvidenceFromReview(targetQuestion.id);
                                                                }}
                                                                className="h-6 rounded-md border-border/70 px-2 text-[10px]"
                                                              >
                                                                {t.has("jumpToEvidence") ? t("jumpToEvidence") : "Jump to evidence"}
                                                              </Button>
                                                            </span>
                                                            {expandedExplanations.has(targetQuestion.id) ? (
                                                              <span className="test-soft-surface mt-1 block rounded-md border border-border/80 bg-muted/25 p-2 text-xs">
                                                                <span className="block text-foreground/90">{targetReviewedExplanation}</span>
                                                              </span>
                                                            ) : null}
                                                          </span>
                                                        ) : null}
                                                      </span>
                                                    );
                                                  })}
                                                </div>
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : null}

                              {question.type === "summaryCompletion" ? (() => {
                                const parts = question.summaryText.split(/(\{\d+\})/g);
                                let summaryTextOffset = 0;
                                const partsWithOffsets = parts.map((part) => {
                                  const start = summaryTextOffset;
                                  summaryTextOffset += part.length;
                                  return {part, start};
                                });
                                const summaryHighlightKey = `summary:${question.id}`;
                                const summaryQuestions = visibleGroupQuestions.filter(
                                  (item): item is Extract<ReadingQuestion, {type: "summaryCompletion"}> => item.type === "summaryCompletion"
                                );
                                const wordBankOptions = question.wordBank ?? [];
                                const selectedSummaryValues = new Set(
                                  summaryQuestions
                                    .map((item) => (typeof displayedAnswers[item.id] === "string" ? stripInlineBoldMarkup(String(displayedAnswers[item.id])) : ""))
                                    .filter(Boolean)
                                );
                                const fillSummaryBlank = (targetQuestion: ReadingQuestion, option: string) => {
                                  if (reviewMode || targetQuestion.type !== "summaryCompletion") return;
                                  setActiveQuestionNumber(targetQuestion.number);
                                  setAnswers((prev) => ({...prev, [targetQuestion.id]: option}));
                                };
                                const fillActiveOrFirstEmptySummaryBlank = (option: string) => {
                                  if (reviewMode) return;
                                  const activeSummaryQuestion = summaryQuestions.find((item) => item.number === activeQuestionNumber);
                                  const firstEmptyQuestion = summaryQuestions.find((item) => !isAnswered(displayedAnswers[item.id]));
                                  const targetQuestion = activeSummaryQuestion ?? firstEmptyQuestion ?? summaryQuestions[0];
                                  if (!targetQuestion) return;
                                  fillSummaryBlank(targetQuestion, option);
                                };
                                return (
                                  <div className="space-y-4">
                                    {wordBankOptions.length ? (
                                      <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/90 via-background to-cyan-50/70 p-3 shadow-sm dark:border-blue-500/25 dark:from-blue-950/25 dark:via-background/50 dark:to-cyan-950/20">
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                          <p className="text-xs font-semibold tracking-[0.14em] text-blue-700 uppercase dark:text-blue-200">
                                            {t.has("wordBank") ? t("wordBank") : "Word bank"}
                                          </p>
                                          <p className="text-[11px] text-muted-foreground">
                                            {t.has("wordBankHint") ? t("wordBankHint") : "Drag an option into a blank."}
                                          </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {wordBankOptions.map((option, optionIndex) => {
                                            const displayOption = option.trim();
                                            const answerOption = stripInlineBoldMarkup(displayOption);
                                            const isUsed = selectedSummaryValues.has(answerOption);
                                            return (
                                              <button
                                                key={`${question.id}-word-bank-${optionIndex}-${displayOption}`}
                                                type="button"
                                                draggable={!reviewMode}
                                                disabled={reviewMode}
                                                onClick={() => fillActiveOrFirstEmptySummaryBlank(answerOption)}
                                                onDragStart={(event) => {
                                                  event.dataTransfer.effectAllowed = "copy";
                                                  event.dataTransfer.setData(SUMMARY_WORD_BANK_DND_MIME, answerOption);
                                                  event.dataTransfer.setData("text/plain", answerOption);
                                                }}
                                                className={cn(
                                                  "rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition-all",
                                                  "border-blue-200 bg-white text-blue-950 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md",
                                                  "dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100",
                                                  isUsed && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
                                                  reviewMode && "cursor-default opacity-80 hover:translate-y-0 hover:shadow-sm"
                                                )}
                                              >
                                                <InlineBoldText text={displayOption} />
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ) : null}
                                    <div className="test-soft-surface rounded-lg border border-border/60 bg-muted/20 p-4">
                                      <div className="select-text whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                                      {partsWithOffsets.map(({part, start: partStart}, partIndex) => {
                                        const match = part.match(/^\{(\d+)\}$/);
                                        if (match) {
                                          const num = Number(match[1]);
                                          const targetQuestion = questionsByNumber.get(num);
                                          if (targetQuestion) {
                                            const questionValue = displayedAnswers[targetQuestion.id];
                                            const isThisQuestion = num === activeQuestionNumber;
                                            const targetReviewedQuestion =
                                              reviewQuestionById.get(targetQuestion.id)
                                              ?? reviewQuestionByNumber.get(targetQuestion.number)
                                              ?? targetQuestion;
                                            const targetReviewedCorrectAnswer = formatAnswerForDisplay(targetReviewedQuestion.correctAnswer);
                                            const targetReviewedExplanation = targetReviewedQuestion.explanation?.trim()
                                              ? targetReviewedQuestion.explanation
                                              : (t.has("notAvailable") ? t("notAvailable") : "Not available");

                                            return (
                                              <span key={partIndex} className="inline-flex select-none items-baseline gap-1 mx-0.5">
                                                <span 
                                                  className={cn(
                                                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white transition-colors",
                                                    isThisQuestion ? "bg-blue-600" : "bg-muted-foreground/40"
                                                  )} 
                                                  style={{ verticalAlign: "baseline", position: "relative", top: "2px" }}
                                                >
                                                  {num}
                                                </span>
                                                <Input
                                                  aria-label={`Question ${num}`}
                                                  value={typeof questionValue === "string" ? questionValue : ""}
                                                  disabled={reviewMode}
                                                  onPointerDown={(event) => {
                                                    event.stopPropagation();
                                                  }}
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                  }}
                                                  onFocus={() => {
                                                    if (activeQuestionNumber !== num) {
                                                      setActiveQuestionNumber(num);
                                                    }
                                                  }}
                                                  onDragOver={(event) => {
                                                    if (reviewMode || !wordBankOptions.length) return;
                                                    event.preventDefault();
                                                    event.dataTransfer.dropEffect = "copy";
                                                  }}
                                                  onDrop={(event) => {
                                                    if (reviewMode || !wordBankOptions.length) return;
                                                    const dropped =
                                                      event.dataTransfer.getData(SUMMARY_WORD_BANK_DND_MIME)
                                                      || event.dataTransfer.getData("text/plain");
                                                    const normalizedDropped = dropped.trim();
                                                    const validAnswers = wordBankOptions.map((option) => stripInlineBoldMarkup(option));
                                                    if (!normalizedDropped || !validAnswers.includes(normalizedDropped)) return;
                                                    event.preventDefault();
                                                    fillSummaryBlank(targetQuestion, normalizedDropped);
                                                  }}
                                                  onChange={(e) => setAnswers((prev) => ({ ...prev, [targetQuestion.id]: e.target.value }))}
                                                  placeholder="………"
                                                  className={cn(
                                                    "test-input-surface inline-block h-7 w-28 rounded-md px-2 text-sm transition-all sm:w-36",
                                                    isThisQuestion 
                                                      ? "border-blue-400 bg-blue-50/50 ring-1 ring-blue-400/30 dark:bg-blue-900/20" 
                                                      : "border-blue-300/40 bg-background/70 placeholder:text-muted-foreground/30 dark:bg-muted/30"
                                                  )}
                                                  style={{ verticalAlign: "baseline" }}
                                                />
                                                {reviewMode && reviewAnswersVisible ? (
                                                  <span className="ml-1 inline-flex flex-col rounded-md border border-border/70 bg-background/65 px-2 py-1 text-xs text-muted-foreground">
                                                    <span>
                                                      <strong className="font-bold text-foreground">
                                                        {(t.has("yourAnswer") ? t("yourAnswer") : "Your answer")}:
                                                      </strong>{" "}
                                                      <strong className="font-bold text-foreground">
                                                        {formatAnswerForDisplay(questionValue) || (t.has("noAnswer") ? t("noAnswer") : "No answer")}
                                                      </strong>
                                                    </span>
                                                    <span>
                                                      <strong className="font-bold text-foreground">
                                                        {(t.has("correctAnswer") ? t("correctAnswer") : "Correct answer")}:
                                                      </strong>{" "}
                                                      <strong className="font-bold text-emerald-700 dark:text-emerald-200">
                                                        {targetReviewedCorrectAnswer || (t.has("notAvailable") ? t("notAvailable") : "Not available")}
                                                      </strong>
                                                    </span>
                                                  </span>
                                                ) : null}
                                                {reviewMode ? (
                                                  <span className="ml-1 inline-flex items-center gap-1">
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={(event) => {
                                                        event.stopPropagation();
                                                        openExplanation(targetQuestion);
                                                      }}
                                                      className="h-6 rounded-md px-2 text-[10px]"
                                                    >
                                                      {expandedExplanations.has(targetQuestion.id)
                                                        ? (t.has("hideExplanation") ? t("hideExplanation") : "Hide explanation")
                                                        : (t.has("explain") ? t("explain") : "Explain")}
                                                    </Button>
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={(event) => {
                                                        event.stopPropagation();
                                                        jumpToEvidenceFromReview(targetQuestion.id);
                                                      }}
                                                      className="h-6 rounded-md border-border/70 px-2 text-[10px]"
                                                    >
                                                      {t.has("jumpToEvidence") ? t("jumpToEvidence") : "Jump to evidence"}
                                                    </Button>
                                                  </span>
                                                ) : null}
                                                {reviewMode && expandedExplanations.has(targetQuestion.id) ? (
                                                  <span className="ml-1 inline-block rounded-md border border-border/80 bg-muted/25 px-2 py-1 text-[10px] text-foreground/90">
                                                    <span className="block">{targetReviewedExplanation}</span>
                                                  </span>
                                                ) : null}
                                              </span>
                                            );
                                          }
                                        }
                                        return part ? (
                                          <HighlightableText
                                            key={partIndex}
                                            text={normalizeTemplateDisplayText(part)}
                                            enableMarkdownBold
                                            userHighlights={getQuestionLocalHighlights(summaryHighlightKey, partStart, part.length)}
                                            notesStorageKey={`reading:${test.id}:notes`}
                                            noteScopeKey={`question:${question.id}:summary-part:${partIndex}`}
                                            interactive={!reviewMode}
                                            markLabel={t.has("markText") ? t("markText") : "Mark"}
                                            unmarkLabel={t.has("unmarkText") ? t("unmarkText") : "Unmark"}
                                            onToggle={({ start, end, color, action }) =>
                                              toggleHighlight({
                                                scope: "question",
                                                questionId: summaryHighlightKey,
                                                start: partStart + start,
                                                end: partStart + end,
                                                color,
                                                action,
                                              })
                                            }
                                          />
                                        ) : null;
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })() : null}


                              {reviewMode && !isSharedQuestionBlock ? (
                                <div className="mt-3 space-y-2">
                                  {expandedExplanations.has(question.id) ? (
                                    <div className="test-soft-surface rounded-md border border-border/80 bg-muted/25 p-3 text-sm">
                                      <p className="text-foreground/90">{reviewedExplanation}</p>
                                      {reviewAnswersVisible ? (
                                        <p className="test-muted-copy mt-2 text-xs text-muted-foreground">
                                          {(t.has("correctAnswer") ? t("correctAnswer") : "Correct answer")}:{" "}
                                          {reviewedCorrectAnswer || (t.has("notAvailable") ? t("notAvailable") : "Not available")}
                                        </p>
                                      ) : null}
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
        </div>
      </main>

      <div className="border-t border-border/75 bg-background/95 px-3 backdrop-blur sm:px-4 lg:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 pt-1.5">
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

          {!reviewMode ? (
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
          ) : null}

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

        <div className="mt-1.5 min-w-0 overflow-x-auto [scrollbar-width:thin]">
          <div className="inline-grid min-w-max grid-flow-col auto-cols-[minmax(220px,1fr)] gap-1.5 pr-1 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-3 lg:min-w-0 lg:w-full">
            {passagePaletteSections.map((section) => {
              const isActivePassage = section.passageId === activePassageId;
              return (
                <div
                  key={`palette-${section.passageId}`}
                  className={cn(
                    "rounded-xl border p-1.5 transition-colors",
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
                  {isActivePassage ? (
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:thin]">
                        <div className="flex w-max gap-1 pr-1">
                          {section.numbers.map((number) => {
                            const question = questionsByNumber.get(number);
                            const answered = question ? isAnswered(displayedAnswers[question.id]) : false;
                            const isMarked = question ? marked.has(question.id) : false;
                            const isCurrent = number === activeQuestionNumber;
                            return (
                              <Button
                                key={`${activePassageId}-${number}`}
                                type="button"
                                variant="outline"
                                aria-label={t("goToQuestion", { number })}
                                className={cn(
                                  "relative h-5 min-w-5 rounded-md border px-1 text-[10px] font-semibold shadow-none",
                                  isCurrent && "border-blue-700 bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-300/70 hover:bg-blue-600 dark:border-cyan-300 dark:bg-blue-500 dark:ring-cyan-300/60 dark:shadow-cyan-500/20",
                                  !isCurrent && answered && "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/45 dark:bg-emerald-500/20 dark:text-emerald-200",
                                  !isCurrent && !answered && "border-dashed border-slate-300 bg-white/70 text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-900/45 dark:text-slate-300 dark:hover:border-blue-400/70 dark:hover:text-blue-200",
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
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                        {section.answered}/{section.numbers.length}
                      </span>
                    </div>
                  ) : null}
                  {!isActivePassage ? (
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                      onClick={() => handlePassageChange(section.passageId)}
                    >
                      <span className="text-xs font-semibold sm:text-sm">
                        {t("passageLabel", { index: section.index })}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {section.answered}/{section.numbers.length}
                      </span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent side={isCompact ? "bottom" : "right"} className="p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle>{t("questionPalette")}</SheetTitle>
            <SheetDescription>{t("questionPaletteHint")}</SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-9rem)] px-6 pb-6 md:h-[calc(100vh-8rem)]">
            <div className="py-4">
              <div className="grid grid-cols-5 gap-2">
                {(activePassagePaletteSection?.numbers ?? []).map((num) => {
                  const q = questionsByNumber.get(num);
                  const answered = q ? isAnswered(displayedAnswers[q.id]) : false;
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
                        isCurrent && "border-blue-700 bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-300/70 hover:bg-blue-600 dark:border-cyan-300 dark:bg-blue-500 dark:ring-cyan-300/60 dark:shadow-cyan-500/20",
                        !isCurrent && answered && "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/45 dark:bg-emerald-500/20 dark:text-emerald-200",
                        !isCurrent && !answered && "border-dashed border-slate-300 bg-white/70 text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-900/45 dark:text-slate-300 dark:hover:border-blue-400/70 dark:hover:text-blue-200",
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
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {reviewMode ? (
        <div className="fixed bottom-16 right-4 z-50 sm:bottom-20 sm:right-5">
          <Button asChild className="h-12 rounded-2xl bg-blue-600 px-6 text-base font-semibold text-white shadow-lg hover:bg-blue-600/90">
            <Link
              href={
                isMarathonContext
                  ? (returnToParam.startsWith("/") ? returnToParam : `/${locale}/marathons/${marathonIdParam}/days/${marathonDayNumber}`)
                  : `/${locale}/reading/${test.id}/result?attempt=${backendAttemptId ?? attemptId}${returnQuerySuffix}`
              }
            >
              {isMarathonContext ? (returnLabelParam || "Back to marathon day") : "Analyze"}
            </Link>
          </Button>
        </div>
      ) : null}

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

      {restartOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <h3 className="text-lg font-semibold">{t.has("restartTest") ? t("restartTest") : "Restart test"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.has("restartConfirm")
                ? t("restartConfirm")
                : "Restart this test? Your current answers will be cleared."}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRestartOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={confirmRestartTest}>
                {t.has("restartTest") ? t("restartTest") : "Restart test"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      <LoadingModal 
        open={isSubmittingResult} 
        message={t.has("submittingTest") ? t("submittingTest") : "Submitting your test and calculating results..."} 
      />

      <ConfirmModal
        open={leaveConfirm.open}
        title={leaveConfirm.title}
        description={leaveConfirm.description}
        confirmText={leaveConfirm.confirmText}
        cancelText={leaveConfirm.cancelText}
        confirmVariant="destructive"
        onConfirm={leaveConfirm.onConfirm}
        onCancel={leaveConfirm.onCancel}
      />
    </section>
  );
}
