"use client"

import {BookOpenText, Plus} from "lucide-react"
import {useTranslations} from "next-intl"

import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import type {ContentBankPassage, ContentBankVariantSet} from "@/data/admin-content-bank"

import {VariantGroupsList} from "./VariantGroupsList"

type SelectedPassagePanelProps = {
  passage: ContentBankPassage | null
  variants: ContentBankVariantSet[]
  onReadFullPassage: (passageId: string) => void
  onCreateNewVariant: (passageId: string) => void
  onPreviewVariant: (variantId: string) => void
  onDuplicateVariant: (variantId: string) => void
  onArchiveVariant: (variantId: string) => void
}

export function SelectedPassagePanel({
  passage,
  variants,
  onReadFullPassage,
  onCreateNewVariant,
  onPreviewVariant,
  onDuplicateVariant,
  onArchiveVariant
}: SelectedPassagePanelProps) {
  const t = useTranslations("adminContentBank")

  if (!passage) {
    return (
      <Card className="rounded-2xl border-border/70 bg-card/70 p-5">
        <p className="text-sm text-muted-foreground">{t("empty.selectPassage")}</p>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border-border/70 bg-card/70 p-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{t("selectedPassage")}</p>
        <h3 className="text-xl font-semibold tracking-tight">{passage.title}</h3>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Card className="rounded-xl border-border/70 bg-background/45 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("wordCount")}</p>
          <p className="mt-0.5 text-sm font-semibold">{passage.wordCount ?? "-"}</p>
        </Card>
        <Card className="rounded-xl border-border/70 bg-background/45 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("estimatedTime")}</p>
          <p className="mt-0.5 text-sm font-semibold">{passage.estimatedTimeLabel ?? "-"}</p>
        </Card>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="border-border/70 bg-background/45">
          {t(`modules.${passage.module}`)}
        </Badge>
        <Badge variant="outline" className="border-border/70 bg-background/45">
          {t(`difficulty.${passage.difficulty}`)}
        </Badge>
        <Badge variant="outline" className="border-border/70 bg-background/45">
          {passage.topic}
        </Badge>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm font-semibold">{t("passagePreview")}</p>
        <Card className="rounded-xl border-dashed border-border/80 bg-background/45 p-3">
          <p className="line-clamp-5 text-sm text-muted-foreground">{passage.previewText}</p>
        </Card>
        <Button variant="link" className="h-auto p-0 text-sm text-primary" onClick={() => onReadFullPassage(passage.id)}>
          <BookOpenText className="size-4" />
          {t("readFullPassage")}
        </Button>
      </div>

      <div className="mt-5 border-t border-border/70 pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{t("questionVariantGroups")}</p>
          <Button variant="ghost" className="h-8 rounded-lg px-2 text-primary" onClick={() => onCreateNewVariant(passage.id)}>
            <Plus className="size-4" />
            {t("createNew")}
          </Button>
        </div>
        <VariantGroupsList
          variants={variants}
          onPreviewVariant={onPreviewVariant}
          onDuplicateVariant={onDuplicateVariant}
          onArchiveVariant={onArchiveVariant}
        />
      </div>
    </Card>
  )
}

