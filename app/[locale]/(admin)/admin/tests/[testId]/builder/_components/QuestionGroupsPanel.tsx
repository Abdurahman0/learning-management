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

import {QuestionGroupCard} from "./QuestionGroupCard";

type QuestionGroupsPanelProps = {
  mode: BuilderMode;
  module: TestModule;
  activeStructure: BuilderStructureItem;
  groups: QuestionGroup[];
  collapsedGroups: Record<string, boolean>;
  selectedQuestionId: string | null;
  onCreateGroup: (type: QuestionType, from: number, to: number) => void;
  onEditGroup: (groupId: string, type: QuestionType, from: number, to: number) => void;
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
};

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
  const availableQuestionTypes = QUESTION_TYPE_OPTIONS_BY_MODULE[module];
  const defaultType = availableQuestionTypes[0]?.value ?? "multiple_choice";
  const [editor, setEditor] = useState<GroupEditorState>({
    open: false,
    mode: "create",
    groupId: null,
    type: defaultType,
    from: range.from,
    to: Math.min(range.from + 2, range.to)
  });

  const hasError = editor.from < range.from || editor.to > range.to || editor.from > editor.to;

  const openCreateEditor = () => {
    setEditor({
      open: true,
      mode: "create",
      groupId: null,
      type: defaultType,
      from: range.from,
      to: Math.min(range.from + 2, range.to)
    });
  };

  const openEditEditor = (group: QuestionGroup) => {
    setEditor({
      open: true,
      mode: "edit",
      groupId: group.id,
      type: group.type,
      from: group.from,
      to: group.to
    });
  };

  const submitEditor = () => {
    if (hasError) {
      return;
    }

    if (editor.mode === "create") {
      onCreateGroup(editor.type, editor.from, editor.to);
    } else if (editor.groupId) {
      onEditGroup(editor.groupId, editor.type, editor.from, editor.to);
    }

    setEditor((current) => ({...current, open: false}));
  };

  return (
    <Card className="min-h-[660px] rounded-3xl border-border/70 bg-card/70 py-0">
      <CardHeader className="border-b border-border/70 pt-5 pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm tracking-[0.14em] text-muted-foreground uppercase">{t("groups.title")}</CardTitle>
          <Badge className="rounded-md border border-border/70 bg-muted/35 px-2 py-0.5 text-[10px] tracking-wide uppercase">
            {t("groups.totalCount", {count: groups.reduce((sum, group) => sum + group.questions.length, 0)})}
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
            maxQuestionNumber={range.to}
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
          >
            <Plus className="size-4" />
            {t("groups.addGroup")}
          </Button>
        ) : null}
      </CardContent>

      <Sheet open={editor.open} onOpenChange={(open) => setEditor((current) => ({...current, open}))}>
        <SheetContent side="right" className="w-full max-w-[420px] border-l border-border/70 bg-background/95">
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

            {hasError ? <p className="text-xs text-rose-400">{t("groups.validationRange")}</p> : null}

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
