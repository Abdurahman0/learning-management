"use client";

import {CircleAlert, Plus, Trash2} from "lucide-react";
import {useEffect, useMemo, useRef, useState} from "react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {QUESTION_TYPE_OPTIONS_BY_MODULE} from "@/data/admin-test-builder";
import {MAX_VARIANT_QUESTION_TYPES} from "@/data/admin/content-bank";
import {buildVariantSummary} from "@/data/admin/selectors";
import type {AdminTestSummary, ContentBankPassage, ContentBankVariantSet} from "@/data/admin-content-bank";
import type {QuestionType, VariantGroupTemplate} from "@/types/admin";

export type CreateVariantSetInput = {
  passageId: string;
  name: string;
  status: ContentBankVariantSet["status"];
  groups: VariantGroupTemplate[];
  usedInTestIds: string[];
};

export type UpdateVariantSetInput = CreateVariantSetInput & {
  id: string;
};

type VariantGroupDraftRow = {
  id: string;
  type: QuestionType | "";
  count: string;
};

type CreateVariantSetDialogProps = {
  mode?: "create" | "edit";
  variant?: ContentBankVariantSet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passages: ContentBankPassage[];
  tests: AdminTestSummary[];
  defaultPassageId?: string;
  onCreate?: (payload: CreateVariantSetInput) => void;
  onSave?: (payload: UpdateVariantSetInput) => void;
};

type CreateVariantSetDialogBodyProps = {
  mode: "create" | "edit";
  variant?: ContentBankVariantSet | null;
  passages: ContentBankPassage[];
  tests: AdminTestSummary[];
  defaultPassageId?: string;
  firstPassageId: string;
  onOpenChange: (open: boolean) => void;
  onCreate?: (payload: CreateVariantSetInput) => void;
  onSave?: (payload: UpdateVariantSetInput) => void;
};

type DialogToastState = {
  title: string;
  description: string;
} | null;

function makeRowId() {
  return `row-${Math.random().toString(36).slice(2, 8)}`;
}

function getAllowedTotalsForModule(module: ContentBankPassage["module"]) {
  if (module === "reading") return [13, 14];
  return [10];
}

function formatAllowedTotals(totals: number[]) {
  return totals.join(" / ");
}

function getRowsTotal(rows: VariantGroupDraftRow[]) {
  return rows.reduce((sum, row) => {
    if (!row.type) return sum;
    const count = Number(row.count);
    if (!Number.isFinite(count) || count <= 0) return sum;
    return sum + count;
  }, 0);
}

function CreateVariantSetDialogBody({
  mode,
  variant,
  passages,
  tests,
  defaultPassageId,
  firstPassageId,
  onOpenChange,
  onCreate,
  onSave
}: CreateVariantSetDialogBodyProps) {
  const t = useTranslations("adminContentBank");
  const initialGroups: VariantGroupDraftRow[] = variant?.groups?.length
    ? variant.groups.map((group) => ({id: group.id, type: group.type, count: String(group.count)}))
    : [{id: "row-1", type: "", count: ""}];
  const [passageId, setPassageId] = useState(variant?.passageId ?? defaultPassageId ?? firstPassageId);
  const [name, setName] = useState(variant?.name ?? "");
  const [status, setStatus] = useState<ContentBankVariantSet["status"]>(variant?.status ?? "draft");
  const [usedInTestId, setUsedInTestId] = useState(variant?.usedInTestIds?.[0] ?? "");
  const [toast, setToast] = useState<DialogToastState>(null);
  const lastToastRef = useRef<{key: string; timestamp: number} | null>(null);
  const [rows, setRows] = useState<VariantGroupDraftRow[]>(initialGroups);

  const selectedPassage = useMemo(() => passages.find((item) => item.id === passageId) ?? null, [passageId, passages]);
  const allowedTotals = selectedPassage ? getAllowedTotalsForModule(selectedPassage.module) : [];
  const allowedTotalsLabel = allowedTotals.length ? formatAllowedTotals(allowedTotals) : "0";
  const maxAllowedTotal = allowedTotals.length ? Math.max(...allowedTotals) : 0;
  const filteredTests = useMemo(() => {
    if (!selectedPassage) return tests;
    return tests.filter((test) => test.module === selectedPassage.module);
  }, [selectedPassage, tests]);

  const availableTypeOptions = useMemo(() => {
    if (!selectedPassage) return QUESTION_TYPE_OPTIONS_BY_MODULE.reading;
    return QUESTION_TYPE_OPTIONS_BY_MODULE[selectedPassage.module];
  }, [selectedPassage]);

  const groups = useMemo<VariantGroupTemplate[]>(() => {
    return rows
      .filter((row) => row.type)
      .map((row, index) => ({
        id: row.id || `group-${index + 1}`,
        type: row.type as QuestionType,
        count: Number(row.count)
      }));
  }, [rows]);

  const baseTotalSelected = useMemo(
    () => groups.reduce((sum, group) => sum + (Number.isFinite(group.count) ? group.count : 0), 0),
    [groups]
  );

  const validation = useMemo(() => {
    if (!selectedPassage) {
      return {
        isValid: false,
        selectedTypesCount: groups.length,
        maxQuestionTypes: MAX_VARIANT_QUESTION_TYPES,
        totalSelected: baseTotalSelected,
        allowedTotals,
        allowedTotalsLabel,
        remaining: 0,
        hasDuplicateTypes: false,
        hasInvalidCounts: true,
        exceedsMaxTypes: false,
        hasTotalMismatch: true
      };
    }

    const selectedTypesCount = groups.length;
    const totalSelected = baseTotalSelected;
    const hasDuplicateTypes = new Set(groups.map((group) => group.type)).size !== groups.length;
    const hasInvalidCounts = groups.some((group) => !Number.isFinite(group.count) || group.count <= 0);
    const exceedsMaxTypes = selectedTypesCount > MAX_VARIANT_QUESTION_TYPES;
    const hasTotalMismatch = !allowedTotals.includes(totalSelected);
    const nextTarget = [...allowedTotals].sort((left, right) => left - right).find((total) => total >= totalSelected) ?? Math.max(...allowedTotals);
    const remaining = nextTarget - totalSelected;
    const isValid = selectedTypesCount > 0 && !hasDuplicateTypes && !hasInvalidCounts && !exceedsMaxTypes && !hasTotalMismatch;

    return {
      isValid,
      selectedTypesCount,
      maxQuestionTypes: MAX_VARIANT_QUESTION_TYPES,
      totalSelected,
      allowedTotals,
      allowedTotalsLabel,
      remaining,
      hasDuplicateTypes,
      hasInvalidCounts,
      exceedsMaxTypes,
      hasTotalMismatch
    };
  }, [allowedTotals, allowedTotalsLabel, baseTotalSelected, groups, selectedPassage]);

  const summaryPreview = useMemo(() => {
    if (!groups.length || validation.hasInvalidCounts) return t("createVariantDialog.summaryEmpty");
    return buildVariantSummary(groups);
  }, [groups, t, validation.hasInvalidCounts]);

  const canSubmit = Boolean(name.trim()) && Boolean(passageId) && validation.isValid && (status !== "used" || Boolean(usedInTestId));

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showExceededTotalToast = (currentTotal: number, attemptedTotal: number) => {
    if (!maxAllowedTotal) return;
    const remaining = Math.max(maxAllowedTotal - currentTotal, 0);
    const overflow = Math.max(attemptedTotal - maxAllowedTotal, 0);
    const key = `${maxAllowedTotal}:${remaining}:${overflow}`;
    const now = Date.now();

    if (lastToastRef.current?.key === key && now - lastToastRef.current.timestamp < 1200) {
      return;
    }
    lastToastRef.current = {key, timestamp: now};

    setToast({
      title: t("createVariantDialog.toast.totalExceededTitle"),
      description: t("createVariantDialog.toast.totalExceededDescription", {
        max: maxAllowedTotal,
        overflow,
        remaining
      })
    });
  };

  const updateRow = (rowId: string, patch: Partial<VariantGroupDraftRow>) => {
    setRows((current) => {
      const nextRows = current.map((row) => (row.id === rowId ? {...row, ...patch} : row));
      if (!maxAllowedTotal) {
        return nextRows;
      }

      const currentTotal = getRowsTotal(current);
      const nextTotal = getRowsTotal(nextRows);

      if (nextTotal > maxAllowedTotal) {
        showExceededTotalToast(currentTotal, nextTotal);
        return current;
      }

      return nextRows;
    });
  };

  const addRow = () => {
    if (rows.length >= MAX_VARIANT_QUESTION_TYPES) return;
    const currentTotal = getRowsTotal(rows);
    if (maxAllowedTotal > 0 && currentTotal > maxAllowedTotal) {
      showExceededTotalToast(currentTotal, currentTotal);
      return;
    }
    setRows((current) => [...current, {id: makeRowId(), type: "", count: ""}]);
  };

  const removeRow = (rowId: string) => {
    setRows((current) => {
      if (current.length <= 1) {
        return [{id: "row-1", type: "", count: ""}];
      }
      return current.filter((row) => row.id !== rowId);
    });
  };

  const handleCreate = () => {
    if (!canSubmit) {
      if (maxAllowedTotal > 0 && validation.totalSelected > maxAllowedTotal) {
        showExceededTotalToast(validation.totalSelected, validation.totalSelected);
      }
      return;
    }

    if (mode === "edit" && variant && onSave) {
      onSave({
        id: variant.id,
        passageId,
        name: name.trim(),
        status,
        groups,
        usedInTestIds: status === "used" && usedInTestId ? [usedInTestId] : []
      });
    } else if (mode === "create" && onCreate) {
      onCreate({
        passageId,
        name: name.trim(),
        status,
        groups,
        usedInTestIds: status === "used" && usedInTestId ? [usedInTestId] : []
      });
    }
    onOpenChange(false);
  };

  return (
    <>
      <div aria-live="polite" className="pointer-events-none fixed top-20 right-4 z-[80]">
        {toast ? (
          <div className="min-w-[280px] rounded-xl border border-rose-500/35 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
                <CircleAlert className="size-3.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                <p className="text-xs text-muted-foreground">{toast.description}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <SheetHeader className="space-y-1">
        <SheetTitle>{mode === "edit" ? t("createVariantDialog.editTitle") : t("createVariantDialog.title")}</SheetTitle>
        <SheetDescription>{mode === "edit" ? t("createVariantDialog.editDescription") : t("createVariantDialog.description")}</SheetDescription>
      </SheetHeader>

      <div className="space-y-4 px-6 pb-3">
        <div className="space-y-1.5">
          <Label htmlFor="cb-variant-name">{t("createVariantDialog.fields.variantName")}</Label>
          <Input
            id="cb-variant-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("createVariantDialog.fields.variantNamePlaceholder")}
            className="rounded-xl border-border/70 bg-card/55"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("createVariantDialog.fields.passage")}</Label>
          <Select value={passageId} onValueChange={setPassageId}>
            <SelectTrigger className="rounded-xl border-border/70 bg-card/55">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {passages.map((passage) => (
                <SelectItem key={passage.id} value={passage.id}>
                  {passage.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("createVariantDialog.fields.status")}</Label>
          <Select value={status} onValueChange={(next) => setStatus(next as ContentBankVariantSet["status"])}>
            <SelectTrigger className="rounded-xl border-border/70 bg-card/55">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">{t("status.draft")}</SelectItem>
              <SelectItem value="published">{t("status.published")}</SelectItem>
              <SelectItem value="used">{t("status.used")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {status === "used" ? (
          <div className="space-y-1.5">
            <Label>{t("createVariantDialog.fields.usedInTest")}</Label>
            <Select value={usedInTestId} onValueChange={setUsedInTestId}>
              <SelectTrigger className="rounded-xl border-border/70 bg-card/55">
                <SelectValue placeholder={t("createVariantDialog.fields.selectTestPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {filteredTests.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>{t("createVariantDialog.fields.questionTypes")}</Label>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-lg border-border/70 bg-card/45 px-2.5 text-xs"
              onClick={addRow}
              disabled={rows.length >= MAX_VARIANT_QUESTION_TYPES}
            >
              <Plus className="size-3.5" />
              {t("createVariantDialog.actions.addType")}
            </Button>
          </div>

          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_96px_40px] items-center gap-2">
                <Select value={row.type || "__none"} onValueChange={(value) => updateRow(row.id, {type: value === "__none" ? "" : (value as QuestionType)})}>
                  <SelectTrigger className="h-10 rounded-xl border-border/70 bg-card/55">
                    <SelectValue placeholder={t("createVariantDialog.fields.selectQuestionTypePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">{t("createVariantDialog.fields.selectQuestionTypePlaceholder")}</SelectItem>
                    {availableTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  min={1}
                  value={row.count}
                  onChange={(event) => updateRow(row.id, {count: event.target.value})}
                  placeholder={t("createVariantDialog.fields.countPlaceholder")}
                  className="h-10 rounded-xl border-border/70 bg-card/55"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-muted-foreground"
                  onClick={() => removeRow(row.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/70 bg-card/45 p-3 text-sm">
            <p className="text-muted-foreground">
              {t("createVariantDialog.metrics.totalSelected", {selected: validation.totalSelected, total: validation.allowedTotalsLabel})}
            </p>
            <p className="text-muted-foreground">{t("createVariantDialog.metrics.remaining", {count: validation.remaining})}</p>
            {selectedPassage ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("createVariantDialog.metrics.allowedTotalsByModule", {
                  module: t(`modules.${selectedPassage.module}`),
                  totals: validation.allowedTotalsLabel
                })}
              </p>
            ) : null}
            <p className="mt-2 text-xs font-medium text-foreground/90">{t("createVariantDialog.fields.autoSummary")}</p>
            <p className="text-xs text-muted-foreground">{summaryPreview}</p>
          </div>

          <div className="space-y-1">
            {validation.exceedsMaxTypes ? <p className="text-xs text-rose-400">{t("createVariantDialog.validation.maxSixTypes")}</p> : null}
            {validation.hasDuplicateTypes ? <p className="text-xs text-rose-400">{t("createVariantDialog.validation.duplicateQuestionType")}</p> : null}
            {validation.hasInvalidCounts ? <p className="text-xs text-rose-400">{t("createVariantDialog.validation.invalidCount")}</p> : null}
            {validation.hasTotalMismatch ? (
              <p className="text-xs text-rose-400">
                {t("createVariantDialog.validation.invalidTotal", {selected: validation.totalSelected, totals: validation.allowedTotalsLabel})}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <SheetFooter className="border-t border-border/70">
        <Button variant="outline" className="rounded-xl border-border/70 bg-card/55" onClick={() => onOpenChange(false)}>
          {t("common.cancel")}
        </Button>
        <Button className="rounded-xl" onClick={handleCreate} disabled={!canSubmit}>
          {mode === "edit" ? t("createVariantDialog.save") : t("createVariantDialog.create")}
        </Button>
      </SheetFooter>
    </>
  );
}

export function CreateVariantSetDialog({
  mode = "create",
  variant,
  open,
  onOpenChange,
  passages,
  tests,
  defaultPassageId,
  onCreate,
  onSave
}: CreateVariantSetDialogProps) {
  const firstPassageId = passages[0]?.id ?? "";
  const formKey = `${mode}:${open ? "open" : "closed"}:${variant?.id ?? defaultPassageId ?? firstPassageId}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-l border-border/70 bg-background/95 sm:max-w-xl">
        {open ? (
          <CreateVariantSetDialogBody
            key={formKey}
            mode={mode}
            variant={variant}
            passages={passages}
            tests={tests}
            defaultPassageId={defaultPassageId}
            firstPassageId={firstPassageId}
            onOpenChange={onOpenChange}
            onCreate={onCreate}
            onSave={onSave}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
