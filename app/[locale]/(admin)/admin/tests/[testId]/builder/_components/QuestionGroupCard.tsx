"use client";

import {ChevronDown, ChevronUp, Copy, EllipsisVertical, Pencil, Plus, Trash2} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type {BuilderMode, QuestionGroup} from "@/data/admin-test-builder";
import {cn} from "@/lib/utils";

type QuestionGroupCardProps = {
  group: QuestionGroup;
  mode: BuilderMode;
  collapsed: boolean;
  selectedQuestionId: string | null;
  canDuplicateGroup: boolean;
  canAddQuestion: boolean;
  canDuplicateQuestion: boolean;
  onToggleCollapse: () => void;
  onEditGroup: () => void;
  onDuplicateGroup: () => void;
  onDeleteGroup: () => void;
  onAddQuestion: () => void;
  onOpenQuestionEditor: (questionId: string) => void;
  onSelectQuestion: (questionId: string) => void;
  onMoveQuestion: (questionId: string, direction: "up" | "down") => void;
  onDuplicateQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
};

export function QuestionGroupCard({
  group,
  mode,
  collapsed,
  selectedQuestionId,
  canDuplicateGroup,
  canAddQuestion,
  canDuplicateQuestion,
  onToggleCollapse,
  onEditGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onAddQuestion,
  onOpenQuestionEditor,
  onSelectQuestion,
  onMoveQuestion,
  onDuplicateQuestion,
  onDeleteQuestion
}: QuestionGroupCardProps) {
  const t = useTranslations("adminTestBuilder");

  return (
    <Card className="rounded-2xl border-border/70 bg-background/40 py-0">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b border-border/70 px-3 py-3">
          <Button type="button" variant="ghost" size="icon-xs" className="rounded-md" onClick={onToggleCollapse}>
            {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </Button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{group.title}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Badge className="rounded-md border border-primary/35 bg-primary/12 px-1.5 py-0 text-[10px] tracking-wide text-primary uppercase">
                {t(`questionTypes.${group.type}`)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {t("groups.questionCount", {count: group.questions.length})}
              </span>
            </div>
          </div>

          {mode === "editor" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg">
                  <EllipsisVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={onEditGroup}>
                  <Pencil className="size-4" />
                  {t("groups.actions.editGroup")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onDuplicateGroup} disabled={!canDuplicateGroup}>
                  <Copy className="size-4" />
                  {t("groups.actions.duplicateGroup")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-300" onSelect={onDeleteGroup}>
                  <Trash2 className="size-4" />
                  {t("groups.actions.deleteGroup")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {!collapsed ? (
          <div className="space-y-2 p-3">
            {group.questions.map((question, index) => (
              <div
                key={question.id}
                role="button"
                tabIndex={0}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-left transition-colors",
                  selectedQuestionId === question.id
                    ? "border-primary/45 bg-primary/10"
                    : "border-border/70 bg-background/45 hover:bg-muted/30"
                )}
                onClick={() => onSelectQuestion(question.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectQuestion(question.id);
                  }
                }}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t("questions.questionNumber", {number: question.number})}
                  </p>
                  {mode === "editor" ? (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-md"
                        onClick={(event) => {
                          event.stopPropagation();
                          onMoveQuestion(question.id, "up");
                        }}
                        disabled={index === 0}
                        aria-label={t("questions.actions.moveUp")}
                      >
                        <ChevronUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-md"
                        onClick={(event) => {
                          event.stopPropagation();
                          onMoveQuestion(question.id, "down");
                        }}
                        disabled={index === group.questions.length - 1}
                        aria-label={t("questions.actions.moveDown")}
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-md"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDuplicateQuestion(question.id);
                        }}
                        disabled={!canDuplicateQuestion}
                        aria-label={t("questions.actions.duplicate")}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-md text-rose-400 hover:text-rose-300"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteQuestion(question.id);
                        }}
                        disabled={group.questions.length <= 1}
                        aria-label={t("questions.actions.delete")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>

                <p className="line-clamp-2 text-sm text-foreground/90">{question.prompt || t("questions.emptyPrompt")}</p>

                {question.evidence || question.evidenceText ? (
                  <p className="mt-2 line-clamp-2 rounded-lg border border-primary/25 bg-primary/10 px-2 py-1 text-xs text-primary/90">
                    {question.evidence ?? question.evidenceText}
                  </p>
                ) : null}

                {mode === "editor" ? (
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      className="rounded-md text-xs"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenQuestionEditor(question.id);
                      }}
                    >
                      {t("questions.actions.edit")}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}

            {mode === "editor" ? (
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full rounded-lg border-dashed border-border/70 bg-background/40"
                onClick={onAddQuestion}
                disabled={!canAddQuestion}
              >
                <Plus className="size-4" />
                {t("questions.actions.addQuestion")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
