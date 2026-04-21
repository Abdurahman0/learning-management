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
import type {BuilderMode, BuilderStructureItem, QuestionGroup, QuestionType, TestModule} from "@/data/admin-test-builder";
import {QUESTION_TYPE_OPTIONS_BY_MODULE, getStructureRange} from "@/data/admin-test-builder";
import {BoldTextarea} from "./BoldTextarea";

import {QuestionGroupCard} from "./QuestionGroupCard";

type QuestionGroupsPanelProps = {
  mode: BuilderMode;
  module: TestModule;
  activeStructure: BuilderStructureItem;
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
  mcqMode: "single" | "multiple";
  mcqOptions: string;
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

export function QuestionGroupsPanel({
  mode,
  module,
  activeStructure,
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
  const requiredCount = range.to - range.from + 1;
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
  const hasError = hasRangeError || hasRangeOverlap;

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
      mcqOptions: "",
      wordBank: "",
      headings: "",
      choices: "",
      tableColumns: "",
      tableRows: ""
    });
  };

  const openEditEditor = (group: QuestionGroup) => {
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
      mcqMode: (group.groupContentJson as any)?.mcq_mode === "multiple" ? "multiple" : "single",
      mcqOptions:
        Array.isArray((group.groupContentJson as any)?.options)
          ? ((group.groupContentJson as any).options as Array<{text?: string; label?: string; key?: string}>)
              .map((item) => item?.text ?? item?.label ?? item?.key ?? "")
              .filter(Boolean)
              .join("\n")
          : (group.questions[0] as any)?.options?.join("\n") ?? "",
      wordBank: Array.isArray((group.groupContentJson as any)?.word_bank) 
        ? ((group.groupContentJson as any).word_bank as string[]).join(", ") 
        : "",
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
        )),
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
    const parsedWordBank = editor.wordBank.split(",").map((value) => value.trim()).filter(Boolean);
    const parsedTemplateText = editor.completionTemplateText.trim();
    const parsedMcqOptions = editor.mcqOptions.split("\n").map((value) => value.trim()).filter(Boolean);
    const parsedTableColumns = editor.tableColumns.split("\n").map((value) => value.trim()).filter(Boolean);
    const parsedTableRows = editor.tableRows
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((row) => row.split("|").map((cell) => cell.trim()));

    const groupContent =
      editor.type === "multiple_choice" && module === "listening"
        ? {
            mcq_mode: editor.mcqMode,
            options: parsedMcqOptions.map((text, index) => ({
              key: String.fromCharCode("A".charCodeAt(0) + index),
              text
            }))
          }
        : editor.type === "summary_completion"
        ? {
            summary_text: editor.summaryText,
            word_bank: parsedWordBank.length ? parsedWordBank : ["word1"]
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
      onCreateGroup(editor.type, editor.from, editor.to, editor.instructions, groupContent);
    } else if (editor.groupId) {
      onEditGroup(editor.groupId, editor.type, editor.from, editor.to, editor.instructions, groupContent);
    }

    setEditor((current) => ({...current, open: false}));
  };

  return (
    <Card className="min-h-[660px] rounded-3xl border-border/70 bg-card/70 py-0">
      <CardHeader className="border-b border-border/70 pt-5 pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm tracking-[0.14em] text-muted-foreground uppercase">{t("groups.title")}</CardTitle>
          <Badge className="rounded-md border border-border/70 bg-muted/35 px-2 py-0.5 text-[10px] tracking-wide uppercase">
            {t("groups.totalCountWithLimit", {assigned: assignedCount, required: requiredCount})}
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
            disabled={assignedCount >= requiredCount}
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
              </>
            )}

            {editor.type === "multiple_choice" && module === "listening" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">MCQ Mode</label>
                  <Select
                    value={editor.mcqMode}
                    onValueChange={(value) =>
                      setEditor((current) => ({
                        ...current,
                        mcqMode: value === "multiple" ? "multiple" : "single"
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single answer (MCQ_SINGLE)</SelectItem>
                      <SelectItem value="multiple">Multiple answers (MCQ_MULTIPLE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">MCQ Options (shared)</label>
                  <BoldTextarea
                    value={editor.mcqOptions}
                    onChange={(nextValue) => setEditor((current) => ({...current, mcqOptions: nextValue}))}
                    placeholder="Option A text&#10;Option B text&#10;Option C text&#10;Option D text&#10;Option E text"
                    className="min-h-32 w-full resize-y rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
                  />
                  <p className="text-[10px] text-muted-foreground">One option per line. You can add more than 4.</p>
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
