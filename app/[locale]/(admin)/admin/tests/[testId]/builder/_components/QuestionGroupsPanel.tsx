"use client";

import {useMemo, useState} from "react";
import {Plus} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Switch} from "@/components/ui/switch";
import type {BuilderMode, BuilderStructureItem, QuestionGroup, QuestionType, TestModule} from "@/data/admin-test-builder";
import {QUESTION_TYPE_OPTIONS_BY_MODULE, getStructureRange} from "@/data/admin-test-builder";
import {BoldTextarea} from "./BoldTextarea";

import {QuestionGroupCard} from "./QuestionGroupCard";

type QuestionGroupsPanelProps = {
  mode: BuilderMode;
  module: TestModule;
  activeStructure: BuilderStructureItem;
  flexibleQuestionCount?: boolean;
  groups: QuestionGroup[];
  collapsedGroups: Record<string, boolean>;
  selectedQuestionId: string | null;
  onCreateGroup: (type: QuestionType, from: number, to: number, instructions: string, groupContent?: unknown) => void;
  onEditGroup: (groupId: string, type: QuestionType, from: number, to: number, instructions: string, groupContent?: unknown) => void;
  onDuplicateGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleGroupCollapse: (groupId: string) => void;
  onAddQuestion: (groupId: string) => void;
  onOpenQuestionEditor: (groupId: string, questionId: string) => void;
  onSelectQuestion: (groupId: string, questionId: string) => void;
  onMoveQuestion: (groupId: string, questionId: string, direction: "up" | "down") => void;
  onDuplicateQuestion: (groupId: string, questionId: string) => void;
  onDeleteQuestion: (groupId: string, questionId: string) => void;
};

type GroupEditorState = {
  open: boolean;
  mode: "create" | "edit";
  groupId: string | null;
  type: QuestionType;
  from: number;
  to: number;
  instructions: string;
  summaryText: string;
  completionTemplateText: string;
  mcqMode: "single";
  mcqOptions: string;
  summaryWordBankEnabled: boolean;
  wordBank: string;
  headings: string;
  choices: string;
  tableColumns: string;
  tableRows: string;
};

type SlotRange = {
  from: number;
  to: number;
};

function toMcqKey(index: number) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

function normalizeMcqOptionKeys(raw: string) {
  const rows = raw
    .split("\n")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)
    .map((value) => value[0] ?? "")
    .filter((value) => /^[A-Z]$/.test(value));

  const unique = [...new Set(rows)];
  const desiredCount = unique.length || 4;
  return Array.from({length: desiredCount}, (_, idx) => toMcqKey(idx));
}

function collectOccupiedNumbers(groups: QuestionGroup[], excludeGroupId?: string) {
  const occupied = new Set<number>();
  for (const group of groups) {
    if (excludeGroupId && group.id === excludeGroupId) continue;
    for (const question of group.questions) {
      occupied.add(question.number);
    }
  }
  return occupied;
}

function findContiguousFreeRange(range: SlotRange, occupied: Set<number>, length: number) {
  if (length <= 0) return null;

  for (let start = range.from; start + length - 1 <= range.to; start += 1) {
    let hasCollision = false;
    for (let number = start; number < start + length; number += 1) {
      if (occupied.has(number)) {
        hasCollision = true;
        break;
      }
    }

    if (!hasCollision) {
      return {from: start, to: start + length - 1};
    }
  }

  return null;
}

function getGroupSpan(group: QuestionGroup) {
  const numbers = [...new Set(group.questions.map((question) => question.number))].sort((left, right) => left - right);
  if (!numbers.length) {
    return {from: group.from, to: group.to, length: Math.max(group.to - group.from + 1, 1)};
  }
  const from = numbers[0];
  const to = numbers[numbers.length - 1];
  return {from, to, length: numbers.length};
}

function buildTemplateText(from: number, to: number) {
  const lines: string[] = [];
  for (let number = from; number <= to; number += 1) {
    lines.push(`Item ${number}: {${number}}`);
  }
  return lines.join("\n");
}

function toLineJoinedValues(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\n") : "";
}

function parseWordBankOptions(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getStoredWordBank(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function isPlaceholderWordBank(values: string[]) {
  return values.length === 1 && /^word\s*1$/i.test(values[0] ?? "");
}

function toTableRowsText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((row) => {
      if (!Array.isArray(row)) return "";
      return row.map((cell) => String(cell ?? "").trim()).join(" | ");
    })
    .filter(Boolean)
    .join("\n");
}

function inferRangeTokenFromChoices(values: string[]) {
  const cleaned = values
    .map((value) => parseInstructionChoiceKey(value) ?? value.trim())
    .filter(Boolean);
  if (cleaned.length < 2) return null;

  const letterOnly = cleaned.every((value) => /^[A-Z]$/.test(value));
  if (letterOnly) {
    const codes = cleaned.map((value) => value.charCodeAt(0));
    const sequential = codes.every((code, idx) => (idx === 0 ? true : code === codes[idx - 1] + 1));
    if (!sequential) return null;
    return `${cleaned[0]}-${cleaned[cleaned.length - 1]}`;
  }

  const numberOnly = cleaned.every((value) => /^\d{1,2}$/.test(value));
  if (numberOnly) {
    const nums = cleaned.map((value) => Number(value));
    const sequential = nums.every((num, idx) => (idx === 0 ? true : num === nums[idx - 1] + 1));
    if (!sequential) return null;
    return `${cleaned[0]}-${cleaned[cleaned.length - 1]}`;
  }

  return null;
}

function hasRangeInText(text: string) {
  return /\b([A-Z]|\d{1,2})\s*[-–—]\s*([A-Z]|\d{1,2})\b/.test(text);
}

function parseInstructionChoiceKey(value: string) {
  const trimmed = value.trim();
  const prefixed = trimmed.match(/^\s*(?:[-*]\s*)?(?:\*\*)?([A-Z])(?:\*\*)?\s*[\)\].:\-]\s+\S/i);
  if (prefixed) return prefixed[1].toUpperCase();

  const paragraph = trimmed.match(/^\s*paragraph\s+([A-Z])(?:\s*[\)\].:\-]\s+\S)?/i);
  if (paragraph) return paragraph[1].toUpperCase();

  return /^[A-Z]$/.test(trimmed) ? trimmed : null;
}

function extractChoiceKeysFromInstructionText(text: string) {
  const source = String(text ?? "");
  const keys: string[] = [];
  const seen = new Set<string>();
  const lineRegex = /^\s*(?:[-*]\s*)?(?:\*\*)?([A-Z])(?:\*\*)?\s*[\)\].:\-]\s+\S.+$/gm;
  let match: RegExpExecArray | null;

  while ((match = lineRegex.exec(source))) {
    const key = String(match[1] ?? "").trim().toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }

  return keys.length >= 2 ? keys : [];
}

function extractChoicesFromInstructionText(text: string) {
  const source = String(text ?? "");
  const choices: string[] = [];
  const seen = new Set<string>();
  const lineRegex = /^\s*(?:[-*]\s*)?((?:\*\*)?[A-Z](?:\*\*)?\s*[\)\].:\-]\s+\S.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = lineRegex.exec(source))) {
    const choice = String(match[1] ?? "").replace(/\*\*/g, "").trim();
    const key = parseInstructionChoiceKey(choice);
    if (!choice || !key || seen.has(key)) continue;
    seen.add(key);
    choices.push(choice);
  }

  return choices;
}

function hasChoiceListInText(text: string, values: string[]) {
  const expectedKeys = values
    .map((value) => parseInstructionChoiceKey(value))
    .filter((key): key is string => Boolean(key));
  if (expectedKeys.length < 2) return false;
  const existingKeys = new Set(extractChoiceKeysFromInstructionText(text));
  return expectedKeys.every((key) => existingKeys.has(key));
}

function buildInstructionChoiceList(values: string[]) {
  return values
    .map((value, index) => {
      const trimmed = value.trim();
      if (!trimmed) return "";

      const key = parseInstructionChoiceKey(trimmed) ?? toMcqKey(index);
      if (trimmed.toUpperCase() === key) return key;

      const withoutDecoratedKey = trimmed
        .replace(/^\s*(?:[-*]\s*)?(?:\*\*)?[A-Z](?:\*\*)?\s*[\)\].:\-]\s*/i, "")
        .trim();
      return withoutDecoratedKey ? `${key}. ${withoutDecoratedKey}` : key;
    })
    .filter(Boolean)
    .join("\n");
}

function generateRangeOptions(startRaw: string, endRaw: string): string[] {
  const start = startRaw.trim();
  const end = endRaw.trim();
  if (!start || !end) return [];

  if (/^\d+$/.test(start) && /^\d+$/.test(end)) {
    const from = Number(start);
    const to = Number(end);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return [];
    const step = from <= to ? 1 : -1;
    const out: string[] = [];
    for (let n = from; step > 0 ? n <= to : n >= to; n += step) out.push(String(n));
    return out;
  }

  if (/^[A-Z]$/.test(start) && /^[A-Z]$/.test(end)) {
    const from = start.charCodeAt(0);
    const to = end.charCodeAt(0);
    const step = from <= to ? 1 : -1;
    const out: string[] = [];
    for (let c = from; step > 0 ? c <= to : c >= to; c += step) out.push(String.fromCharCode(c));
    return out;
  }

  return [];
}

function extractRangeFromInstructionText(text: string) {
  const source = String(text ?? "");
  if (!source) return [];
  const explicitKeys = extractChoiceKeysFromInstructionText(source);
  if (explicitKeys.length) return explicitKeys;
  const match = source.match(/\b([A-Z]|\d{1,2})\s*[-–—]\s*([A-Z]|\d{1,2})\b/);
  if (!match) return [];
  return generateRangeOptions(match[1] ?? "", match[2] ?? "");
}

export function QuestionGroupsPanel({
  mode,
  module,
  activeStructure,
  flexibleQuestionCount = false,
  groups,
  collapsedGroups,
  selectedQuestionId,
  onCreateGroup,
  onEditGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onToggleGroupCollapse,
  onAddQuestion,
  onOpenQuestionEditor,
  onSelectQuestion,
  onMoveQuestion,
  onDuplicateQuestion,
  onDeleteQuestion
}: QuestionGroupsPanelProps) {
  const t = useTranslations("adminTestBuilder");
  const range = useMemo(() => getStructureRange(activeStructure), [activeStructure]);
  const availableQuestionTypes = QUESTION_TYPE_OPTIONS_BY_MODULE[module];
  const defaultType = availableQuestionTypes[0]?.value ?? "multiple_choice";
  const [editor, setEditor] = useState<GroupEditorState>({
    open: false,
    mode: "create",
    groupId: null,
    type: defaultType,
    from: range.from,
    to: Math.min(range.from + 2, range.to),
    instructions: "",
    summaryText: "",
    completionTemplateText: "",
    mcqMode: "single",
    mcqOptions: "",
    summaryWordBankEnabled: false,
    wordBank: "",
    headings: "",
    choices: "",
    tableColumns: "",
    tableRows: ""
  });

  const assignedCount = useMemo(() => {
    const assigned = new Set<number>();
    for (const group of groups) {
      for (const question of group.questions) {
        if (question.number >= range.from && question.number <= range.to) {
          assigned.add(question.number);
        }
      }
    }
    return assigned.size;
  }, [groups, range.from, range.to]);
  const requiredCount = flexibleQuestionCount ? assignedCount : range.to - range.from + 1;

  const occupiedForEditor = useMemo(() => {
    const excludeId = editor.mode === "edit" ? editor.groupId ?? undefined : undefined;
    return collectOccupiedNumbers(groups, excludeId);
  }, [editor.groupId, editor.mode, groups]);

  const hasRangeOverlap = useMemo(() => {
    for (let number = editor.from; number <= editor.to; number += 1) {
      if (occupiedForEditor.has(number)) {
        return true;
      }
    }
    return false;
  }, [editor.from, editor.to, occupiedForEditor]);

  const hasRangeError = editor.from < range.from || editor.to > range.to || editor.from > editor.to;
  const hasSummaryWordBankError =
    editor.type === "summary_completion" &&
    editor.summaryWordBankEnabled &&
    parseWordBankOptions(editor.wordBank).length === 0;
  const hasError = hasRangeError || hasRangeOverlap || hasSummaryWordBankError;

  const groupActionsById = useMemo(() => {
    const occupiedAll = collectOccupiedNumbers(groups);
    const actions: Record<string, {canAddQuestion: boolean; canDuplicateQuestion: boolean; canDuplicateGroup: boolean}> = {};

    for (const group of groups) {
      const span = getGroupSpan(group);
      const occupiedByOthers = collectOccupiedNumbers(groups, group.id);
      const canGrowForward = span.to < range.to && !occupiedByOthers.has(span.to + 1);
      const canGrowBackward = span.from > range.from && !occupiedByOthers.has(span.from - 1);
      const canGrow = canGrowForward || canGrowBackward;
      const canDuplicateGroup = Boolean(findContiguousFreeRange(range, occupiedAll, span.length));

      actions[group.id] = {
        canAddQuestion: canGrow,
        canDuplicateQuestion: canGrow,
        canDuplicateGroup
      };
    }

    return actions;
  }, [groups, range]);

  const openCreateEditor = () => {
    const occupied = collectOccupiedNumbers(groups);
    const firstFree = findContiguousFreeRange(range, occupied, 1) ?? {from: range.from, to: range.from};
    const defaultTo = Math.min(firstFree.from + 2, range.to);
    const preferredRange = findContiguousFreeRange(range, occupied, defaultTo - firstFree.from + 1) ?? firstFree;

    setEditor({
      open: true,
      mode: "create",
      groupId: null,
      type: defaultType,
      from: preferredRange.from,
      to: preferredRange.to,
      instructions: "",
      summaryText: "",
      completionTemplateText: "",
      mcqMode: "single",
      mcqOptions: "A\nB\nC\nD",
      summaryWordBankEnabled: false,
      wordBank: "",
      headings: "",
      choices: "",
      tableColumns: "",
      tableRows: ""
    });
  };

  const openEditEditor = (group: QuestionGroup) => {
    const derivedChoicesFromInstructions =
      group.type === "matching_information" && module === "reading"
        ? (extractChoicesFromInstructionText(group.instructions ?? "").join("\n") || extractRangeFromInstructionText(group.instructions ?? "").join("\n"))
        : "";
    const storedWordBank = getStoredWordBank((group.groupContentJson as any)?.word_bank);
    const hasStoredWordBank = storedWordBank.length > 0 && !isPlaceholderWordBank(storedWordBank);
    const isWordBankExplicitlyEnabled =
      (group.groupContentJson as any)?.word_bank_enabled === true
      || (group.groupContentJson as any)?.summary_word_bank_enabled === true;

    setEditor({
      open: true,
      mode: "edit",
      groupId: group.id,
      type: group.type,
      from: group.from,
      to: group.to,
      instructions: group.instructions ?? "",
      summaryText: (group.groupContentJson as any)?.summary_text ?? "",
      completionTemplateText: (group.groupContentJson as any)?.template_text ?? "",
      mcqMode: "single",
      mcqOptions:
        (() => {
          const stored = Array.isArray((group.groupContentJson as any)?.options)
            ? ((group.groupContentJson as any).options as Array<{text?: string; label?: string; key?: string}>)
                .map((item, index) => (item?.key ?? item?.text ?? item?.label ?? toMcqKey(index)))
                .map((value) => String(value ?? "").trim().toUpperCase())
                .filter((value) => /^[A-Z]$/.test(value))
            : [];
          const inferredCount =
            Number((group.questions[0] as any)?.options?.length ?? 0) || stored.length || 4;
          const keys = stored.length ? stored : Array.from({length: inferredCount}, (_, idx) => toMcqKey(idx));
          return keys.join("\n");
        })(),
      summaryWordBankEnabled: isWordBankExplicitlyEnabled,
      wordBank: isWordBankExplicitlyEnabled && hasStoredWordBank ? storedWordBank.join("\n") : "",
      headings: (group.questions[0] as any)?.headings?.join("\n") ?? toLineJoinedValues((group.groupContentJson as any)?.headings),
      choices:
        ((group.questions[0] as any)?.choices?.join("\n") || (
          Array.isArray((group.groupContentJson as any)?.choices)
            ? ((group.groupContentJson as any).choices as string[]).join("\n")
            : Array.isArray((group.groupContentJson as any)?.options)
              ? ((group.groupContentJson as any).options as Array<{text?: string; label?: string; key?: string}>)
                  .map((item) => item?.text ?? item?.label ?? item?.key ?? "")
                  .filter(Boolean)
                  .join("\n")
              : ""
        ) || derivedChoicesFromInstructions),
      tableColumns: toLineJoinedValues((group.groupContentJson as any)?.columns),
      tableRows: toTableRowsText((group.groupContentJson as any)?.rows)
    });
  };

  const submitEditor = () => {
    if (hasError) {
      return;
    }

    const parsedHeadings = editor.headings.split("\n").map((value) => value.trim()).filter(Boolean);
    const parsedChoices = editor.choices.split("\n").map((value) => value.trim()).filter(Boolean);
    const parsedWordBank = parseWordBankOptions(editor.wordBank);
    const parsedTemplateText = editor.completionTemplateText.trim();
    const parsedMcqKeys = normalizeMcqOptionKeys(editor.mcqOptions);
    const parsedTableColumns = editor.tableColumns.split("\n").map((value) => value.trim()).filter(Boolean);
    const parsedTableRows = editor.tableRows
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((row) => row.split("|").map((cell) => cell.trim()));

    let nextInstructions = editor.instructions;
    if (editor.type === "matching_information" && module === "reading") {
      // Backend docs: MATCH_PARA_INFO group_content_json must be null.
      // Persist admin-entered paragraph choices by embedding them into instructions
      // so the student UI can derive the matrix columns after a reload.
      const inferredRange = inferRangeTokenFromChoices(parsedChoices);
      const hasChoiceLabels = parsedChoices.some((choice) => {
        const key = parseInstructionChoiceKey(choice);
        return Boolean(key) && choice.trim().toUpperCase() !== key;
      });
      const shouldEmbedChoiceList = hasChoiceLabels && parsedChoices.length >= 2 && !hasChoiceListInText(nextInstructions, parsedChoices);
      if (shouldEmbedChoiceList) {
        const choiceList = buildInstructionChoiceList(parsedChoices);
        if (choiceList) {
          nextInstructions = `${nextInstructions.trim()}\n\n${choiceList}`.trim();
        }
      } else if (inferredRange && !hasRangeInText(nextInstructions)) {
        nextInstructions = `${nextInstructions.trim()}\n\nThe Reading Passage has paragraphs ${inferredRange}.`.trim();
      }
    }

    const groupContent =
      editor.type === "multiple_choice"
        ? {
            mcq_mode: "single",
            // MCQ option keys are stored for UI purposes only (backend group_content_json for MCQ is null).
            // We intentionally keep values as single letters so each question can define its own prompts.
            options: parsedMcqKeys.map((key) => ({key, text: key}))
          }
        : editor.type === "summary_completion"
        ? {
            summary_text: editor.summaryText,
            word_bank_enabled: editor.summaryWordBankEnabled,
            word_bank: editor.summaryWordBankEnabled ? parsedWordBank : null
          }
        : editor.type === "matching_headings"
          ? {headings: parsedHeadings}
          : (editor.type === "form_completion" || editor.type === "note_completion")
            ? {template_text: parsedTemplateText || buildTemplateText(editor.from, editor.to)}
          : editor.type === "table_completion"
            ? {
                columns: parsedTableColumns.length ? parsedTableColumns : ["Field", "Value"],
                rows: parsedTableRows.length
                  ? parsedTableRows
                  : Array.from({length: Math.max(1, editor.to - editor.from + 1)}, (_, index) => [
                      `Item ${editor.from + index}`,
                      `{${editor.from + index}}`
                    ])
              }
          : (
                editor.type === "matching_information"
                || editor.type === "matching_features"
                || editor.type === "selecting_from_a_list"
                || editor.type === "map"
              )
            ? {choices: parsedChoices}
            : undefined;

    if (editor.mode === "create") {
      onCreateGroup(editor.type, editor.from, editor.to, nextInstructions, groupContent);
    } else if (editor.groupId) {
      onEditGroup(editor.groupId, editor.type, editor.from, editor.to, nextInstructions, groupContent);
    }

    setEditor((current) => ({...current, open: false}));
  };

  return (
    <Card className="min-h-[660px] rounded-3xl border-border/70 bg-card/70 py-0">
      <CardHeader className="border-b border-border/70 pt-5 pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm tracking-[0.14em] text-muted-foreground uppercase">{t("groups.title")}</CardTitle>
          <Badge className="rounded-md border border-border/70 bg-muted/35 px-2 py-0.5 text-[10px] tracking-wide uppercase">
            {flexibleQuestionCount
              ? t("groups.totalCountFlexible", {assigned: assignedCount})
              : t("groups.totalCountWithLimit", {assigned: assignedCount, required: requiredCount})}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4 pb-5">
        {groups.map((group) => (
          <QuestionGroupCard
            key={group.id}
            group={group}
            mode={mode}
            collapsed={Boolean(collapsedGroups[group.id])}
            selectedQuestionId={selectedQuestionId}
            canDuplicateGroup={groupActionsById[group.id]?.canDuplicateGroup ?? false}
            canAddQuestion={groupActionsById[group.id]?.canAddQuestion ?? false}
            canDuplicateQuestion={groupActionsById[group.id]?.canDuplicateQuestion ?? false}
            onToggleCollapse={() => onToggleGroupCollapse(group.id)}
            onEditGroup={() => openEditEditor(group)}
            onDuplicateGroup={() => onDuplicateGroup(group.id)}
            onDeleteGroup={() => onDeleteGroup(group.id)}
            onAddQuestion={() => onAddQuestion(group.id)}
            onOpenQuestionEditor={(questionId) => onOpenQuestionEditor(group.id, questionId)}
            onSelectQuestion={(questionId) => onSelectQuestion(group.id, questionId)}
            onMoveQuestion={(questionId, direction) => onMoveQuestion(group.id, questionId, direction)}
            onDuplicateQuestion={(questionId) => onDuplicateQuestion(group.id, questionId)}
            onDeleteQuestion={(questionId) => onDeleteQuestion(group.id, questionId)}
          />
        ))}

        {mode === "editor" ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl border-dashed border-border/80 bg-background/35"
            onClick={openCreateEditor}
            disabled={!flexibleQuestionCount && assignedCount >= requiredCount}
          >
            <Plus className="size-4" />
            {t("groups.addGroup")}
          </Button>
        ) : null}
      </CardContent>

      <Sheet open={editor.open} onOpenChange={(open) => setEditor((current) => ({...current, open}))}>
        <SheetContent side="right" className="max-h-screen w-full max-w-[420px] overflow-y-auto overscroll-y-contain border-l border-border/70 bg-background/95">
          <SheetHeader>
            <SheetTitle>{editor.mode === "create" ? t("groups.createTitle") : t("groups.editTitle")}</SheetTitle>
            <SheetDescription>{t("groups.editorDescription", {from: range.from, to: range.to})}</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("groups.fields.type")}</label>
              <Select
                value={editor.type}
                onValueChange={(value) => setEditor((current) => ({...current, type: value as QuestionType}))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableQuestionTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("groups.fields.from")}</label>
                <Input
                  type="number"
                  min={range.from}
                  max={range.to}
                  value={editor.from}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      from: Number(event.target.value)
                    }))
                  }
                  className="h-10 rounded-xl border-border/70 bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("groups.fields.to")}</label>
                <Input
                  type="number"
                  min={range.from}
                  max={range.to}
                  value={editor.to}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      to: Number(event.target.value)
                    }))
                  }
                  className="h-10 rounded-xl border-border/70 bg-background/50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("groups.fields.instructions")}</label>
              <BoldTextarea
                value={editor.instructions}
                onChange={(nextValue) =>
                  setEditor((current) => ({
                    ...current,
                    instructions: nextValue
                  }))
                }
                placeholder={t("groups.fields.instructionsPlaceholder")}
                className="min-h-24 w-full resize-y rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
              />
            </div>

            {editor.type === "summary_completion" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("groups.fields.summaryText")}</label>
                  <BoldTextarea
                    value={editor.summaryText}
                    onChange={(nextValue) =>
                      setEditor((current) => ({
                        ...current,
                        summaryText: nextValue
                      }))
                    }
                    placeholder={t("groups.fields.summaryTextPlaceholder")}
                    className="min-h-32 w-full resize-y rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
                  />
                  <p className="text-[10px] text-muted-foreground">{t("groups.fields.summaryTextHint")}</p>
                </div>
                {module === "reading" ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <label htmlFor="summary-word-bank-switch" className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                          {t("groups.fields.wordBank")}
                        </label>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">{t("groups.fields.wordBankHint")}</p>
                      </div>
                      <Switch
                        id="summary-word-bank-switch"
                        checked={editor.summaryWordBankEnabled}
                        onCheckedChange={(checked) => setEditor((current) => ({...current, summaryWordBankEnabled: checked}))}
                        aria-label={t("groups.fields.wordBank")}
                      />
                    </div>

                    {editor.summaryWordBankEnabled ? (
                      <div className="mt-3 space-y-1.5">
                        <BoldTextarea
                          value={editor.wordBank}
                          onChange={(nextValue) => setEditor((current) => ({...current, wordBank: nextValue}))}
                          placeholder={t("groups.fields.wordBankPlaceholder")}
                          className="min-h-28 w-full resize-y rounded-xl border border-border/70 bg-background/55 px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
                        />
                        <p className="text-[10px] text-muted-foreground">{t("groups.fields.wordBankHint")}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}

            {editor.type === "multiple_choice" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Multiple Choice</label>
                  <p className="text-[11px] text-muted-foreground">
                    Multiple Choice is always single-answer. For “Choose TWO letters”, use “Selecting from a List”.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">MCQ Option Keys</label>
                  <BoldTextarea
                    value={editor.mcqOptions}
                    onChange={(nextValue) => setEditor((current) => ({...current, mcqOptions: nextValue}))}
                    placeholder="A&#10;B&#10;C&#10;D&#10;E"
                    className="min-h-32 w-full resize-y rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
                  />
                  <p className="text-[10px] text-muted-foreground">One letter per line. This controls how many option prompts each question has.</p>
                </div>
              </>
            )}

            {(editor.type === "note_completion" || editor.type === "form_completion") && (
              <div className="space-y-1.5">
                <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Template Text</label>
                <BoldTextarea
                  value={editor.completionTemplateText}
                  onChange={(nextValue) =>
                    setEditor((current) => ({
                      ...current,
                      completionTemplateText: nextValue
                    }))
                  }
                  placeholder={`Example:\nItem ${editor.from}: {${editor.from}}\nItem ${Math.min(editor.from + 1, editor.to)}: {${Math.min(editor.from + 1, editor.to)}}`}
                  className="min-h-32 w-full resize-y rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
                />
                <p className="text-[10px] text-muted-foreground">Use placeholders like {'{'}{`question_number`} {'}'} for blanks.</p>
              </div>
            )}

            {editor.type === "table_completion" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("groups.fields.tableColumns")}</label>
                  <BoldTextarea
                    value={editor.tableColumns}
                    onChange={(nextValue) => setEditor((current) => ({...current, tableColumns: nextValue}))}
                    placeholder={t("groups.fields.tableColumnsPlaceholder")}
                    className="min-h-24 w-full resize-y rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
                  />
                  <p className="text-[10px] text-muted-foreground">{t("groups.fields.tableColumnsHint")}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("groups.fields.tableRows")}</label>
                  <BoldTextarea
                    value={editor.tableRows}
                    onChange={(nextValue) => setEditor((current) => ({...current, tableRows: nextValue}))}
                    placeholder={t("groups.fields.tableRowsPlaceholder", {from: editor.from})}
                    className="min-h-36 w-full resize-y rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
                  />
                  <p className="text-[10px] text-muted-foreground">{t("groups.fields.tableRowsHint")}</p>
                </div>
              </>
            )}

            {editor.type === "matching_headings" && (
              <div className="space-y-1.5">
                <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("groups.fields.headingOptions")}</label>
                <BoldTextarea
                  value={editor.headings}
                  onChange={(nextValue) => setEditor((current) => ({...current, headings: nextValue}))}
                  placeholder="Enter headings, one per line..."
                  className="min-h-32 w-full resize-y rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
                />
              </div>
            )}

            {(editor.type === "matching_information" ||
              editor.type === "matching_features" ||
              editor.type === "selecting_from_a_list" ||
              editor.type === "map") && (
              <div className="space-y-1.5">
                <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("groups.fields.choices")}</label>
                <BoldTextarea
                  value={editor.choices}
                  onChange={(nextValue) => setEditor((current) => ({...current, choices: nextValue}))}
                  placeholder="Enter choices, one per line..."
                  className="min-h-32 w-full resize-y rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
                />
              </div>
            )}

            {hasRangeError ? <p className="text-xs text-rose-400">{t("groups.validationRange")}</p> : null}
            {hasRangeOverlap ? <p className="text-xs text-rose-400">{t("groups.validationOverlap")}</p> : null}
            {hasSummaryWordBankError ? <p className="text-xs text-rose-400">{t("groups.fields.wordBankHint")}</p> : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setEditor((current) => ({...current, open: false}))}>
                {t("common.cancel")}
              </Button>
              <Button type="button" className="h-9 rounded-xl" onClick={submitEditor} disabled={hasError}>
                {editor.mode === "create" ? t("groups.createAction") : t("groups.saveAction")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
