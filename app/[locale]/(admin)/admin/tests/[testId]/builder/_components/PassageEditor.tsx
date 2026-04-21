"use client";

import {useMemo, useRef, useState} from "react";
import {AudioLines, FileText} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {BuilderMode, BuilderStructureItem, TestModule} from "@/data/admin-test-builder";
import type {ContentBankPassage, ContentBankVariantSet} from "@/data/admin/selectors";

import {BoldTextarea} from "./BoldTextarea";
import {EvidenceToolbar} from "./EvidenceToolbar";

type PassageEditorProps = {
  mode: BuilderMode;
  module: TestModule;
  structure: BuilderStructureItem;
  selectedQuestionLabel: string | null;
  contentBankPassages: ContentBankPassage[];
  selectedPassageId: string;
  onSelectContentBankPassage: (passageId: string) => void;
  variantSets: ContentBankVariantSet[];
  hasAnyVariantSets: boolean;
  requiredQuestionCount: number;
  selectedVariantSetId: string;
  selectedVariantSetName: string | null;
  onSelectVariantSet: (variantSetId: string) => void;
  onUpdateContent: (structureId: string, content: string[]) => void;
  selectedAudioFileName?: string;
  removeCurrentAudio: boolean;
  onSelectAudioFile: (file: File | null) => void;
  onToggleRemoveCurrentAudio: (remove: boolean) => void;
  onAttachEvidence: (text: string) => boolean;
};

function textToParagraphs(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function applyBoldToText(value: string, start: number, end: number) {
  const selected = value.slice(start, end);
  const wrapped = `**${selected || "bold text"}**`;
  return `${value.slice(0, start)}${wrapped}${value.slice(end)}`;
}

export function PassageEditor({
  mode,
  module,
  structure,
  selectedQuestionLabel,
  contentBankPassages,
  selectedPassageId,
  onSelectContentBankPassage,
  variantSets,
  hasAnyVariantSets,
  requiredQuestionCount,
  selectedVariantSetId,
  selectedVariantSetName,
  onSelectVariantSet,
  onUpdateContent,
  selectedAudioFileName,
  removeCurrentAudio,
  onSelectAudioFile,
  onToggleRemoveCurrentAudio,
  onAttachEvidence
}: PassageEditorProps) {
  const t = useTranslations("adminTestBuilder");
  const [evidenceDraft, setEvidenceDraft] = useState("");
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const textValue = useMemo(() => structure.content.join("\n\n"), [structure.content]);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const applyEvidence = () => {
    const element = textRef.current;
    if (!element) {
      return;
    }

    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const selected = element.value.slice(start, end).trim();

    if (!selected) {
      return;
    }

    const attached = onAttachEvidence(selected);
    if (attached) {
      setEvidenceDraft(selected);
    }
  };

  return (
    <Card className="min-h-[660px] rounded-3xl border-border/70 bg-card/70 py-0">
      <CardHeader className="border-b border-border/70 pt-5 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold tracking-tight">
            {module === "reading" ? t("editor.passageEditorTitle") : t("editor.transcriptEditorTitle")}
          </CardTitle>
          <Badge className="rounded-md border border-border/70 bg-muted/35 px-2 py-0.5 text-[10px] tracking-wide uppercase">
            {structure.questionRangeLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 pb-5">
        {mode === "editor" ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("contentBankPassage")}</label>
                <Select value={selectedPassageId || "__none"} onValueChange={(value) => onSelectContentBankPassage(value === "__none" ? "" : value)}>
                  <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background/50">
                    <SelectValue placeholder={t("selectPassagePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">{t("selectPassagePlaceholder")}</SelectItem>
                    {contentBankPassages.map((passage) => (
                      <SelectItem key={passage.id} value={passage.id}>
                        {passage.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("variantSet")}</label>
                <Select
                  value={selectedVariantSetId || "__none"}
                  onValueChange={(value) => onSelectVariantSet(value === "__none" ? "" : value)}
                  disabled={!selectedPassageId || variantSets.length === 0}
                >
                  <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background/50">
                    <SelectValue placeholder={t("selectVariantPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">{t("selectVariantPlaceholder")}</SelectItem>
                    {variantSets.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedVariantSetName ? (
              <p className="text-xs text-primary">{t("importedFromContentBank", {name: selectedVariantSetName})}</p>
            ) : null}

            {selectedPassageId ? <p className="text-xs text-muted-foreground">{t("slotDeterminesNumbering")}</p> : null}

            {selectedPassageId && !hasAnyVariantSets ? <p className="text-xs text-muted-foreground">{t("noVariantSets")}</p> : null}
            {selectedPassageId && hasAnyVariantSets && !variantSets.length ? (
              <p className="text-xs text-amber-300">{t("noCompatibleVariants", {count: requiredQuestionCount})}</p>
            ) : null}
            {selectedPassageId && hasAnyVariantSets ? (
              <p className="text-xs text-muted-foreground">{t("thisSlotRequires", {count: requiredQuestionCount})}</p>
            ) : null}

            <EvidenceToolbar
              onFormatClick={(format) => {
                if (format !== "bold") return;
                const element = textRef.current;
                if (!element) return;
                const start = element.selectionStart ?? 0;
                const end = element.selectionEnd ?? 0;
                const nextValue = applyBoldToText(textValue, start, end);
                onUpdateContent(structure.id, textToParagraphs(nextValue));
              }}
              onAddEvidence={applyEvidence}
              addEvidenceDisabled={!selectedQuestionLabel}
            />

            {selectedQuestionLabel ? (
              <p className="text-xs text-muted-foreground">
                {t("editor.evidenceTarget", {question: selectedQuestionLabel})}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{t("editor.evidenceHint")}</p>
            )}

            <BoldTextarea
              textareaRef={textRef}
              value={textValue}
              onChange={(nextValue) => onUpdateContent(structure.id, textToParagraphs(nextValue))}
              className="min-h-[420px] w-full resize-y rounded-2xl border border-border/70 bg-background/45 px-4 py-3 text-sm leading-7 outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            />

            {module === "listening" ? (
              <div className="space-y-3 rounded-2xl border border-border/70 bg-background/35 p-3">
                <div className="space-y-1">
                  <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
                    {t("editor.audioLabel")}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Upload audio for this listening section.
                  </p>
                </div>

                {selectedAudioFileName ? (
                  <p className="text-xs text-primary">
                    Selected file: {selectedAudioFileName}
                  </p>
                ) : structure.audioLabel ? (
                  <p className="text-xs text-muted-foreground">
                    Current audio: {structure.audioLabel}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No audio uploaded yet.
                  </p>
                )}

                <button
                  type="button"
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDraggingAudio(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingAudio(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDraggingAudio(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDraggingAudio(false);
                    const file = event.dataTransfer?.files?.[0] ?? null;
                    if (file && file.type.startsWith("audio/")) {
                      onSelectAudioFile(file);
                    }
                  }}
                  onClick={() => audioInputRef.current?.click()}
                  className={`w-full rounded-xl border border-dashed px-4 py-5 text-left transition-colors ${
                    isDraggingAudio
                      ? "border-blue-500/70 bg-blue-500/10"
                      : "border-border/70 bg-background/45 hover:bg-background/60"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">
                    Drag and drop audio file here
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    or click to choose a file
                  </p>
                </button>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg border-border/70 bg-background/50"
                    onClick={() => audioInputRef.current?.click()}
                  >
                    Upload audio
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg border-border/70 bg-background/50"
                    onClick={() => onSelectAudioFile(null)}
                    disabled={!selectedAudioFileName}
                  >
                    Clear selected file
                  </Button>
                  <Button
                    type="button"
                    variant={removeCurrentAudio ? "default" : "outline"}
                    className="h-9 rounded-lg border-border/70 bg-background/50"
                    onClick={() => onToggleRemoveCurrentAudio(!removeCurrentAudio)}
                    disabled={!structure.audioLabel && !removeCurrentAudio}
                  >
                    {removeCurrentAudio ? "Will remove current audio" : "Remove current audio"}
                  </Button>
                </div>

                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    onSelectAudioFile(file);
                    if (event.target) {
                      event.target.value = "";
                    }
                  }}
                />
              </div>
            ) : null}

            {evidenceDraft ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
                <p className="mb-1 text-[11px] tracking-[0.12em] text-primary uppercase">{t("editor.lastEvidence")}</p>
                <p className="text-sm text-foreground/90">{evidenceDraft}</p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="space-y-4 rounded-2xl border border-border/70 bg-background/35 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              {module === "reading" ? <FileText className="size-4" /> : <AudioLines className="size-4" />}
              <p className="text-xs tracking-[0.12em] uppercase">{t("preview.activeContent")}</p>
            </div>
            <h3 className="text-2xl font-semibold tracking-tight">{structure.title}</h3>
            <div className="space-y-3">
              {structure.content.map((paragraph, index) => (
                <p key={`${structure.id}-${index}`} className="text-sm leading-7 text-foreground/90">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
