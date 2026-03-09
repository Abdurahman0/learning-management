"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import type {CreateContentBankPassagePayload} from "@/data/admin-content-bank";

type AddPassageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: CreateContentBankPassagePayload) => void;
};

function toParagraphs(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function AddPassageDialogBody({onOpenChange, onCreate}: {onOpenChange: (open: boolean) => void; onCreate: (payload: CreateContentBankPassagePayload) => void}) {
  const t = useTranslations("adminContentBank");
  const [title, setTitle] = useState("");
  const [module, setModule] = useState<CreateContentBankPassagePayload["module"]>("reading");
  const [difficulty, setDifficulty] = useState<CreateContentBankPassagePayload["difficulty"]>("medium");
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState<CreateContentBankPassagePayload["source"]>("custom");
  const [previewText, setPreviewText] = useState("");
  const [fullTextRaw, setFullTextRaw] = useState("");
  const [estimatedTimeLabel, setEstimatedTimeLabel] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("7");

  const canSubmit = useMemo(() => Boolean(title.trim()) && Boolean(topic.trim()) && Boolean(previewText.trim()), [previewText, title, topic]);

  const handleCreate = () => {
    if (!canSubmit) return;

    onCreate({
      title: title.trim(),
      module,
      difficulty,
      topic: topic.trim(),
      source,
      previewText: previewText.trim(),
      fullText: toParagraphs(fullTextRaw),
      durationMinutes: module === "listening" ? Math.max(1, Number(durationMinutes || 7)) : undefined,
      estimatedTimeLabel: estimatedTimeLabel.trim() || undefined
    });

    onOpenChange(false);
  };

  return (
    <>
      <SheetHeader className="space-y-1">
        <SheetTitle>{t("addPassageDialog.title")}</SheetTitle>
        <SheetDescription>{t("addPassageDialog.description")}</SheetDescription>
      </SheetHeader>

      <div className="space-y-4 px-6 pb-3">
        <div className="space-y-1.5">
          <Label htmlFor="cb-passage-title">{t("addPassageDialog.fields.title")}</Label>
          <Input
            id="cb-passage-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("addPassageDialog.fields.titlePlaceholder")}
            className="rounded-xl border-border/70 bg-card/55"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("addPassageDialog.fields.module")}</Label>
            <Select value={module} onValueChange={(value) => setModule(value as CreateContentBankPassagePayload["module"])}>
              <SelectTrigger className="rounded-xl border-border/70 bg-card/55">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">{t("modules.reading")}</SelectItem>
                <SelectItem value="listening">{t("modules.listening")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("addPassageDialog.fields.difficulty")}</Label>
            <Select value={difficulty} onValueChange={(value) => setDifficulty(value as CreateContentBankPassagePayload["difficulty"])}>
              <SelectTrigger className="rounded-xl border-border/70 bg-card/55">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">{t("difficulty.easy")}</SelectItem>
                <SelectItem value="medium">{t("difficulty.medium")}</SelectItem>
                <SelectItem value="hard">{t("difficulty.hard")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("addPassageDialog.fields.topic")}</Label>
            <Input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder={t("addPassageDialog.fields.topicPlaceholder")}
              className="rounded-xl border-border/70 bg-card/55"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("addPassageDialog.fields.source")}</Label>
            <Select value={source} onValueChange={(value) => setSource(value as CreateContentBankPassagePayload["source"])}>
              <SelectTrigger className="rounded-xl border-border/70 bg-card/55">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cambridge">{t("filters.source.cambridge")}</SelectItem>
                <SelectItem value="practice">{t("filters.source.practice")}</SelectItem>
                <SelectItem value="custom">{t("filters.source.custom")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("addPassageDialog.fields.previewText")}</Label>
          <textarea
            value={previewText}
            onChange={(event) => setPreviewText(event.target.value)}
            placeholder={t("addPassageDialog.fields.previewPlaceholder")}
            className="min-h-[92px] w-full rounded-xl border border-border/70 bg-card/55 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("addPassageDialog.fields.fullText")}</Label>
          <textarea
            value={fullTextRaw}
            onChange={(event) => setFullTextRaw(event.target.value)}
            placeholder={t("addPassageDialog.fields.fullTextPlaceholder")}
            className="min-h-[120px] w-full rounded-xl border border-border/70 bg-card/55 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("addPassageDialog.fields.estimatedTimeLabel")}</Label>
            <Input
              value={estimatedTimeLabel}
              onChange={(event) => setEstimatedTimeLabel(event.target.value)}
              placeholder={t("addPassageDialog.fields.estimatedTimePlaceholder")}
              className="rounded-xl border-border/70 bg-card/55"
            />
          </div>
          {module === "listening" ? (
            <div className="space-y-1.5">
              <Label>{t("addPassageDialog.fields.durationMinutes")}</Label>
              <Input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                placeholder="7"
                className="rounded-xl border-border/70 bg-card/55"
              />
            </div>
          ) : null}
        </div>
      </div>

      <SheetFooter className="border-t border-border/70">
        <Button variant="outline" className="rounded-xl border-border/70 bg-card/55" onClick={() => onOpenChange(false)}>
          {t("common.cancel")}
        </Button>
        <Button className="rounded-xl" onClick={handleCreate} disabled={!canSubmit}>
          {t("addPassageDialog.create")}
        </Button>
      </SheetFooter>
    </>
  );
}

export function AddPassageDialog({open, onOpenChange, onCreate}: AddPassageDialogProps) {
  const formKey = `add-passage-${open ? "open" : "closed"}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-l border-border/70 bg-background/95 sm:max-w-xl">
        {open ? <AddPassageDialogBody key={formKey} onOpenChange={onOpenChange} onCreate={onCreate} /> : null}
      </SheetContent>
    </Sheet>
  );
}

