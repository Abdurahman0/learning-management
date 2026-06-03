"use client";

import {ChevronDown, ChevronLeft, ChevronRight, GripVertical} from "lucide-react";
import type {DragEvent} from "react";
import {useTranslations} from "next-intl";
import {Fragment} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {AdminTest, TestDifficulty, TestStatus} from "@/data/admin-tests";

import {TestActionsMenu} from "./TestActionsMenu";
import {TestExpandedRow} from "./TestExpandedRow";

type TestsTableProps = {
  tests: AdminTest[];
  groups?: Array<{id: string; name: string}>;
  expandedTestIds: Set<string>;
  onToggleExpand: (testId: string) => void;
  onEdit: (testId: string) => void;
  onPreview: (testId: string) => void;
  onActivate: (testId: string) => void;
  onDelete: (testId: string) => void;
  onAssignGroup?: (testId: string, groupId: string) => void;
  onEditPassage: (testId: string, passageId: string) => void;
  onReorder?: (draggedId: string, targetId: string) => void;
  draggingTestId?: string | null;
  onDragStart?: (testId: string) => void;
  onDragEnd?: () => void;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const difficultyClass: Record<TestDifficulty, string> = {
  beginner: "border-cyan-500/30 bg-cyan-500/12 text-cyan-300",
  intermediate: "border-amber-500/30 bg-amber-500/12 text-amber-300",
  advanced: "border-rose-500/30 bg-rose-500/12 text-rose-300"
};

const statusClass: Record<TestStatus, string> = {
  published: "border-emerald-500/30 bg-emerald-500/12 text-emerald-300",
  draft: "border-slate-500/35 bg-slate-500/14 text-slate-300"
};

function formatCreatedAt(
  dateString: string,
  t: (key: string, values?: Record<string, string | number>) => string
) {
  const [year, monthStr, dayStr] = dateString.split("-");
  const monthIndex = Number(monthStr) - 1;
  const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
  const month = monthKeys[monthIndex] ?? "jan";
  const day = Number(dayStr || "1");

  return `${t(`dates.months.${month}`)} ${day}, ${year}`;
}

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 6) {
    return Array.from({length: totalPages}, (_, index) => index + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, 4, -1, totalPages];
  }

  if (page >= totalPages - 2) {
    return [1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, -1, page - 1, page, page + 1, -2, totalPages];
}

export function TestsTable({
  tests,
  groups = [],
  expandedTestIds,
  onToggleExpand,
  onEdit,
  onPreview,
  onActivate,
  onDelete,
  onAssignGroup,
  onEditPassage,
  onReorder,
  draggingTestId,
  onDragStart,
  onDragEnd,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange
}: TestsTableProps) {
  const t = useTranslations("adminTests");
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : start + tests.length - 1;
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 bg-card/70 py-0">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.columns.testName")}</TableHead>
                <TableHead>{t("table.columns.module")}</TableHead>
                <TableHead>{t("table.columns.book")}</TableHead>
                <TableHead>{t("table.columns.questions")}</TableHead>
                <TableHead>{t("table.columns.difficulty")}</TableHead>
                <TableHead>{t("table.columns.status")}</TableHead>
                <TableHead>{t("table.columns.createdDate")}</TableHead>
                <TableHead>{t("table.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {tests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    {t("table.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                tests.map((test) => {
                  const expanded = expandedTestIds.has(test.id);

                  return (
                    <Fragment key={test.id}>
                      <TableRow
                        className={`h-[84px] cursor-pointer transition-colors ${draggingTestId === test.id ? "bg-blue-500/10 opacity-70" : ""}`}
                        draggable={Boolean(onReorder)}
                        onDragStart={(event: DragEvent<HTMLTableRowElement>) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("application/x-admin-test-id", test.id);
                          onDragStart?.(test.id);
                        }}
                        onDragOver={(event) => {
                          if (!onReorder) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(event) => {
                          if (!onReorder) return;
                          event.preventDefault();
                          const draggedId = event.dataTransfer.getData("application/x-admin-test-id");
                          if (draggedId && draggedId !== test.id) {
                            onReorder(draggedId, test.id);
                          }
                          onDragEnd?.();
                        }}
                        onDragEnd={onDragEnd}
                        onClick={() => onToggleExpand(test.id)}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background/55 text-muted-foreground">
                              <GripVertical className="size-4" />
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-md text-muted-foreground"
                              onClick={(event) => {
                                event.stopPropagation();
                                onToggleExpand(test.id);
                              }}
                              aria-label={expanded ? t("table.collapseRow") : t("table.expandRow")}
                            >
                              <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`} />
                            </Button>
                            <div>
                              <p className="max-w-[280px] text-lg leading-[1.35] font-semibold tracking-tight">{test.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                #{test.displayOrder ?? "-"}{test.groupName ? ` · ${test.groupName}` : ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-base">{t(`modules.${test.module}`)}</TableCell>
                        <TableCell className="py-4 text-base">{test.book}</TableCell>
                        <TableCell className="py-4 text-base">{test.questions}</TableCell>
                        <TableCell className="py-4">
                          <Badge className={`border px-2.5 py-0.5 text-[10px] tracking-wide uppercase ${difficultyClass[test.difficulty]}`}>
                            {t(`difficulty.${test.difficulty}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={`border px-2.5 py-0.5 text-[10px] tracking-wide uppercase ${statusClass[test.status]}`}>
                            {t(`status.${test.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-base text-muted-foreground">{formatCreatedAt(test.createdAt, t)}</TableCell>
                        <TableCell
                          className="py-4"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          <TestActionsMenu
                            test={test}
                            groups={groups}
                            onEdit={onEdit}
                            onPreview={onPreview}
                            onActivate={onActivate}
                            onDelete={onDelete}
                            onAssignGroup={onAssignGroup}
                          />
                        </TableCell>
                      </TableRow>

                      {expanded ? (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={8} className="px-5 py-4">
                            <TestExpandedRow test={test} onEditPassage={onEditPassage} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-6 py-4">
          <p className="text-sm text-muted-foreground">{t("pagination.summary", {from: start, to: end, total: totalItems})}</p>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-lg"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              aria-label={t("pagination.previous")}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {visiblePages.map((item, index) =>
              item < 0 ? (
                <span key={`ellipsis-${index}`} className="px-1.5 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === page ? "default" : "ghost"}
                  size="icon-sm"
                  className={`rounded-lg ${item === page ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              )
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-lg"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              aria-label={t("pagination.next")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
