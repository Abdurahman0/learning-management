"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
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
import { LoadingModal } from "@/components/ui/loading-modal";

import {
  type ListeningFullTest,
  type ListeningSectionId,
  getListeningTestById,
  saveRuntimeListeningTest,
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
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { createAttemptId, loadAttemptProgress, loadLatestAttemptId, saveAttemptProgress, saveAttemptResult, type AttemptMode } from "@/lib/test-attempt-storage";
import { getListeningAnswerMeta } from "@/data/listening-answer-keys";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { flattenListeningQuestions } from "@/lib/listening-questions";
import { Highlightable } from "@/components/test/Highlightable";
import { FormattedInstructionText } from "@/components/test/FormattedInstructionText";
import { InlineBoldText } from "@/components/test/InlineBoldText";
import { useTestAppearance } from "@/lib/test-appearance";
import { TestOptionsSheet } from "@/components/test/TestOptionsSheet";
import { ListeningQuestionAnalysisPanel } from "./result/_components/ListeningQuestionAnalysisPanel";
import { adaptListeningBackendReview, type AdaptedListeningBackendReview, type ListeningBackendAnswerMeta } from "./result/_components/backendReviewAdapters";
import { ListeningTranscriptReviewPanel, type ListeningReviewSection } from "./result/_components/ListeningTranscriptReviewPanel";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useLeaveConfirm } from "@/lib/use-leave-confirm";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { studentAttemptsService } from "@/src/services/student/attempts.service";
import { studentTestsService } from "@/src/services/student/tests.service";
import { StudentApiError } from "@/src/services/student/types";
import type { StudentAttemptDetail, StudentAttemptQuestion, StudentAttemptQuestionGroup, StudentAttemptListeningPart, StudentTestRecord } from "@/src/services/student/types";

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
      return block.rows.flatMap((row) => row.questionNumbers);
    case "mcqGroup":
      return block.questions.map((question) => question.questionNumber);
    case "matching":
      return block.items.map((item) => item.questionNumber);
    case "listSelection":
      return block.questionNumbers;
    case "diagramLabeling":
      return block.items.map((item) => item.questionNumber);
    case "summaryCompletion":
      return block.lines.map((line) => line.questionNumber);
    default:
      return [];
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function resolvePlayableAudioUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return trimmed;
  const configuredApiOrigin = (() => {
    const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
    if (!value) return "";
    try {
      return new URL(value).origin;
    } catch {
      return "";
    }
  })();

  const toProxyPath = (studentApiPath: string) => {
    const suffix = studentApiPath.replace(/^\/api\/v1\/student\/?/, "");
    return `/api/student-proxy/${suffix}`;
  };

  if (trimmed.startsWith("/api/v1/student/")) {
    return toProxyPath(trimmed);
  }

  if (trimmed.startsWith("/media/")) {
    const params = new URLSearchParams();
    if (configuredApiOrigin) {
      params.set("__origin", configuredApiOrigin);
    }
    const query = params.toString();
    return `/api/student-media-proxy${trimmed}${query ? `?${query}` : ""}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith("/api/v1/student/")) {
        return `/api/student-proxy/${parsed.pathname.replace(/^\/api\/v1\/student\/?/, "")}${parsed.search}`;
      }
      if (parsed.pathname.startsWith("/media/")) {
        const params = new URLSearchParams(parsed.search);
        params.set("__origin", parsed.origin);
        return `/api/student-media-proxy${parsed.pathname}?${params.toString()}`;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function extractQuestionPrompt(question: StudentAttemptQuestion) {
  const options = asRecord(question.options_json);
  return (
    toStringSafe(options?.statement).trim()
    || toStringSafe(options?.sentence_stem).trim()
    || toStringSafe(question.question_text).trim()
    || `Question ${question.question_number}`
  );
}

type ListeningSubmitQuestionMeta = {
  questionId: string;
  candidateIds: string[];
  questionType: string;
};

function resolveSubmitQuestionId(question: StudentAttemptQuestion) {
  const attemptQuestionId = toStringSafe(question.attempt_question_id).trim();
  const id = toStringSafe(question.id).trim();
  const canonicalId = toStringSafe(question.question_id).trim();

  // ALWAYS prioritize attempt_question_id - it's specific to THIS attempt, not a generic question
  if (attemptQuestionId) return attemptQuestionId;
  if (id && id !== canonicalId) return id;
  return canonicalId || "";
}

function collectListeningSubmitMetaByNumber(attempt: StudentAttemptDetail) {
  const byNumber = new Map<number, ListeningSubmitQuestionMeta>();

  for (const part of attempt.listening_parts) {
    for (const group of part.question_groups) {
      for (const question of group.questions) {
        const number = toNumberSafe(question.question_number, 0);
        if (number <= 0) continue;

        // ALWAYS prioritize attempt_question_id first - it's specific to this attempt
        const candidates = [
          toStringSafe(question.attempt_question_id).trim(),  // PRIMARY: Attempt-scoped ID
          toStringSafe(question.id).trim(),                     // FALLBACK: Generic ID
          toStringSafe(question.question_id).trim(),           // FALLBACK: Canonical question ID
          ...asArray<string>(question.candidate_question_ids)
            .map((value) => toStringSafe(value).trim())
            .filter(Boolean),
        ]
          .filter((value) => value && UUID_PATTERN.test(value))  // Only valid UUIDs
          .filter((value, index, source) => source.indexOf(value) === index); // Dedup

        if (!candidates.length) continue;

        byNumber.set(number, {
          questionId: candidates[0],
          candidateIds: candidates,
          questionType: toStringSafe(question.question_type).trim().toUpperCase(),
        });
      }
    }
  }

  return byNumber;
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

function extractOptionTexts(value: unknown) {
  return asArray<unknown>(value)
    .map((item) => {
      if (typeof item === "string") return item.trim();
      const row = asRecord(item);
      const text = toStringSafe(row?.text).trim();
      const label = toStringSafe(row?.label).trim();
      const key = toStringSafe(row?.key).trim();
      if (key && text) {
        if (text.toUpperCase() === key.toUpperCase()) {
          return key;
        }
        const cleanedText = text
          .replace(new RegExp(`^${key}[\\)\\].:\\-\\s]+`, "i"), "")
          .trim();
        if (!cleanedText || cleanedText.toUpperCase() === key.toUpperCase()) {
          return key;
        }
        return `${key}. ${cleanedText}`;
      }
      return text || label || key;
    })
    .filter(Boolean);
}

function parseTemplateFields(templateText: string, questions: StudentAttemptQuestion[]) {
  const fallbackByNumber = new Map(
    questions.map((q) => [Number(q.question_number), toStringSafe(q.question_text).trim() || `Question ${q.question_number}`])
  );

  const lines = templateText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const fields: Array<{questionNumber: number; label: string; placeholder?: string}> = [];

  for (const line of lines) {
    const match = line.match(/\{(\d+)\}/);
    if (!match) continue;
    const questionNumber = Number(match[1]);
    if (!Number.isFinite(questionNumber) || questionNumber <= 0) continue;

    const cleanedLabel = line
      .replace(/\{(\d+)\}/g, "")
      .replace(/[:\-–]\s*$/, "")
      .trim();

    fields.push({
      questionNumber,
      label: cleanedLabel || fallbackByNumber.get(questionNumber) || `Question ${questionNumber}`
    });
  }

  if (fields.length) return fields;

  return questions
    .slice()
    .sort((a, b) => a.question_number - b.question_number)
    .map((question) => ({
      questionNumber: question.question_number,
      label: toStringSafe(question.question_text).trim() || `Question ${question.question_number}`
    }));
}

function parseTemplateLines(templateText: string, questions: StudentAttemptQuestion[]) {
  const fallbackByNumber = new Map(
    questions.map((q) => [Number(q.question_number), toStringSafe(q.question_text).trim() || `Question ${q.question_number}`])
  );

  const lines = templateText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const parsed: Array<{questionNumber: number; before: string; after: string}> = [];

  for (const line of lines) {
    const match = line.match(/\{(\d+)\}/);
    if (!match) continue;

    const questionNumber = Number(match[1]);
    if (!Number.isFinite(questionNumber) || questionNumber <= 0) continue;

    const token = `{${questionNumber}}`;
    const tokenIndex = line.indexOf(token);
    if (tokenIndex < 0) continue;

    parsed.push({
      questionNumber,
      before: line.slice(0, tokenIndex).trim(),
      after: line.slice(tokenIndex + token.length).trim()
    });
  }

  if (parsed.length) return parsed;

  return questions
    .slice()
    .sort((a, b) => a.question_number - b.question_number)
    .map((question) => ({
      questionNumber: question.question_number,
      before: toStringSafe(question.question_text).trim() || `Question ${question.question_number}`,
      after: ""
    }));
}

function mapGroupToBlocks(group: StudentAttemptQuestionGroup): ListeningBlock[] {
  const type = toStringSafe(group.question_type).trim().toUpperCase();
  const content = asRecord(group.group_content_json);
  // Defensive: backend (or misconfigured content) can occasionally return duplicate question numbers
  // in the same group, which breaks mark-for-review + radio grouping (same `name`) and causes UI duplication.
  const dedupedQuestions = group.questions
    .slice()
    .sort((a, b) => a.question_number - b.question_number)
    .filter((question) => {
      const num = Number(question.question_number);
      if (!Number.isFinite(num) || num <= 0) return false;
      return true;
    });
  const seen = new Set<number>();
  const questions = dedupedQuestions.filter((question) => {
    const num = Number(question.question_number);
    if (seen.has(num)) return false;
    seen.add(num);
    return true;
  });
  const minQuestion = questions.length ? questions[0].question_number : 0;
  const maxQuestion = questions.length ? questions[questions.length - 1].question_number : minQuestion;
  const groupRangeLabel = minQuestion > 0 && maxQuestion > 0
    ? `Questions ${minQuestion}-${maxQuestion}`
    : undefined;
  const groupInstruction = toStringSafe(group.instructions).trim() || undefined;
  const withGroupMeta = <T extends ListeningBlock>(block: T, instructionOverride?: string): T => ({
    ...block,
    groupRangeLabel,
    groupInstruction: instructionOverride ?? groupInstruction
  });

  if (type === "MCQ_SINGLE" || type === "MCQ_MULTIPLE") {
    const sharedOptionTexts = extractOptionTexts(content?.options);
    return [withGroupMeta({
      type: "mcqGroup",
      title: "Multiple Choice",
      allowMultiple: type === "MCQ_MULTIPLE",
      questions: questions.map((question) => {
        const options = asRecord(question.options_json);
        const optionTexts = extractOptionTexts(options?.options);
        return {
          questionNumber: question.question_number,
          prompt: extractQuestionPrompt(question),
          options: optionTexts.length ? optionTexts : (sharedOptionTexts.length ? sharedOptionTexts : ["A", "B", "C"])
        };
      })
    })];
  }

  if (type === "FORM_COMPLETION") {
    const templateText = toStringSafe(content?.template_text).trim();
    return [withGroupMeta({
      type: "noteForm",
      title: "Form Completion",
      description: undefined,
      fields: parseTemplateFields(templateText, questions)
    })];
  }

  if (type === "NOTE_COMPLETION") {
    const templateText = toStringSafe(content?.template_text).trim();
    const lines = parseTemplateLines(templateText, questions);

    return [withGroupMeta({
      type: "summaryCompletion",
      title: "Note Completion",
      instruction: "Complete the notes below.",
      templateText: templateText || undefined,
      lines: lines.map((line) => ({
        before: line.before,
        questionNumber: line.questionNumber,
        after: line.after
      }))
    })];
  }

  if (type === "TABLE_COMPLETION") {
    const columnsRaw = extractOptionTexts(content?.columns);
    const columns = columnsRaw.length ? columnsRaw : ["Prompt", "Answer"];
    const rowsRaw = asArray<unknown>(content?.rows);

    const extractPlaceholderNumbers = (value: string) => {
      const found = [...value.matchAll(/\{(\d+)\}/g)]
        .map((match) => Number(match[1]))
        .filter((num) => Number.isFinite(num) && num > 0);
      return [...new Set(found)];
    };

    const rows = rowsRaw.map((row, index) => {
      const cells = asArray<unknown>(row).map((item) => toStringSafe(item).trim());
      const fallbackQuestion = questions[index];
      const placeholders = extractPlaceholderNumbers(cells.join(" "));
      const fallbackNumber = fallbackQuestion?.question_number ?? index + 1;
      const questionNumbers = placeholders.length ? placeholders : (Number.isFinite(fallbackNumber) ? [fallbackNumber] : []);

      // If the backend/content omitted explicit placeholders, inject one into the last cell
      // so the UI has a place to render the blank.
      const needsInjection = questionNumbers.length === 1 && placeholders.length === 0;
      const normalizedCells = cells.length ? [...cells] : ["", ""];
      if (needsInjection) {
        const hasAnyCell = normalizedCells.some((cell) => cell.trim().length > 0);
        if (!hasAnyCell) {
          normalizedCells[0] = `Question ${questionNumbers[0]}`;
          normalizedCells[1] = `{${questionNumbers[0]}}`;
        } else if (!normalizedCells.join(" ").includes(`{${questionNumbers[0]}}`)) {
          const lastIndex = Math.max(0, normalizedCells.length - 1);
          normalizedCells[lastIndex] = (normalizedCells[lastIndex] ? `${normalizedCells[lastIndex]} ` : "") + `{${questionNumbers[0]}}`;
        }
      }

      return {
        id: `row-${index}`,
        values: normalizedCells,
        questionNumbers,
      };
    });

    return [withGroupMeta({
      type: "tableCompletion",
      title: "Table Completion",
      columns,
      rows: rows.length
        ? rows
        : questions.map((q, index) => ({
            id: `row-fallback-${index}`,
            values: [extractQuestionPrompt(q), `{${q.question_number}}`],
            questionNumbers: [q.question_number],
          }))
    })];
  }

  if (type === "PLAN_MAP_DIAGRAM" || type === "DIAGRAM_COMPLETION") {
    const labels = extractOptionTexts(content?.labels).length
      ? extractOptionTexts(content?.labels)
      : extractOptionTexts(content?.options);

    return [withGroupMeta({
      type: "diagramLabeling",
      title: "Diagram",
      description: "Choose the correct label.",
      options: labels.length ? labels : ["A", "B", "C", "D"],
      items: questions.map((q) => ({
        questionNumber: q.question_number,
        label: extractQuestionPrompt(q)
      }))
    })];
  }

  if (type === "LIST_SELECTION") {
    const options = extractOptionTexts(content?.options).length
      ? extractOptionTexts(content?.options)
      : extractOptionTexts(content?.choices).length
        ? extractOptionTexts(content?.choices)
        : extractOptionTexts(content?.categories).length
          ? extractOptionTexts(content?.categories)
          : extractOptionTexts(content?.labels);

    const prompt = questions
      .map((q) => extractQuestionPrompt(q))
      .find((value) => value.trim().length > 0)
      ?? "Select the correct options.";

    return [withGroupMeta({
      type: "listSelection",
      title: "List Selection",
      instruction: groupInstruction,
      prompt,
      options: options.length ? options : ["A", "B", "C", "D"],
      questionNumbers: questions.map((q) => q.question_number)
    })];
  }

  if (
    type === "MATCHING"
    || type === "CLASSIFICATION"
    || type === "MATCH_PARA_INFO"
  ) {
    const options = extractOptionTexts(content?.options).length
      ? extractOptionTexts(content?.options)
      : extractOptionTexts(content?.choices).length
        ? extractOptionTexts(content?.choices)
        : extractOptionTexts(content?.categories).length
          ? extractOptionTexts(content?.categories)
          : extractOptionTexts(content?.labels);

    return [withGroupMeta({
      type: "matching",
      title: "Matching",
      options: options.length ? options : ["A", "B", "C", "D"],
      items: questions.map((q) => ({
        questionNumber: q.question_number,
        prompt: extractQuestionPrompt(q)
      }))
    })];
  }

  const summaryText = toStringSafe(content?.summary_text).trim();
  if (summaryText) {
    const lines = questions.map((question) => {
      const token = `{${question.question_number}}`;
      const tokenIndex = summaryText.indexOf(token);
      if (tokenIndex >= 0) {
        return {
          before: summaryText.slice(0, tokenIndex).trim(),
          questionNumber: question.question_number,
          after: summaryText.slice(tokenIndex + token.length).trim()
        };
      }
      return {
        before: extractQuestionPrompt(question),
        questionNumber: question.question_number,
        after: ""
      };
    });

    return [withGroupMeta({
      type: "summaryCompletion",
      title: "Summary Completion",
      instruction: "Complete the summary.",
      templateText: summaryText,
      lines
    })];
  }

  return [withGroupMeta({
    type: "summaryCompletion",
    title: "Completion",
    instruction: "Complete each item.",
    lines: questions.map((question) => ({
      before: extractQuestionPrompt(question),
      questionNumber: question.question_number,
      after: ""
    }))
  })];
}

function mergeDuplicateMcqQuestions(blocks: ListeningBlock[]) {
  const cloned = blocks.map((block) => {
    if (block.type !== "mcqGroup") return block;
    return {
      ...block,
      questions: block.questions.map((question) => ({
        ...question,
        options: [...question.options],
      })),
    };
  });

  const removeByBlock = new Map<number, Set<number>>();
  const firstByNumber = new Map<number, {blockIndex: number; questionIndex: number}>();

  const isGenericPrompt = (prompt: string, questionNumber: number) => {
    const cleaned = (prompt ?? "").trim();
    if (!cleaned) return true;
    if (/^question\s+\d+$/i.test(cleaned)) return true;
    if (cleaned === String(questionNumber)) return true;
    return false;
  };

  const mergePrompt = (base: string, incoming: string, questionNumber: number) => {
    const a = (base ?? "").trim();
    const b = (incoming ?? "").trim();
    if (!a) return b;
    if (!b) return a;
    if (a === b) return a;
    if (a.includes(b)) return a;
    if (b.includes(a)) return b;

    // Prefer non-generic prompt if one side is generic.
    const aGeneric = isGenericPrompt(a, questionNumber);
    const bGeneric = isGenericPrompt(b, questionNumber);
    if (aGeneric && !bGeneric) return b;
    if (!aGeneric && bGeneric) return a;

    return `${a} ${b}`.replace(/\s+/g, " ").trim();
  };

  const parseKeyFromOption = (value: string) => {
    const raw = (value ?? "").trim();
    const match = raw.match(/^([A-Z]+)[\)\].:\-]\s*(.+)$/i);
    if (match) {
      return {key: match[1].toUpperCase(), label: `${match[1].toUpperCase()}. ${match[2].trim()}`};
    }
    if (/^[A-Z]+$/.test(raw.toUpperCase())) {
      return {key: raw.toUpperCase(), label: raw.toUpperCase()};
    }
    return {key: "", label: raw};
  };

  const mergeOptions = (baseOptions: string[], incomingOptions: string[]) => {
    const byKey = new Map<string, string>();
    const loose: string[] = [];

    const ingest = (options: string[]) => {
      options.forEach((opt) => {
        const parsed = parseKeyFromOption(opt);
        if (!parsed.label) return;
        if (parsed.key) {
          const existing = byKey.get(parsed.key);
          if (!existing || existing.length < parsed.label.length) {
            byKey.set(parsed.key, parsed.label);
          }
          return;
        }
        if (!loose.includes(parsed.label)) {
          loose.push(parsed.label);
        }
      });
    };

    ingest(baseOptions);
    ingest(incomingOptions);

    const sortedKeys = [...byKey.keys()].sort((a, b) => a.localeCompare(b));
    return [...sortedKeys.map((key) => byKey.get(key)!).filter(Boolean), ...loose];
  };

  cloned.forEach((block, blockIndex) => {
    if (block.type !== "mcqGroup") return;

    block.questions.forEach((question, questionIndex) => {
      const number = Number(question.questionNumber);
      if (!Number.isFinite(number) || number <= 0) return;

      const first = firstByNumber.get(number);
      if (!first) {
        firstByNumber.set(number, {blockIndex, questionIndex});
        return;
      }

      const keeperBlock = cloned[first.blockIndex];
      if (keeperBlock.type !== "mcqGroup") return;
      const keeper = keeperBlock.questions[first.questionIndex];
      if (!keeper) return;

      keeper.prompt = mergePrompt(keeper.prompt, question.prompt, number);
      keeper.options = mergeOptions(keeper.options, question.options);

      const removalSet = removeByBlock.get(blockIndex) ?? new Set<number>();
      removalSet.add(questionIndex);
      removeByBlock.set(blockIndex, removalSet);
    });
  });

  return cloned
    .map((block, blockIndex) => {
      if (block.type !== "mcqGroup") return block;
      const removals = removeByBlock.get(blockIndex);
      if (!removals || removals.size === 0) return block;
      const nextQuestions = block.questions.filter((_, idx) => !removals.has(idx));
      return nextQuestions.length ? {...block, questions: nextQuestions} : null;
    })
    .filter(Boolean) as ListeningBlock[];
}

function mapListeningAttemptToRuntimeTest(test: StudentTestRecord, attempt: StudentAttemptDetail): ListeningFullTest {
  const parts = attempt.listening_parts
    .slice()
    .sort((a: StudentAttemptListeningPart, b: StudentAttemptListeningPart) => {
      const aPart = toNumberSafe(toStringSafe(a.part_number).replace(/\D/g, ""), 0);
      const bPart = toNumberSafe(toStringSafe(b.part_number).replace(/\D/g, ""), 0);
      return aPart - bPart;
    });

  const totalParts = Math.max(parts.length, 1);
  const estimatedPartDuration = Math.max(120, Math.floor((attempt.time_limit_seconds ?? 1800) / totalParts));

  const sections: ListeningSectionFull[] = parts.map((part, index) => {
    const groups = part.question_groups.slice().sort((a, b) => a.group_order - b.group_order);
    const blocks = mergeDuplicateMcqQuestions(groups.flatMap(mapGroupToBlocks));
    const allQuestionNumbers = groups.flatMap((group) => group.questions.map((question) => Number(question.question_number)));
    const minQuestion = allQuestionNumbers.length ? Math.min(...allQuestionNumbers) : index * 10 + 1;
    const maxQuestion = allQuestionNumbers.length ? Math.max(...allQuestionNumbers) : minQuestion + 9;

    return {
      id: (`s${index + 1}` as ListeningSectionId),
      title: toStringSafe(part.title).trim() || `Part ${index + 1}`,
      instructions: toStringSafe(groups[0]?.instructions).trim() || "Answer the questions below.",
      questionRangeLabel: `Questions ${minQuestion}-${maxQuestion}`,
      audioMeta: {
        nowPlayingLabel: `Part ${index + 1} of ${totalParts}`,
        durationSec: estimatedPartDuration,
        currentTrackTitle: toStringSafe(part.title).trim() || `Listening Part ${index + 1}`,
        audioUrl: toStringSafe(part.audio_file_url).trim() || null
      },
      transcriptText: toStringSafe(part.transcript_text).trim() || null,
      blocks
    };
  });

  return {
    id: test.id,
    title: toStringSafe(test.title).trim() || "Listening Test",
    durationMinutes: Math.max(1, Math.ceil((test.time_limit_seconds ?? 1800) / 60)),
    totalQuestions: test.total_questions || attempt.total_questions || 40,
    sections
  };
}

type AnswersMap = Record<number, string>;

function isAnswered(value: string | undefined) {
  return (value ?? "").trim().length > 0;
}

function parseOptionChoice(option: string, index: number) {
  const toOptionKey = (rawIndex: number) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let value = rawIndex + 1;
    let result = "";
    while (value > 0) {
      value -= 1;
      result = alphabet[value % 26] + result;
      value = Math.floor(value / 26);
    }
    return result || "A";
  };

  const match = option.match(/^\s*([A-Z])[\)\].:\-]\s*(.+)$/i);
  if (match) {
    return {
      key: match[1].toUpperCase(),
      text: match[2].trim(),
      label: `${match[1].toUpperCase()}. ${match[2].trim()}`
    };
  }

  return {
    key: toOptionKey(index),
    text: option,
    label: option
  };
}

function resolveChoiceKeyFromRawValue(
  rawValue: string | undefined,
  parsedOptions: Array<{key: string; label: string}>,
  rawOptions: string[]
) {
  const normalized = (rawValue ?? "").trim();
  if (!normalized) return "";

  const upper = normalized.toUpperCase();
  const byKey = parsedOptions.find((option) => option.key.toUpperCase() === upper);
  if (byKey) return byKey.key;

  const byLabel = parsedOptions.find((option) => option.label.toUpperCase() === upper);
  if (byLabel) return byLabel.key;

  const byRawOption = rawOptions.findIndex((option) => option.trim().toUpperCase() === upper);
  if (byRawOption >= 0) return parsedOptions[byRawOption]?.key ?? "";

  return "";
}

type TemplateToken =
  | { kind: "text"; value: string; bold: boolean }
  | { kind: "placeholder"; questionNumber: number; bold: boolean };

function tokenizeTemplateTextWithBoldAndPlaceholders(text: string): TemplateToken[] {
  const tokens: TemplateToken[] = [];
  const re = /(\*\*|\{(\d+)\})/g;
  let lastIndex = 0;
  let bold = false;

  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const value = text.slice(lastIndex, index);
      if (value) {
        tokens.push({ kind: "text", value, bold });
      }
    }

    const raw = match[1] ?? "";
    if (raw === "**") {
      bold = !bold;
    } else {
      const questionNumber = Number(match[2] ?? "");
      if (Number.isFinite(questionNumber) && questionNumber > 0) {
        tokens.push({ kind: "placeholder", questionNumber, bold });
      } else if (raw) {
        tokens.push({ kind: "text", value: raw, bold });
      }
    }

    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    const value = text.slice(lastIndex);
    if (value) {
      tokens.push({ kind: "text", value, bold });
    }
  }

  return tokens;
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
  const reviewRequested = searchParams.get("review") === "1";
  const reviewAttemptParam = searchParams.get("attempt")?.trim() ?? "";
  const reviewAttemptId = reviewRequested && UUID_PATTERN.test(reviewAttemptParam) ? reviewAttemptParam : null;

  const [resolvedTestId, setResolvedTestId] = useState<string>(testId);
  const [loadingBackendTest, setLoadingBackendTest] = useState(false);
  const [backendLoadError, setBackendLoadError] = useState<string | null>(null);
  const [initialBackendAttemptId, setInitialBackendAttemptId] = useState<string | null>(null);
  const [initialSubmitMetaByNumber, setInitialSubmitMetaByNumber] = useState<Map<number, ListeningSubmitQuestionMeta>>(new Map());

  useEffect(() => {
    let active = true;

    const local = getListeningTestById(testId);
    if (local) {
      setResolvedTestId(testId);
      setLoadingBackendTest(false);
      setBackendLoadError(null);
      setInitialBackendAttemptId(null);
      setInitialSubmitMetaByNumber(new Map());
      return () => {
        active = false;
      };
    }

    if (!UUID_PATTERN.test(testId)) {
      setResolvedTestId(testId);
      setLoadingBackendTest(false);
      setBackendLoadError(null);
      setInitialBackendAttemptId(null);
      setInitialSubmitMetaByNumber(new Map());
      return () => {
        active = false;
      };
    }

    const loadFromBackend = async () => {
      setLoadingBackendTest(true);
      setBackendLoadError(null);

      try {
        const listed = await studentTestsService.listListeningAllPages({ pageSize: 100 });
        const matched = listed.results.find((item) => String(item.id) === testId) ?? null;

        if (!matched) {
          throw new Error("Listening test not found in backend.");
        }

        let finalAttempt: StudentAttemptDetail;
        let finalAttemptId: string | null = null;

        if (reviewAttemptId) {
          finalAttempt = await studentAttemptsService.getById(reviewAttemptId);
          finalAttemptId = reviewAttemptId;
        } else {
          const createdAttempt = await studentAttemptsService.create({
            practice_test: matched.id,
            mode: "PRACTICE"
          });
          finalAttempt = createdAttempt.listening_parts?.length
            ? createdAttempt
            : await studentAttemptsService.getById(String(createdAttempt.id));

          // If backend resumed an empty in-progress attempt, recycle it so we pick up
          // the latest listening-part media (including newly uploaded per-part audio).
          if (
            String(finalAttempt.status ?? "").toUpperCase() === "IN_PROGRESS"
            && Number(finalAttempt.answered_count ?? 0) === 0
          ) {
            try {
              await studentAttemptsService.submit(String(finalAttempt.id), {
                time_used_seconds: 0,
                answers: []
              });
              const refreshedAttempt = await studentAttemptsService.create({
                practice_test: matched.id,
                mode: "PRACTICE"
              });
              finalAttempt = refreshedAttempt.listening_parts?.length
                ? refreshedAttempt
                : await studentAttemptsService.getById(String(refreshedAttempt.id));
            } catch {
              // Keep the original attempt if recycle fails.
            }
          }

          finalAttemptId = toStringSafe(finalAttempt.id).trim() || null;
        }

        const nextSubmitMetaByNumber = collectListeningSubmitMetaByNumber(finalAttempt);

        const mapped = mapListeningAttemptToRuntimeTest(matched, finalAttempt);
        saveRuntimeListeningTest(mapped);

        if (!active) return;
        setResolvedTestId(mapped.id);
        setInitialBackendAttemptId(finalAttemptId);
        setInitialSubmitMetaByNumber(nextSubmitMetaByNumber);
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof StudentApiError
            ? error.message
            : "Failed to load this listening test from backend.";
        setBackendLoadError(message);
      } finally {
        if (active) {
          setLoadingBackendTest(false);
        }
      }
    };

    void loadFromBackend();

    return () => {
      active = false;
    };
  }, [testId, reviewAttemptId]);

  const test = getListeningTestById(resolvedTestId);

  if (loadingBackendTest && !test) {
    return (
      <LoadingModal
        open={true}
        message={t.has("loadingDesc") ? t("loadingDesc") : "Fetching test content from backend."}
      />
    );
  }

  if (!test) {
    return (
      <div className="mx-auto mt-8 max-w-xl px-4">
        <Card className="gap-3 p-6">
          <h1 className="text-xl font-semibold">{t("notFoundTitle")}</h1>
          <p className="text-sm text-muted-foreground">{backendLoadError || t("notFoundDesc")}</p>
          <Button asChild className="mt-2 w-fit">
            <Link href={`/${locale}/listening`}>{t("backToListening")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <ListeningTestClient
      key={test.id}
      testId={test.id}
      requestedMode={requestedMode}
      initialBackendAttemptId={initialBackendAttemptId}
      initialSubmitMetaByNumber={initialSubmitMetaByNumber}
    />
  );
}

function ListeningTestClient({
  testId,
  requestedMode = null,
  initialBackendAttemptId = null,
  initialSubmitMetaByNumber = new Map(),
}: {
  testId: string;
  requestedMode?: AttemptMode | null;
  initialBackendAttemptId?: string | null;
  initialSubmitMetaByNumber?: Map<number, ListeningSubmitQuestionMeta>;
}) {
  const searchParams = useSearchParams();
  const t = useTranslations("listeningTest");
  const tListeningResult = useTranslations("listeningResult");
  const tOptions = useTranslations("testOptions");
  const locale = useLocale();
  const router = useRouter();
  const reviewDeepLinkAttemptIdRaw = searchParams.get("attempt")?.trim() ?? "";
  const reviewDeepLinkActive = searchParams.get("review") === "1" && UUID_PATTERN.test(reviewDeepLinkAttemptIdRaw);
  const reviewDeepLinkAttemptId = reviewDeepLinkActive ? reviewDeepLinkAttemptIdRaw : null;
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
  // UI can switch between parts independently from which audio track is currently playing.
  // This is required for Real Mode sequencing: audio advances only after the current part finishes.
  const [audioSectionId, setAudioSectionId] = useState<
    "s1" | "s2" | "s3" | "s4"
  >("s1");
  const [attemptId, setAttemptId] = useState("");
  const [backendAttemptId, setBackendAttemptId] = useState<string | null>(initialBackendAttemptId);
  const [submitMetaByNumber, setSubmitMetaByNumber] = useState<Map<number, ListeningSubmitQuestionMeta>>(() => new Map(initialSubmitMetaByNumber));
  const [startedAt, setStartedAt] = useState(0);
  const [finishOpen, setFinishOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(reviewDeepLinkActive);
  const [backendReviewData, setBackendReviewData] = useState<AdaptedListeningBackendReview | null>(null);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
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
  type RealModeInterruptionReason = "fullscreen" | "visibility";
  const [realModeInterruption, setRealModeInterruption] = useState<RealModeInterruptionReason | null>(null);
  const [realModeInterruptionCount, setRealModeInterruptionCount] = useState({
    fullscreen: 0,
    visibility: 0,
  });

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioBufferedProgress, setAudioBufferedProgress] = useState(0);
  const [audioVolume, setAudioVolume] = useState(72);
  const [audioSpeed, setAudioSpeed] = useState<1 | 1.25 | 1.5 | 1.75 | 2>(1);
  const [audioDurationSec, setAudioDurationSec] = useState(0);
  const [audioCurrentSec, setAudioCurrentSec] = useState(0);
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioShouldPlayRef = useRef(false);
  const suppressAudioAutoPlayRef = useRef(false);
  const bufferingPauseRef = useRef(false);
  const pendingJumpRef = useRef<number | null>(null);
  const realModeAutoFinishedRef = useRef(false);
  const fullscreenRequestInFlightRef = useRef(false);
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

  const leaveConfirm = useLeaveConfirm({
    enabled: Boolean(attemptId) && !reviewMode,
    title: t.has("leaveTitle") ? t("leaveTitle") : "Leave test?",
    message: leaveWarningMessage,
    confirmText: t.has("leaveConfirm") ? t("leaveConfirm") : "Quit test",
    cancelText: t.has("cancel") ? t("cancel") : "Cancel",
  });

  const resetAttemptState = (nextMode: AttemptMode | null = null) => {
    if (realModeStartTimeoutRef.current) {
      window.clearTimeout(realModeStartTimeoutRef.current);
      realModeStartTimeoutRef.current = null;
    }

    const freshAttemptId = createAttemptId();
    setAttemptId(freshAttemptId);
    setBackendAttemptId(null);
    setSubmitMetaByNumber(new Map());
    setStartedAt(Date.now());
    setAttemptMode(nextMode);
    setFinishOpen(false);
    setReviewMode(false);
    setBackendReviewData(null);
    setIsSubmittingResult(false);
    setExpandedReviewQuestions(new Set());
    setRealModeInterruption(null);
    setRealModeInterruptionCount({ fullscreen: 0, visibility: 0 });
    setHighlightedEvidenceQuestionId(null);
    setReviewMobilePanel("transcript");
    setActiveSectionId("s1");
    setAudioSectionId("s1");
    setActiveQuestionNumber(1);
    setAnswers({});
    setMarked(new Set());
    setRemainingSeconds(test.durationMinutes * 60);
    setTimerRunning(false);
    setAudioPlaying(false);
    setAudioProgress(0);
    setAudioBufferedProgress(0);
    setAudioCurrentSec(0);
    setAudioDurationSec(0);
    setAudioSpeed(1);
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

    if (reviewDeepLinkActive && reviewDeepLinkAttemptId) {
      const initTimer = window.setTimeout(() => {
        setAttemptId(createAttemptId());
        setBackendAttemptId(reviewDeepLinkAttemptId);
        setStartedAt(Date.now());
        setAttemptMode("practice");
        setFinishOpen(false);
        setReviewMode(true);
        setBackendReviewData(null);
        setIsSubmittingResult(false);
        setExpandedReviewQuestions(new Set());
        setRealModeInterruption(null);
        setRealModeInterruptionCount({ fullscreen: 0, visibility: 0 });
        setHighlightedEvidenceQuestionId(null);
        setReviewMobilePanel("transcript");
        setActiveSectionId("s1");
        setAudioSectionId("s1");
        setActiveQuestionNumber(1);
        setAnswers({});
        setMarked(new Set());
        setRemainingSeconds(test.durationMinutes * 60);
        setTimerRunning(false);
        setAudioPlaying(false);
        setAudioProgress(0);
        setAudioBufferedProgress(0);
        setAudioCurrentSec(0);
        setAudioDurationSec(0);
        setAudioSpeed(1);
        setPaletteOpen(false);
        realModeAutoFinishedRef.current = false;
        pendingJumpRef.current = null;
        audioShouldPlayRef.current = false;
        suppressAudioAutoPlayRef.current = true;
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
        const restoredBackendAttemptId =
          toStringSafe(saved.backendAttemptId).trim()
          || toStringSafe(initialBackendAttemptId).trim()
          || null;
        setBackendAttemptId(restoredBackendAttemptId);
        setStartedAt(saved.startedAt);
        setAnswers(restoredAnswers);
        setMarked(new Set(saved.markedQuestionIds.map((id) => Number(id.replace(`${test.id}-q`, ""))).filter((v) => Number.isFinite(v))));
        setRemainingSeconds(saved.timeRemainingSec);
        setAttemptMode(restoredMode);
        setTimerRunning(restoredMode === "real" && saved.timeRemainingSec > 0);
        setAudioPlaying(restoredMode === "real");
        setActiveSectionId("s1");
        setAudioSectionId("s1");
        audioShouldPlayRef.current = restoredMode === "real";
        realModeAutoFinishedRef.current = false;
      }, 0);
      return () => window.clearTimeout(hydrateTimer);
    }

    const initTimer = window.setTimeout(() => {
      setAttemptId(createAttemptId());
      setBackendAttemptId(null);
      setStartedAt(Date.now());
      setAttemptMode(null);
      setTimerRunning(false);
      realModeAutoFinishedRef.current = false;
    }, 0);
    return () => window.clearTimeout(initTimer);
  }, [requestedMode, restartRequested, reviewDeepLinkActive, reviewDeepLinkAttemptId, test.durationMinutes, test.id]);

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
    let active = true;

    if (!backendAttemptId || submitMetaByNumber.size > 0) {
      return () => {
        active = false;
      };
    }

    const loadSubmitMeta = async () => {
      try {
        const snapshot = await studentAttemptsService.getById(backendAttemptId);
        if (!active) return;
        setSubmitMetaByNumber(collectListeningSubmitMetaByNumber(snapshot));
      } catch {
        if (!active) return;
      }
    };

    void loadSubmitMeta();

    return () => {
      active = false;
    };
  }, [backendAttemptId, submitMetaByNumber.size]);

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
  const activeSectionPaletteSection = useMemo(
    () =>
      sectionPaletteSections.find((section) => section.sectionId === activeSectionId)
      ?? sectionPaletteSections[0]
      ?? null,
    [activeSectionId, sectionPaletteSections]
  );

  const activeSection = useMemo(
    () =>
      test.sections.find((section) => section.id === activeSectionId) ??
      test.sections[0],
    [activeSectionId, test.sections],
  );
  const audioSection = useMemo(
    () =>
      test.sections.find((section) => section.id === audioSectionId) ??
      test.sections[0],
    [audioSectionId, test.sections],
  );
  const audioSectionAudioUrl = useMemo(
    () => resolvePlayableAudioUrl(toStringSafe(audioSection.audioMeta.audioUrl)),
    [audioSection.audioMeta.audioUrl],
  );

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((value) => isAnswered(value)).length;
  }, [answers]);
  const markedCount = marked.size;
  const notAnsweredCount = test.totalQuestions - answeredCount;
  const unansweredCount = test.totalQuestions - answeredCount;
  const timeSpent = test.durationMinutes * 60 - remainingSeconds;
  const isRealMode = attemptMode === "real";
  const realModeLocked = isRealMode && timerRunning && !reviewMode && realModeInterruption !== null;
  const showModePicker = attemptMode === null;
  const flatQuestions = useMemo(
    () => flattenListeningQuestions(test.id, test.sections),
    [test.id, test.sections]
  );
  const localAnswersByQuestionId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(answers).map(([number, value]) => [`${test.id}-q${number}`, value])
      ) as Record<string, string | string[] | null>,
    [answers, test.id]
  );
  const localGradeableQuestions = useMemo<GradeableQuestion[]>(
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

  const reviewQuestions = useMemo(
    () => backendReviewData?.questions ?? flatQuestions,
    [backendReviewData, flatQuestions]
  );
  const reviewAnswersByQuestionId = useMemo(
    () => backendReviewData?.answers ?? localAnswersByQuestionId,
    [backendReviewData, localAnswersByQuestionId]
  );
  const reviewGradeableQuestions = useMemo<GradeableQuestion[]>(() => {
    if (!backendReviewData) return localGradeableQuestions;
    return backendReviewData.questions.map((question) => {
      const meta = backendReviewData.answerMeta.find((item) => item.questionId === question.id);
      return {
        id: question.id,
        number: question.number,
        type: question.type,
        correctAnswer: meta?.correctAnswer,
        acceptableAnswers: meta?.acceptableAnswers,
      };
    });
  }, [backendReviewData, localGradeableQuestions]);
  const grading = useMemo(
    () => gradeTest(reviewGradeableQuestions, reviewAnswersByQuestionId),
    [reviewAnswersByQuestionId, reviewGradeableQuestions]
  );
  const reviewAnswerMetaByQuestionId = useMemo<Record<string, ListeningBackendAnswerMeta>>(() => {
    if (backendReviewData) {
      return backendReviewData.answerMeta.reduce<Record<string, ListeningBackendAnswerMeta>>((accumulator, item) => {
        accumulator[item.questionId] = item;
        return accumulator;
      }, {});
    }

    return flatQuestions.reduce<Record<string, ListeningBackendAnswerMeta>>((accumulator, question) => {
      const staticMeta = getListeningAnswerMeta(question.id);
      accumulator[question.id] = {
        questionId: question.id,
        questionNumber: question.number,
        type: question.type,
        correctAnswer: staticMeta?.correctAnswer ?? null,
        acceptableAnswers: staticMeta?.acceptableAnswers,
        explanation: toStringSafe(staticMeta?.explanation).trim(),
        evidence: {
          sectionId: question.sectionId,
          transcriptQuote: toStringSafe(staticMeta?.evidence.transcriptQuote).trim() || question.prompt,
          timeRange: staticMeta?.evidence.timeRange,
        },
      };
      return accumulator;
    }, {});
  }, [backendReviewData, flatQuestions]);
  const reviewSections = useMemo<ListeningReviewSection[]>(() => {
    if (backendReviewData) {
      return backendReviewData.reviewSections.map((section, index) => ({
        ...section,
        label: tListeningResult("partLabel", { index: index + 1 }),
        evidenceItems: section.evidenceItems.map((item) => {
          const graded = grading.byQuestion[item.questionId];
          return {
            ...item,
            status: !graded?.normalizedUser ? "skipped" : graded.isCorrect ? "correct" : "incorrect",
          };
        }),
      }));
    }

    return test.sections.map((section, index) => ({
      sectionId: section.id,
      label: tListeningResult("partLabel", { index: index + 1 }),
      title: section.title,
      instructions: section.instructions,
      nowPlayingLabel: section.audioMeta.nowPlayingLabel,
      audioTitle: section.audioMeta.currentTrackTitle,
      transcriptText: toStringSafe(section.transcriptText).trim(),
      evidenceItems: flatQuestions
        .filter((question) => question.sectionId === section.id)
        .map((question) => {
          const meta = getListeningAnswerMeta(question.id);
          const graded = grading.byQuestion[question.id];
          return {
            questionId: question.id,
            questionNumber: question.number,
            prompt: question.prompt,
            quote: toStringSafe(meta?.evidence.transcriptQuote).trim() || question.prompt,
            timeRange: meta?.evidence.timeRange,
            status: !graded?.normalizedUser ? "skipped" : graded.isCorrect ? "correct" : "incorrect",
          } as const;
        }),
    }));
  }, [backendReviewData, flatQuestions, grading.byQuestion, tListeningResult, test.sections]);
  const resolvedActiveSectionId = test.sections.some((section) => section.id === activeSectionId)
    ? activeSectionId
    : (test.sections[0]?.id ?? "s1");
  const reviewStartQuestionId = useMemo(
    () =>
      reviewQuestions
        .filter((question) => question.sectionId === resolvedActiveSectionId)
        .sort((left, right) => left.number - right.number)[0]?.id ?? null,
    [reviewQuestions, resolvedActiveSectionId]
  );
  const effectiveAudioDurationSec = Math.max(
    0,
    Math.round(audioDurationSec > 0 ? audioDurationSec : audioSection.audioMeta.durationSec)
  );
  const safePlayedProgress = Math.max(0, Math.min(100, audioProgress));
  const safeBufferedProgress = Math.max(0, Math.min(100, audioBufferedProgress));
  const bufferedStop = Math.max(safePlayedProgress, safeBufferedProgress);
  const audioProgressTrackStyle = {
    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${safePlayedProgress}%, #7dd3fc ${safePlayedProgress}%, #7dd3fc ${bufferedStop}%, #d1d5db ${bufferedStop}%, #d1d5db 100%)`,
  };
  const volumeTrackStyle = {
    background: `linear-gradient(to right, #16a34a 0%, #16a34a ${audioVolume}%, #d1d5db ${audioVolume}%, #d1d5db 100%)`,
  };

  useEffect(() => {
    if (reviewDeepLinkActive) return;
    if (!attemptId || !attemptMode) return;
    const persistedAnswers = Object.fromEntries(
      Object.entries(answers).map(([number, value]) => [`${test.id}-q${number}`, value])
    );
    saveAttemptProgress({
      attemptId,
      backendAttemptId: backendAttemptId ?? undefined,
      module: "listening",
      testId: test.id,
      mode: attemptMode,
      answers: persistedAnswers,
      markedQuestionIds: [...marked].map((number) => `${test.id}-q${number}`),
      startedAt,
      timeRemainingSec: remainingSeconds,
      timerUsed: timerRunning || remainingSeconds !== test.durationMinutes * 60,
    });
  }, [answers, attemptId, attemptMode, backendAttemptId, marked, remainingSeconds, startedAt, test.durationMinutes, test.id, timerRunning]);

  useEffect(() => {
    if (!reviewDeepLinkActive || !reviewDeepLinkAttemptId) return;
    let active = true;

    const loadReview = async () => {
      try {
        const reviewResponse = await studentAttemptsService.review(reviewDeepLinkAttemptId);
        if (!active) return;
        setBackendReviewData(adaptListeningBackendReview(reviewResponse));
      } catch {
        // If review fails, keep fallback review UI (no explanations/evidence).
      }
    };

    void loadReview();

    return () => {
      active = false;
    };
  }, [reviewDeepLinkActive, reviewDeepLinkAttemptId]);

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

      void offenders;
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
    const audio = audioRef.current;
    if (!audio) return;
    const volume = Math.min(1, Math.max(0, audioVolume / 100));
    audio.volume = volume;
  }, [audioVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = audioSpeed;
  }, [audioSpeed]);

  const updateBufferedProgress = useCallback(() => {
    const media = audioRef.current;
    if (!media) return;
    const duration =
      Number.isFinite(media.duration) && media.duration > 0
        ? media.duration
        : Math.max(0, audioSection.audioMeta.durationSec);
    if (duration <= 0 || media.buffered.length === 0) {
      setAudioBufferedProgress(0);
      return;
    }
    try {
      const bufferedEnd = media.buffered.end(media.buffered.length - 1);
      const ratio = bufferedEnd / duration;
      const nextBuffered = ratio >= 0.995 ? 100 : Math.max(0, Math.min(100, ratio * 100));
      setAudioBufferedProgress(nextBuffered);
    } catch {
      setAudioBufferedProgress(0);
    }
  }, [audioSection.audioMeta.durationSec]);

  const getBufferedEndForCurrentTime = useCallback((media: HTMLAudioElement) => {
    if (media.buffered.length === 0) {
      return 0;
    }
    const current = media.currentTime || 0;
    for (let index = 0; index < media.buffered.length; index += 1) {
      const start = media.buffered.start(index);
      const end = media.buffered.end(index);
      if (current >= start && current <= end) {
        return end;
      }
    }
    return media.buffered.end(media.buffered.length - 1);
  }, []);

  const stopSectionAudioPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audioShouldPlayRef.current = false;
    bufferingPauseRef.current = false;
    setAudioPlaying(false);
    setAudioCurrentSec(0);
    setAudioProgress(0);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Switching tracks should always stop the previous playback immediately, but we keep
    // `audioShouldPlayRef` as the "intent" so we can auto-start the new track when needed.
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // Ignore browsers that reject setting currentTime before metadata is loaded.
    }

    if (!audioSectionAudioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioShouldPlayRef.current = false;
      bufferingPauseRef.current = false;
      setAudioPlaying(false);
      setAudioCurrentSec(0);
      setAudioDurationSec(0);
      setAudioProgress(0);
      setAudioBufferedProgress(0);
      return;
    }

    audio.src = audioSectionAudioUrl;
    audio.load();
    bufferingPauseRef.current = false;
    // Preserve desired playback across source changes (practice-mode auto-start and real-mode sequencing).
    setAudioPlaying(audioShouldPlayRef.current);
    setAudioCurrentSec(0);
    setAudioDurationSec(0);
    setAudioProgress(0);
    setAudioBufferedProgress(0);
  }, [audioSectionAudioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audioSectionAudioUrl) {
      setAudioPlaying(false);
      return;
    }

    if (suppressAudioAutoPlayRef.current) {
      suppressAudioAutoPlayRef.current = false;
      audio.pause();
      setAudioPlaying(false);
      return;
    }

    if (audioPlaying) {
      void audio.play().catch(() => {
        setAudioPlaying(false);
      });
      return;
    }

    audio.pause();
  }, [audioSectionAudioUrl, audioPlaying]);

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
    if (!reviewMode && !isRealMode) {
      // Practice mode: switching parts should immediately start the selected part audio.
      suppressAudioAutoPlayRef.current = false;
      stopSectionAudioPlayback();
      audioShouldPlayRef.current = true;
      setAudioSectionId(nextSectionId);
      setAudioPlaying(true);
    }
    setActiveQuestionNumber(first);
  };

  const jumpToQuestion = (questionNumber: number) => {
    // In review mode (after finishing), the question list is rendered inside the Question Analysis panel.
    // The old `questionRefs`/`questionsScrollRef` mapping belongs to the test-taking UI, so we scroll by id.
    if (reviewMode) {
      const reviewQuestion = reviewQuestions.find((question) => question.number === questionNumber);
      if (!reviewQuestion) return;

      const nextSectionId = reviewQuestion.sectionId as ListeningSectionFull["id"];
      if (nextSectionId && nextSectionId !== activeSectionId) {
        // Keep behavior consistent: switching section should stop audio and change the active part.
        suppressAudioAutoPlayRef.current = true;
        stopSectionAudioPlayback();
        setActiveSectionId(nextSectionId);
      }

      setActiveQuestionNumber(questionNumber);
      if (isCompact) {
        setReviewMobilePanel("questions");
      }

      window.setTimeout(() => {
        const node = document.getElementById(`review-question-${reviewQuestion.id}`);
        node?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);

      if (isCompact) {
        setPaletteOpen(false);
      }
      return;
    }

    const sectionId = sectionByQuestion.get(questionNumber);
    if (!sectionId) {
      return;
    }

    setActiveQuestionNumber(questionNumber);

    if (sectionId !== activeSectionId) {
      pendingJumpRef.current = questionNumber;
      if (!reviewMode && !isRealMode) {
        // Practice mode: jumping into another part should start that part immediately.
        suppressAudioAutoPlayRef.current = false;
        stopSectionAudioPlayback();
        audioShouldPlayRef.current = true;
        setAudioSectionId(sectionId);
        setAudioPlaying(true);
      }
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

  const toggleAudioPlayback = useCallback(() => {
    if (isRealMode || !audioSectionAudioUrl) return;
    const media = audioRef.current;
    if (!media) return;

    if (media.paused) {
      audioShouldPlayRef.current = true;
      void media.play().catch(() => {
        setAudioPlaying(false);
      });
      return;
    }

    audioShouldPlayRef.current = false;
    bufferingPauseRef.current = false;
    media.pause();
  }, [audioSectionAudioUrl, isRealMode]);

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

  const confirmRealModeStart = async () => {
    if (realModeStartTimeoutRef.current) {
      window.clearTimeout(realModeStartTimeoutRef.current);
      realModeStartTimeoutRef.current = null;
    }
    setRealModeConfirmOpen(false);

    // Real mode should always begin from Part 1 and run in fullscreen (like Reading real mode).
    stopSectionAudioPlayback();
    // Prevent the track swap from auto-starting before the countdown completes.
    suppressAudioAutoPlayRef.current = true;
    setActiveSectionId("s1");
    setAudioSectionId("s1");
    setActiveQuestionNumber(1);
    if (!isFullscreen) {
      await toggleFullscreen();
    }

    setRealModeStarting(true);
    realModeStartTimeoutRef.current = window.setTimeout(() => {
      setTimerRunning(true);
      suppressAudioAutoPlayRef.current = false;
      audioShouldPlayRef.current = true;
      setAudioPlaying(true);
      setRealModeStarting(false);
      realModeStartTimeoutRef.current = null;
    }, 1000);
  };

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

  const triggerRealModeInterruption = useCallback((reason: RealModeInterruptionReason) => {
    const realModeSessionActive = isRealMode && timerRunning;
    if (!realModeSessionActive || reviewMode) {
      return;
    }

    setRealModeInterruptionCount((prev) => ({
      ...prev,
      [reason]: prev[reason] + 1,
    }));
    setRealModeInterruption((prev) => prev ?? reason);
  }, [isRealMode, reviewMode, timerRunning]);

  const leaveRealMode = useCallback(() => {
    // Exiting Real mode explicitly switches the user into Practice mode.
    setAttemptMode("practice");
    setTimerRunning(false);
    setRealModeStarting(false);
    setRealModeConfirmOpen(false);
    setRealModeInterruption(null);
    setRealModeInterruptionCount({ fullscreen: 0, visibility: 0 });

    audioShouldPlayRef.current = false;
    bufferingPauseRef.current = false;
    suppressAudioAutoPlayRef.current = false;
    stopSectionAudioPlayback();
    setAudioPlaying(false);

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

  useEffect(() => {
    const realModeSessionActive = isRealMode && timerRunning;
    if (!realModeSessionActive || reviewMode || isFullscreen || realModeInterruption !== null) {
      return;
    }

    void requestRealModeFullscreen().then((enteredFullscreen) => {
      if (!enteredFullscreen) {
        triggerRealModeInterruption("fullscreen");
      }
    });
  }, [
    isFullscreen,
    isRealMode,
    realModeInterruption,
    requestRealModeFullscreen,
    reviewMode,
    timerRunning,
    triggerRealModeInterruption,
  ]);

  useEffect(() => {
    const realModeSessionActive = isRealMode && timerRunning;
    if (!realModeSessionActive || reviewMode || realModeInterruption !== null) {
      return;
    }
    if (isFullscreen || fullscreenRequestInFlightRef.current) {
      return;
    }
    triggerRealModeInterruption("fullscreen");
  }, [isFullscreen, isRealMode, realModeInterruption, reviewMode, timerRunning, triggerRealModeInterruption]);

  useEffect(() => {
    const realModeSessionActive = isRealMode && timerRunning;
    if (!realModeSessionActive || reviewMode) {
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
  }, [isRealMode, reviewMode, timerRunning, triggerRealModeInterruption]);

  const handleJumpEvidenceFromReview = useCallback((questionId: string) => {
    const reviewMeta = reviewAnswerMetaByQuestionId[questionId];
    setReviewMobilePanel("transcript");
    const nextSectionId = reviewMeta?.evidence.sectionId ?? "";
    if (nextSectionId === "s1" || nextSectionId === "s2" || nextSectionId === "s3" || nextSectionId === "s4") {
      setActiveSectionId(nextSectionId);
    }
    setHighlightedEvidenceQuestionId(questionId);

    window.setTimeout(() => {
      const node = document.getElementById(`transcript-hit-${questionId}`);
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const transcriptTop = document.getElementById("review-main");
      transcriptTop?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [reviewAnswerMetaByQuestionId]);

  const handleGoToQuestionFromReview = useCallback((questionId: string) => {
    setReviewMobilePanel("questions");
    window.setTimeout(() => {
      const node = document.getElementById(`review-question-${questionId}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, []);

  const resolveTimeUsedSeconds = useCallback((finishedAtMs?: number) => {
    const finishedAt = typeof finishedAtMs === "number" ? finishedAtMs : Date.now();
    const timerUsed = timerRunning || remainingSeconds !== test.durationMinutes * 60;
    const timerSpentSeconds = Math.max(0, test.durationMinutes * 60 - remainingSeconds);
    const elapsedSeconds = Math.max(0, Math.floor((finishedAt - startedAt) / 1000));
    return timerUsed ? timerSpentSeconds : elapsedSeconds;
  }, [remainingSeconds, startedAt, test.durationMinutes, timerRunning]);

  const finishTest = useCallback(async () => {
    if (!attemptId || isSubmittingResult) return;
    setIsSubmittingResult(true);
    try {
      const finishedAt = Date.now();
      const timerUsed = timerRunning || remainingSeconds !== test.durationMinutes * 60;
      const timeUsedSeconds = resolveTimeUsedSeconds(finishedAt);
      const persistedAnswers = Object.fromEntries(
        Object.entries(answers).map(([number, value]) => [`${test.id}-q${number}`, value])
      );

      let submitAttemptId = backendAttemptId;
      if (!submitAttemptId && UUID_PATTERN.test(test.id)) {
        try {
          const createdAttempt = await studentAttemptsService.create({
            practice_test: test.id,
            mode: attemptMode === "real" ? "REAL" : "PRACTICE"
          });
          submitAttemptId = toStringSafe(createdAttempt.id).trim() || null;
          setBackendAttemptId(submitAttemptId);
          setSubmitMetaByNumber(collectListeningSubmitMetaByNumber(createdAttempt));
        } catch {
          // Ignore attempt-create failure here; submit flow will continue with local result state.
        }
      }

      let submitSucceeded = false;
      if (submitAttemptId) {
        try {
          const activeEntries = Object.entries(answers)
            .map(([rawNumber, rawValue]) => {
              const questionNumber = Number(rawNumber);
              if (!Number.isFinite(questionNumber)) return null;
              const normalizedRaw = toStringSafe(rawValue).trim();
              if (!normalizedRaw) return null;

              const submitMeta = submitMetaByNumber.get(questionNumber);
              if (!submitMeta?.candidateIds?.length) return null;

              const answerPayload = submitMeta.questionType === "MCQ_MULTIPLE"
                ? {
                    answers: normalizedRaw
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  }
                : {
                    answer: normalizedRaw
                  };

              return {
                questionNumber,
                candidateIds: submitMeta.candidateIds,
                answer: answerPayload
              };
            })
            .filter(Boolean) as Array<{questionNumber: number; candidateIds: string[]; answer: {answer: string} | {answers: string[]}}>;

          const currentIds = new Map<number, string>();
          activeEntries.forEach((entry) => {
            const initialId = entry.candidateIds[0] ?? "";
            if (initialId) {
              currentIds.set(entry.questionNumber, initialId);
            }
          });

          let attemptIndex = 0;
          const maxAttempts = 12;
          while (attemptIndex < maxAttempts) {
            const backendAnswers = activeEntries
              .map((entry) => {
                const questionId = currentIds.get(entry.questionNumber) ?? "";
                if (!questionId) return null;

                return {
                  question_id: questionId,
                  answer: entry.answer
                };
              })
              .filter((item): item is {question_id: string; answer: {answer: string} | {answers: string[]}} => item !== null);

            try {
              await studentAttemptsService.submit(submitAttemptId, {
                time_used_seconds: timeUsedSeconds,
                answers: backendAnswers.map((item) => ({
                  ...item,
                  attempt_question_id: item.question_id
                }))
              });
              submitSucceeded = true;
              break;
            } catch (error) {
              const failedQuestionIds = extractValidationAnswerQuestionIdFailures(error);
              if (!failedQuestionIds.size) {
                throw error;
              }

              let changed = false;
              for (const entry of activeEntries) {
                const currentId = currentIds.get(entry.questionNumber) ?? "";
                if (!currentId || !failedQuestionIds.has(currentId)) continue;
                const nextCandidate = entry.candidateIds.find((candidate) => candidate && candidate !== currentId);
                if (nextCandidate) {
                  currentIds.set(entry.questionNumber, nextCandidate);
                  changed = true;
                }
              }

              if (!changed) {
                throw error;
              }
            }

            attemptIndex += 1;
          }
        } catch {
          // Keep console clean on submit failure.
        }
      }

      // Result page will load review/explanations; no need to fetch here.

      saveAttemptResult({
        attemptId,
        backendAttemptId: submitAttemptId ?? backendAttemptId ?? undefined,
        module: "listening",
        testId: test.id,
        mode: attemptMode ?? "practice",
        answers: persistedAnswers,
        markedQuestionIds: [...marked].map((number) => `${test.id}-q${number}`),
        startedAt,
        finishedAt,
        timeRemainingSec: remainingSeconds,
        timerUsed,
      });

      setFinishOpen(false);
      setPaletteOpen(false);
      setTimerRunning(false);
      setAudioPlaying(false);

      const resultAttemptId = submitAttemptId ?? backendAttemptId;
      if (resultAttemptId) {
        router.push(`/${locale}/listening/${test.id}/result?attempt=${resultAttemptId}`);
        return;
      }

      // Fallback: if backend attempt is missing, keep the in-test review mode.
      setReviewMobilePanel("transcript");
      setReviewMode(true);
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
    startedAt,
    submitMetaByNumber,
    test.durationMinutes,
    test.id,
    timerRunning,
    router,
    locale,
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

  const deriveBlockRangeLabel = (block: ListeningBlock) => {
    if (block.groupRangeLabel?.trim()) return block.groupRangeLabel.trim();
    const numbers = getQuestionNumbersFromBlock(block).filter((value) => Number.isFinite(value));
    if (!numbers.length) return "";
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    return min === max ? `Question ${min}` : `Questions ${min}-${max}`;
  };

  const deriveBlockInstruction = (block: ListeningBlock) => {
    if (block.groupInstruction?.trim()) return block.groupInstruction.trim();
    if (block.type === "mcqGroup") return block.title?.trim() ?? "";
    if (block.type === "listSelection") return block.instruction?.trim() ?? "";
    if (block.type === "summaryCompletion") return block.instruction?.trim() ?? "";
    if (block.type === "noteForm") return block.description?.trim() ?? "";
    if (block.type === "diagramLabeling") return block.description?.trim() ?? "";
    return "";
  };

  const renderBlock = (block: ListeningBlock) => {
    if (block.type === "noteForm") {
      return (
        <Card className="test-panel test-soft-surface min-w-0 gap-0 rounded-lg border border-border bg-muted/20 p-4 overflow-hidden">
          <h4 className="text-center text-base font-semibold tracking-wide">
            <InlineBoldText text={block.title} />
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
                  <InlineBoldText text={field.label} />
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
      const renderCell = (raw: string) => {
        const tokens = tokenizeTemplateTextWithBoldAndPlaceholders(raw);
        return tokens.map((token, tokenIndex) => {
          if (token.kind === "text") {
            if (!token.value) return null;
            return token.bold ? (
              <strong key={`table-text-${tokenIndex}`} className="font-semibold">
                {token.value}
              </strong>
            ) : (
              <span key={`table-text-${tokenIndex}`}>{token.value}</span>
            );
          }

          const questionNumber = token.questionNumber;
          const isActiveBlank = activeQuestionNumber === questionNumber;
          const isMarkedBlank = marked.has(questionNumber);

          return (
            <span
              key={`table-blank-${questionNumber}-${tokenIndex}`}
              id={`q-${questionNumber}`}
              ref={(el) => {
                if (!el) {
                  questionRefs.current.delete(questionNumber);
                  return;
                }
                questionRefs.current.set(questionNumber, el);
              }}
              className={cn(
                "inline-flex items-baseline gap-1.5 align-baseline",
                isMarkedBlank && "rounded-md bg-amber-50/40 px-1 py-0.5 dark:bg-amber-500/10"
              )}
              onClick={() => setActiveQuestionNumber(questionNumber)}
            >
              <QuestionChip number={questionNumber} active={isActiveBlank} />
              <Input
                aria-label={`Question ${questionNumber}`}
                value={answers[questionNumber] ?? ""}
                disabled={reviewMode}
                onFocus={() => setActiveQuestionNumber(questionNumber)}
                onChange={(event) => setAnswer(questionNumber, event.target.value)}
                placeholder="..."
                className={cn(
                  "test-input-surface h-9 w-28 rounded-md px-2 text-sm sm:w-36",
                  isActiveBlank
                    ? "border-blue-400 bg-blue-50/50 ring-1 ring-blue-400/30 dark:bg-blue-900/20"
                    : "border-blue-300/40 bg-background/80 dark:bg-muted/30"
                )}
              />
            </span>
          );
        });
      };

      return (
        <Card className="test-panel min-w-0 gap-0 rounded-lg border border-border bg-card p-0 overflow-hidden">
          <h4 className="border-b border-border px-4 py-3 text-sm font-semibold">
            <InlineBoldText text={block.title} />
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
                      <InlineBoldText text={col} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "scroll-mt-24",
                      row.questionNumbers.some((num) => marked.has(num)) && "bg-amber-50/20 dark:bg-amber-500/[0.06]"
                    )}
                  >
                    {block.columns.map((_, colIndex) => (
                      <td
                        key={`${row.id}-col-${colIndex}`}
                        className="border-b border-border px-3 py-2 align-top wrap-break-word"
                      >
                        {renderCell(row.values[colIndex] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      );
    }

    if (block.type === "mcqGroup") {
      const renderMcqQuestion = (question: typeof block.questions[number], grouped = false) => (
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
          className={cn(
            grouped
              ? "min-w-0 scroll-mt-24 px-1 py-3 first:pt-1"
              : "test-panel min-w-0 rounded-lg border border-border bg-card p-4 scroll-mt-24 overflow-hidden",
            markedQuestionClass(question.questionNumber),
          )}
          onClick={() => setActiveQuestionNumber(question.questionNumber)}
        >
          <p className="wrap-break-word text-sm font-medium">
            <span className="mr-2 inline-flex align-middle">
              <QuestionChip
                number={question.questionNumber}
                active={activeQuestionNumber === question.questionNumber}
              />
            </span>
            <InlineBoldText text={question.prompt} />
          </p>
          <div className="mt-2 space-y-2">
            {question.options.map((option, optionIndex) => {
              const choice = parseOptionChoice(option, optionIndex);
              const selectedSet = new Set(
                (answers[question.questionNumber] ?? "")
                  .split(",")
                  .map((item) => item.trim().toUpperCase())
                  .filter(Boolean)
              );
              const selected = selectedSet.has(choice.key);

              return (
              <label
                key={`${question.questionNumber}-${choice.key}`}
                className="flex min-w-0 items-start gap-2 text-sm"
              >
                <input
                  type={block.allowMultiple ? "checkbox" : "radio"}
                  name={`q-${question.questionNumber}`}
                  value={choice.key}
                  checked={block.allowMultiple ? selected : answers[question.questionNumber] === choice.key}
                  onChange={(e) => {
                    if (!block.allowMultiple) {
                      setAnswer(question.questionNumber, e.target.value);
                      return;
                    }

                    const current = new Set(
                      (answers[question.questionNumber] ?? "")
                        .split(",")
                        .map((item) => item.trim().toUpperCase())
                        .filter(Boolean)
                    );
                    if (current.has(choice.key)) {
                      current.delete(choice.key);
                    } else {
                      current.add(choice.key);
                    }
                    setAnswer(question.questionNumber, [...current].join(", "));
                  }}
                  onFocus={() =>
                    setActiveQuestionNumber(question.questionNumber)
                  }
                  className="mt-0.5"
                />
                <span className="wrap-break-word">{choice.label}</span>
              </label>
              );
            })}
          </div>
        </article>
      );

      const shouldGroupMcq = Boolean(block.allowMultiple && block.questions.length > 1);

      return (
        <div className="space-y-3">
          {block.title && !deriveBlockInstruction(block) ? (
            <p className="test-muted-copy text-sm font-medium text-muted-foreground">
              <FormattedInstructionText text={block.title} />
            </p>
          ) : null}
          {shouldGroupMcq ? (
            <Card className="test-panel min-w-0 gap-0 rounded-lg border border-border bg-card p-4 overflow-hidden">
              {(() => {
                const questionNumbers = block.questions.map((question) => question.questionNumber);
                const firstNumber = questionNumbers[0];
                const lastNumber = questionNumbers[questionNumbers.length - 1];
                const prompt =
                  block.questions.map((question) => question.prompt.trim()).find(Boolean)
                  || `Questions ${firstNumber}-${lastNumber}`;
                const sharedOptions = block.questions[0]?.options ?? [];
                const selectedSet = new Set(
                  questionNumbers
                    .flatMap((number) =>
                      (answers[number] ?? "")
                        .split(",")
                        .map((item) => item.trim().toUpperCase())
                        .filter(Boolean)
                    )
                );
                const maxSelections = Math.max(1, questionNumbers.length);

                return (
                  <div
                    ref={(el) => {
                      for (const number of questionNumbers) {
                        if (!el) {
                          questionRefs.current.delete(number);
                        } else {
                          questionRefs.current.set(number, el);
                        }
                      }
                    }}
                    className="space-y-4 scroll-mt-24"
                    onClick={() => setActiveQuestionNumber(firstNumber)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {questionNumbers.map((number) => (
                        <QuestionChip
                          key={`group-q-${number}`}
                          number={number}
                          active={activeQuestionNumber === number}
                          subtle={activeQuestionNumber !== number}
                        />
                      ))}
                      <p className="wrap-break-word text-sm font-medium">
                        <InlineBoldText text={prompt} />
                      </p>
                    </div>

                    <div className="space-y-2">
                      {sharedOptions.map((option, optionIndex) => {
                        const choice = parseOptionChoice(option, optionIndex);
                        const selected = selectedSet.has(choice.key);

                        return (
                          <label
                            key={`group-${firstNumber}-${lastNumber}-${choice.key}`}
                            className="flex min-w-0 items-start gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              name={`q-group-${firstNumber}-${lastNumber}`}
                              value={choice.key}
                              checked={selected}
                              onChange={() => {
                                const current = new Set(selectedSet);
                                if (current.has(choice.key)) {
                                  current.delete(choice.key);
                                } else if (current.size < maxSelections) {
                                  current.add(choice.key);
                                } else {
                                  return;
                                }

                                const orderedSelected = sharedOptions
                                  .map((rowOption, rowIndex) => parseOptionChoice(rowOption, rowIndex).key)
                                  .filter((key) => current.has(key));
                                const value = orderedSelected.join(", ");

                                setAnswers((prev) => {
                                  const next = { ...prev };
                                  for (const number of questionNumbers) {
                                    next[number] = value;
                                  }
                                  return next;
                                });
                              }}
                              onFocus={() => setActiveQuestionNumber(firstNumber)}
                              className="mt-0.5"
                            />
                            <span className="wrap-break-word">{choice.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </Card>
          ) : (
            block.questions.map((question) => renderMcqQuestion(question))
          )}
        </div>
      );
    }

    if (block.type === "listSelection") {
      const parsedOptions = block.options.map((option, optionIndex) => parseOptionChoice(option, optionIndex));
      const orderedOptionKeys = parsedOptions.map((option) => option.key);
      const selectedByNumber = block.questionNumbers
        .map((questionNumber) => resolveChoiceKeyFromRawValue(answers[questionNumber], parsedOptions, block.options))
        .filter(Boolean);
      const selectedSet = new Set(selectedByNumber);
      const maxSelections = Math.max(1, block.questionNumbers.length);

      return (
        <Card className="test-panel min-w-0 gap-0 rounded-lg border border-border bg-card p-4 overflow-hidden">
          <div
            ref={(el) => {
              for (const number of block.questionNumbers) {
                if (!el) {
                  questionRefs.current.delete(number);
                } else {
                  questionRefs.current.set(number, el);
                }
              }
            }}
            className="space-y-4 scroll-mt-24"
            onClick={() => setActiveQuestionNumber(block.questionNumbers[0] ?? 1)}
          >
            <div className="flex flex-wrap items-center gap-2">
              {block.questionNumbers.map((number) => (
                <QuestionChip
                  key={`list-selection-q-${number}`}
                  number={number}
                  active={activeQuestionNumber === number}
                  subtle={activeQuestionNumber !== number}
                />
              ))}
              <p className="wrap-break-word text-sm font-medium">
                <InlineBoldText text={block.prompt} />
              </p>
            </div>

            <div className="space-y-2">
              {parsedOptions.map((choice) => {
                const selected = selectedSet.has(choice.key);
                return (
                  <label
                    key={`list-selection-${choice.key}`}
                    className="flex min-w-0 items-start gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name={`list-selection-${block.questionNumbers[0] ?? 1}`}
                      value={choice.key}
                      checked={selected}
                      onChange={() => {
                        const current = new Set(selectedSet);
                        if (current.has(choice.key)) {
                          current.delete(choice.key);
                        } else if (current.size < maxSelections) {
                          current.add(choice.key);
                        } else {
                          return;
                        }

                        const orderedSelected = orderedOptionKeys.filter((key) => current.has(key));
                        setAnswers((prev) => {
                          const next = {...prev};
                          block.questionNumbers.forEach((questionNumber, index) => {
                            next[questionNumber] = orderedSelected[index] ?? "";
                          });
                          return next;
                        });

                        const focusIndex = Math.min(
                          Math.max(orderedSelected.indexOf(choice.key), 0),
                          block.questionNumbers.length - 1
                        );
                        setActiveQuestionNumber(block.questionNumbers[focusIndex] ?? (block.questionNumbers[0] ?? 1));
                      }}
                      onFocus={() => setActiveQuestionNumber(block.questionNumbers[0] ?? 1)}
                      className="mt-0.5"
                    />
                    <span className="inline-flex items-center gap-2 wrap-break-word">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-border/70 bg-muted/35 px-2 text-xs font-semibold text-foreground">
                        {choice.key}
                      </span>
                      <span>
                        <InlineBoldText text={choice.text ?? choice.label} />
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </Card>
      );
    }

    if (block.type === "matching") {
      const parsedOptions = block.options.map((option, optionIndex) => parseOptionChoice(option, optionIndex));
      const matchingInstructionText = deriveBlockInstruction(block);

      return (
        <Card className="test-panel min-w-0 gap-0 rounded-lg border border-border bg-card p-4 overflow-hidden">
          {matchingInstructionText ? (
            <p className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm wrap-break-word">
              <FormattedInstructionText text={matchingInstructionText} />
            </p>
          ) : null}

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
                  "flex min-w-0 flex-wrap items-center gap-2 scroll-mt-24",
                  markedQuestionClass(item.questionNumber),
                )}
                onClick={() => setActiveQuestionNumber(item.questionNumber)}
              >
                <QuestionChip
                  number={item.questionNumber}
                  active={activeQuestionNumber === item.questionNumber}
                />
                <p className="wrap-break-word text-sm">
                  <InlineBoldText text={item.prompt} />
                </p>
                <Select
                  value={resolveChoiceKeyFromRawValue(answers[item.questionNumber], parsedOptions, block.options)}
                  onValueChange={(value) =>
                    setAnswer(item.questionNumber, value)
                  }
                >
                  <SelectTrigger
                    aria-label={`Question ${item.questionNumber}`}
                    onFocus={() => setActiveQuestionNumber(item.questionNumber)}
                    className={cn(
                      "test-input-surface h-10 w-28 shrink-0",
                      isSmallLandscape && "h-11",
                    )}
                  >
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent>
                    {parsedOptions.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.key}
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

    if (block.templateText?.trim()) {
      const tokens = tokenizeTemplateTextWithBoldAndPlaceholders(block.templateText);

      return (
        <Card className="test-panel test-soft-surface min-w-0 gap-0 rounded-lg border border-border bg-muted/20 p-4 overflow-hidden">
          <div className="rounded-lg border border-border/60 bg-muted/15 p-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {tokens.map((token, tokenIndex) => {
                if (token.kind === "placeholder") {
                  const num = token.questionNumber;
                  const isCurrent = activeQuestionNumber === num;

                  return (
                    <span
                      key={`summary-token-${tokenIndex}`}
                      id={`q-${num}`}
                      ref={(el) => {
                        if (!el) {
                          questionRefs.current.delete(num);
                          return;
                        }
                        questionRefs.current.set(num, el);
                      }}
                      className={cn(
                        "mx-0.5 inline-flex items-baseline gap-1 scroll-mt-24 align-baseline",
                        token.bold && "font-semibold",
                        markedQuestionClass(num),
                      )}
                      onClick={() => setActiveQuestionNumber(num)}
                    >
                      <QuestionChip number={num} active={isCurrent} />
                      <Input
                        aria-label={`Question ${num}`}
                        value={answers[num] ?? ""}
                        onChange={(e) => setAnswer(num, e.target.value)}
                        onFocus={() => setActiveQuestionNumber(num)}
                        placeholder="..."
                        className={cn(
                          "test-input-surface inline-block h-8 w-28 rounded-md px-2 text-sm transition-all sm:w-36",
                          token.bold && "font-medium",
                          isCurrent
                            ? "border-blue-400 bg-blue-50/60 ring-1 ring-blue-400/30 dark:bg-blue-900/20"
                            : "",
                        )}
                      />
                    </span>
                  );
                }

                if (token.bold) {
                  return (
                    <strong key={`summary-token-${tokenIndex}`} className="wrap-break-word font-semibold">
                      {token.value}
                    </strong>
                  );
                }

                return (
                  <FormattedInstructionText
                    key={`summary-token-${tokenIndex}`}
                    text={token.value}
                    className="wrap-break-word"
                  />
                );
              })}
            </p>
          </div>
        </Card>
      );
    }

    return (
      <Card className="test-panel test-soft-surface min-w-0 gap-0 rounded-lg border border-border bg-muted/20 p-4 overflow-hidden">
        <div className="space-y-3 text-sm leading-7">
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
              <FormattedInstructionText
                text={line.before}
                className="wrap-break-word"
              />
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
              <FormattedInstructionText
                text={line.after}
                className="wrap-break-word"
              />
            </div>
          ))}
        </div>
      </Card>
    );
  };
  const renderBlockReviewSummary = (block: ListeningBlock) => {
    if (!reviewMode) return null;
    const numbers = getQuestionNumbersFromBlock(block);
    if (!numbers.length) return null;

    return (
      <Card className="test-panel min-w-0 gap-2 rounded-lg border border-border bg-card/80 p-3">
        {numbers.map((questionNumber) => {
          const questionId = `${test.id}-q${questionNumber}`;
          const answerMeta = reviewAnswerMetaByQuestionId[questionId];
          const graded = grading.byQuestion[questionId];
          const userAnswer = answers[questionNumber] ?? "";
          const normalizedUser = String(userAnswer ?? "").trim();
          const correctAnswer = Array.isArray(answerMeta?.correctAnswer)
            ? answerMeta.correctAnswer.join(", ")
            : (answerMeta?.correctAnswer ?? "");
          const statusText = !graded?.normalizedUser
            ? tListeningResult("skippedStatus")
            : graded.isCorrect
              ? tListeningResult("correctStatus")
              : tListeningResult("incorrectStatus");
          const statusClass = !graded?.normalizedUser
            ? "text-muted-foreground"
            : graded.isCorrect
              ? "text-emerald-600 dark:text-emerald-300"
              : "text-rose-600 dark:text-rose-300";

          return (
            <div key={`review-block-${questionNumber}`} className="rounded-md border border-border/70 bg-background/60 p-2.5">
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    {t.has("questionPosition")
                      ? t("questionPosition", { current: questionNumber, total: test.totalQuestions })
                      : `Question ${questionNumber}`}
                  </p>
                  <span className={cn("text-xs font-semibold", statusClass)}>{statusText}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-md px-2 text-[11px]"
                    onClick={() => {
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
                  >
                    {expandedReviewQuestions.has(questionId)
                      ? tListeningResult("hideExplanation")
                      : tListeningResult("explain")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-md border-border/70 px-2 text-[11px]"
                    onClick={() => handleJumpEvidenceFromReview(questionId)}
                  >
                    {tListeningResult("jumpToEvidence")}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {tListeningResult("yourAnswer")}:{" "}
                <span className="font-medium text-foreground">{normalizedUser || tListeningResult("noAnswer")}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {tListeningResult("correctAnswer")}:{" "}
                <span className="font-medium text-emerald-700 dark:text-emerald-200">{correctAnswer || tListeningResult("notAvailable")}</span>
              </p>
              {expandedReviewQuestions.has(questionId) && answerMeta?.explanation ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {tListeningResult("explain")}:{" "}
                  <span className="text-foreground/85">{answerMeta.explanation}</span>
                </p>
              ) : null}
            </div>
          );
        })}
      </Card>
    );
  };
  const showAnalyticsReviewLayout = reviewMode;

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
            <Link
              href={`/${locale}`}
              aria-label="Go to home"
              className="flex min-w-0 items-center gap-1.5 sm:gap-3 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
            >
              <BrandIcon size={isSmallLandscape ? 28 : 32} className={cn(isSmallLandscape ? "rounded-lg" : "")} />
              <p
                className={cn(
                  "min-w-0 text-sm font-semibold sm:text-lg leading-tight",
                  isSmallLandscape && "text-xs",
                  "max-[420px]:text-[11px]",
                )}
              >
                EnglishLabs
              </p>
            </Link>
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
            {reviewMode ? null : (
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

      <audio
        ref={audioRef}
        preload="metadata"
        className="hidden"
        onPlay={() => {
          bufferingPauseRef.current = false;
          setAudioPlaying(true);
        }}
        onPause={() => {
          if (!bufferingPauseRef.current) {
            audioShouldPlayRef.current = false;
          }
          setAudioPlaying(false);
        }}
        onLoadedMetadata={(event) => {
          const media = event.currentTarget;
          const duration =
            Number.isFinite(media.duration) && media.duration > 0
              ? media.duration
              : Math.max(0, audioSection.audioMeta.durationSec);
          setAudioDurationSec(duration);
          const progress = duration > 0 ? (media.currentTime / duration) * 100 : 0;
          setAudioProgress(progress);
          setAudioCurrentSec(media.currentTime || 0);
          updateBufferedProgress();
        }}
        onTimeUpdate={(event) => {
          const media = event.currentTarget;
          const duration =
            Number.isFinite(media.duration) && media.duration > 0
              ? media.duration
              : Math.max(0, audioSection.audioMeta.durationSec);
          const current = media.currentTime || 0;
          setAudioCurrentSec(current);
          const progress = duration > 0 ? (current / duration) * 100 : 0;
          setAudioProgress(progress);
          updateBufferedProgress();
          if (!media.paused && duration > 0) {
            const bufferedEnd = getBufferedEndForCurrentTime(media);
            if (current > 0 && bufferedEnd > 0 && current >= bufferedEnd - 0.12) {
              bufferingPauseRef.current = true;
              media.pause();
            }
          }
        }}
        onProgress={() => {
          updateBufferedProgress();
          const media = audioRef.current;
          if (!media) return;
          const bufferedEnd = getBufferedEndForCurrentTime(media);
          const current = media.currentTime || 0;
          if (audioShouldPlayRef.current && bufferingPauseRef.current && bufferedEnd - current > 0.45) {
            bufferingPauseRef.current = false;
            void media.play().catch(() => {
              setAudioPlaying(false);
            });
          }
        }}
        onCanPlay={updateBufferedProgress}
        onCanPlayThrough={() => {
          setAudioBufferedProgress(100);
          const media = audioRef.current;
          if (!media) return;
          if (audioShouldPlayRef.current && bufferingPauseRef.current) {
            bufferingPauseRef.current = false;
            void media.play().catch(() => {
              setAudioPlaying(false);
            });
          }
        }}
        onEnded={() => {
          bufferingPauseRef.current = false;
          setAudioProgress(100);
          setAudioBufferedProgress(100);

          // Real mode: parts must play sequentially. Advancing UI parts should not start audio early,
          // but when the current audio finishes we start the next part immediately.
          if (isRealMode && !reviewMode) {
            const order: Array<ListeningSectionFull["id"]> = ["s1", "s2", "s3", "s4"];
            const currentIndex = order.indexOf(audioSectionId);
            const nextSectionId =
              currentIndex >= 0 && currentIndex < order.length - 1
                ? order[currentIndex + 1]
                : null;

            if (nextSectionId) {
              const nextNumbers = sectionQuestionNumbers.get(nextSectionId) ?? [];
              const first = nextNumbers[0] ?? 1;
              suppressAudioAutoPlayRef.current = false;
              audioShouldPlayRef.current = true;
              setActiveSectionId(nextSectionId);
              setAudioSectionId(nextSectionId);
              setActiveQuestionNumber(first);
              setAudioPlaying(true);
              return;
            }
          }

          audioShouldPlayRef.current = false;
          setAudioPlaying(false);
        }}
        onError={() => {
          audioShouldPlayRef.current = false;
          bufferingPauseRef.current = false;
          setAudioPlaying(false);
          setAudioBufferedProgress(0);
        }}
      />

      {!reviewMode ? (
      <div
        className={cn(
          "border-b border-border bg-background/95 px-3 py-2 backdrop-blur sm:px-4 lg:px-8",
          isSmallLandscape && "py-1.5 px-2",
        )}
      >
        <div className="grid w-full min-w-0 max-w-full grid-cols-[36px_minmax(0,1fr)] items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              disabled={isRealMode || !audioSectionAudioUrl}
              className={cn(
                "h-9 w-9 rounded-full shrink-0",
                isSmallLandscape && "h-8 w-8",
                (isRealMode || !audioSectionAudioUrl) && "cursor-not-allowed opacity-60",
              )}
              onClick={() => {
                toggleAudioPlayback();
              }}
              aria-label={
                isRealMode
                  ? realModeLockedAudioLabel
                  : !audioSectionAudioUrl
                    ? (t.has("audioUnavailable") ? t("audioUnavailable") : "Audio unavailable")
                    : audioPlaying
                      ? t("pauseAudio")
                      : t("playAudio")
              }
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
                {audioSection.audioMeta.nowPlayingLabel} -{" "}
                {audioSection.audioMeta.currentTrackTitle}
              </p>
              <p className={cn("test-muted-copy shrink-0", isSmallLandscape && "text-[10px]")}>
                {`${formatTime(Math.round(audioCurrentSec))} / ${formatTime(effectiveAudioDurationSec)}`}
              </p>
            </div>
            {realModeStarting ? (
              <p className="mb-1 rounded-lg border border-blue-400/40 bg-blue-500/10 px-2 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-200">
                {realModeCountdownLabel}
              </p>
            ) : null}
            <div className={cn("grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2", isSmallLandscape && "gap-1")}>
              <div className="min-w-0">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={audioProgress}
                  disabled={isRealMode || !audioSectionAudioUrl}
                  onChange={(e) => {
                    if (isRealMode || !audioSectionAudioUrl) return;
                    const nextProgress = Number(e.target.value);
                    const media = audioRef.current;
                    if (media) {
                      const duration =
                        Number.isFinite(media.duration) && media.duration > 0
                          ? media.duration
                          : effectiveAudioDurationSec;
                      if (duration > 0) {
                        media.currentTime = (nextProgress / 100) * duration;
                      }
                    }
                    setAudioProgress(nextProgress);
                  }}
                  aria-label={isRealMode ? realModeProgressLockedLabel : t("audioProgress")}
                  className={cn(
                    "h-1.5 w-full min-w-0 cursor-pointer appearance-none rounded-full outline-none",
                    "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full",
                    "[&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/70 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow",
                    "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent",
                    "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white/70 [&::-moz-range-thumb]:bg-blue-600",
                    (isRealMode || !audioSectionAudioUrl) && "cursor-not-allowed opacity-60"
                  )}
                  style={audioProgressTrackStyle}
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{t.has("downloaded") ? t("downloaded") : "Buffered"}</span>
                  <span>{Math.round(safeBufferedProgress)}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-lg border border-border/70 bg-background/55 p-1 shadow-sm">
                  <div className="flex items-center gap-1">
                    {[1, 1.25, 1.5, 1.75, 2].map((speed) => {
                      const isActive = audioSpeed === speed;
                      return (
                        <button
                          key={`speed-${speed}`}
                          type="button"
                          disabled={isRealMode}
                          onClick={() => {
                            if (isRealMode) return;
                            setAudioSpeed(speed as 1 | 1.25 | 1.5 | 1.75 | 2);
                          }}
                          className={cn(
                            "h-7 rounded-md border px-2 text-[10px] font-semibold leading-none transition-colors",
                            isActive
                              ? "border-primary/45 bg-primary/15 text-primary shadow-sm"
                              : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-background/70",
                            isRealMode && "cursor-not-allowed opacity-60"
                          )}
                        >
                          {speed}x
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex w-26 items-center gap-1.5">
                  <Volume2 className="size-3.5 shrink-0 text-muted-foreground" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={audioVolume}
                    disabled={isRealMode}
                    onChange={(e) => setAudioVolume(Number(e.target.value))}
                    aria-label={t("audioVolume")}
                    className={cn(
                      "h-1.5 w-full min-w-0 cursor-pointer appearance-none rounded-full outline-none",
                      "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full",
                      "[&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/70 [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:shadow",
                      "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent",
                      "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white/70 [&::-moz-range-thumb]:bg-emerald-600",
                      isRealMode && "cursor-not-allowed opacity-60"
                    )}
                    style={volumeTrackStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      <main className="test-scaleable grid min-h-0 min-w-0 w-full max-w-full flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] gap-3 px-2 py-2 sm:px-3 sm:py-3 lg:gap-4 lg:px-5 lg:py-4">
        {showAnalyticsReviewLayout && reviewMode ? (
          <section className="min-h-0 min-w-0 w-full max-w-full flex h-full flex-col gap-3">
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
              className="grid min-h-0 min-w-0 w-full max-w-full flex-1 gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] xl:items-stretch"
            >
              <div className={cn("min-h-0 min-w-0", isCompact && reviewMobilePanel !== "transcript" && "hidden xl:block")}>
                <ListeningTranscriptReviewPanel
                  sections={reviewSections}
                  activeSectionId={resolvedActiveSectionId}
                  highlightedQuestionId={highlightedEvidenceQuestionId}
                  className="h-full xl:h-full"
                  onSectionChange={(sectionId) => setActiveSectionId(sectionId as "s1" | "s2" | "s3" | "s4")}
                  onGoToQuestion={handleGoToQuestionFromReview}
                />
              </div>

              <div className={cn("min-h-0 min-w-0", isCompact && reviewMobilePanel !== "questions" && "hidden xl:block")}>
                <ListeningQuestionAnalysisPanel
                  questions={reviewQuestions}
                  answers={reviewAnswersByQuestionId}
                  answerMetaByQuestionId={reviewAnswerMetaByQuestionId}
                  blocks={test.sections.find((section) => section.id === resolvedActiveSectionId)?.blocks ?? []}
                  grading={grading}
                  expanded={expandedReviewQuestions}
                  showTopQuestionNavigator={false}
                  className="h-full xl:h-full"
                  scrollResetKey={resolvedActiveSectionId}
                  scrollToQuestionId={reviewStartQuestionId ?? undefined}
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
                  <div key={`${activeSection.id}-${block.type}-${index}`} className="space-y-2">
                    {deriveBlockRangeLabel(block) ? (
                      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        {deriveBlockRangeLabel(block)}
                      </p>
                    ) : null}
                    {deriveBlockInstruction(block) && block.type !== "matching" ? (
                      <p className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm wrap-break-word">
                        <FormattedInstructionText text={deriveBlockInstruction(block)} />
                      </p>
                    ) : null}
                    {renderBlock(block)}
                    {renderBlockReviewSummary(block)}
                  </div>
                ))}
              </Highlightable>
            </div>
          </div>
        </section>
        )}
      </main>

      <>
      <div className="border-t border-border/75 bg-background/95 px-3 backdrop-blur sm:px-4 lg:px-5">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 py-1.5">
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

          <div className="mt-1.5 min-w-0 overflow-x-auto [scrollbar-width:thin]">
            <div className="inline-grid min-w-max grid-flow-col auto-cols-[minmax(220px,1fr)] gap-1.5 pr-1 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4 lg:min-w-0 lg:w-full">
              {sectionPaletteSections.map((section) => {
                const isActiveSection = section.sectionId === activeSectionId;
                return (
                  <div
                    key={`palette-${section.sectionId}`}
                    className={cn(
                      "rounded-xl border p-1.5 transition-colors",
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
                    {isActiveSection ? (
                      <div className="flex min-w-0 items-center gap-1.5">
                        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:thin]">
                          <div className="flex w-max gap-1 pr-1">
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
                                    "relative h-5 min-w-5 rounded-md border px-1 text-[10px] font-semibold shadow-none",
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
                        </div>
                        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                          {section.answered}/{section.numbers.length}
                        </span>
                      </div>
                    ) : null}
                    {!isActiveSection ? (
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                        onClick={() => handleSectionChange(section.sectionId)}
                      >
                        <span className="text-xs font-semibold sm:text-sm">
                          {t("sectionTab", { index: section.index })}
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
                {(activeSectionPaletteSection?.numbers ?? []).map((number) => {
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
      </>

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
                : `Interruptions - fullscreen: ${realModeInterruptionCount.fullscreen}, tab/window: ${realModeInterruptionCount.visibility}`}
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
              <Button variant="ghost" onClick={() => setFinishOpen(false)} disabled={isSubmittingResult}>{t("cancel")}</Button>
              <Button onClick={finishTest} disabled={isSubmittingResult}>{t("confirmFinish")}</Button>
            </div>
          </Card>
        </div>
      ) : null}

      {reviewMode ? (
        <div className="fixed bottom-16 right-4 z-50 sm:bottom-20 sm:right-5">
          <Button asChild className="h-12 rounded-2xl bg-blue-600 px-6 text-base font-semibold text-white shadow-lg hover:bg-blue-600/90">
            <Link href={`/${locale}/listening/${test.id}/result?attempt=${backendAttemptId ?? attemptId}`}>
              Analyze
            </Link>
          </Button>
        </div>
      ) : null}

      <LoadingModal
        open={isSubmittingResult}
        message={t.has("submittingTest") ? t("submittingTest") : "Submitting your test and loading review..."}
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
