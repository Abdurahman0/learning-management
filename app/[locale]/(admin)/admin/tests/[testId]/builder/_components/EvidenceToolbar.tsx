"use client";

import {Bold, Highlighter, Italic, Link2, Underline} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";

type EvidenceToolbarProps = {
  onFormatClick: (format: "bold" | "italic" | "underline" | "link") => void;
  onAddEvidence: () => void;
  addEvidenceDisabled: boolean;
};

export function EvidenceToolbar({onFormatClick, onAddEvidence, addEvidenceDisabled}: EvidenceToolbarProps) {
  const t = useTranslations("adminTestBuilder");

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-background/50 p-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-lg"
        onClick={() => onFormatClick("bold")}
        aria-label={t("editor.toolbar.bold")}
      >
        <Bold className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-lg"
        onClick={() => onFormatClick("italic")}
        aria-label={t("editor.toolbar.italic")}
      >
        <Italic className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-lg"
        onClick={() => onFormatClick("underline")}
        aria-label={t("editor.toolbar.underline")}
      >
        <Underline className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-lg"
        onClick={() => onFormatClick("link")}
        aria-label={t("editor.toolbar.link")}
      >
        <Link2 className="size-4" />
      </Button>

      <div className="mx-1 h-6 w-px bg-border/70" />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-lg border-primary/35 bg-primary/10 text-primary hover:bg-primary/15"
        onClick={onAddEvidence}
        disabled={addEvidenceDisabled}
      >
        <Highlighter className="size-3.5" />
        {t("editor.toolbar.addEvidence")}
      </Button>
    </div>
  );
}

