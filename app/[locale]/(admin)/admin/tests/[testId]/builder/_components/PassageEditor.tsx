"use client";

import {useMemo, useRef, useState} from "react";
import {AudioLines, FileText} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {BuilderMode, BuilderStructureItem, TestModule} from "@/data/admin-test-builder";
import type {ContentBankPassage, ContentBankVariantSet} from "@/data/admin/selectors";

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
  onUpdateAudioLabel: (structureId: string, audioLabel: string) => void;
  onAttachEvidence: (text: string) => boolean;
};

function textToParagraphs(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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
  onUpdateAudioLabel,
  onAttachEvidence
}: PassageEditorProps) {
  const t = useTranslations("adminTestBuilder");
  const [evidenceDraft, setEvidenceDraft] = useState("");
  const textValue = useMemo(() => structure.content.join("\n\n"), [structure.content]);
  const textRef = useRef<HTMLTextAreaElement>(null);

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
                console.info("[builder] format click", format);
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

            <textarea
              ref={textRef}
              value={textValue}
              onChange={(event) => onUpdateContent(structure.id, textToParagraphs(event.target.value))}
              className="min-h-[420px] w-full resize-y rounded-2xl border border-border/70 bg-background/45 px-4 py-3 text-sm leading-7 outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            />

            {module === "listening" ? (
              <div className="space-y-2 rounded-2xl border border-border/70 bg-background/35 p-3">
                <label className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{t("editor.audioLabel")}</label>
                <Input
                  value={structure.audioLabel ?? ""}
                  onChange={(event) => onUpdateAudioLabel(structure.id, event.target.value)}
                  placeholder={t("editor.audioPlaceholder")}
                  className="h-9 rounded-lg border-border/70 bg-background/50"
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
