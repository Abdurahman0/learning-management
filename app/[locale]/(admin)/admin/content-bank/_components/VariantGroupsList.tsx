"use client"

import {MoreVertical} from "lucide-react"
import {useTranslations} from "next-intl"

import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu"
import type {ContentBankVariantSet} from "@/data/admin-content-bank"
import {isVariantCompatibleWithSlot} from "@/data/admin/selectors"
import {cn} from "@/lib/utils"

type VariantGroupsListProps = {
  variants: ContentBankVariantSet[]
  onPreviewVariant: (variantId: string) => void
  onArchiveVariant: (variantId: string) => void
}

function statusClass(status: ContentBankVariantSet["status"]) {
  if (status === "used") return "border-blue-500/45 bg-blue-500/15 text-blue-300"
  if (status === "published") return "border-emerald-500/45 bg-emerald-500/15 text-emerald-300"
  return "border-amber-500/45 bg-amber-500/15 text-amber-300"
}

function getSlotIndexes(module: ContentBankVariantSet["module"]) {
  return module === "reading" ? [1, 2, 3] : [1, 2, 3, 4]
}

export function VariantGroupsList({
  variants,
  onPreviewVariant,
  onArchiveVariant
}: VariantGroupsListProps) {
  const t = useTranslations("adminContentBank")

  if (!variants.length) {
    return <p className="text-sm text-muted-foreground">{t("empty.variantGroups")}</p>
  }

  return (
    <div className="space-y-2.5">
      {variants.map((variant) => {
        const slotIndexes = getSlotIndexes(variant.module)
        const compatible = slotIndexes.filter((slotIndex) => isVariantCompatibleWithSlot(variant.module, slotIndex, variant))
        const incompatible = slotIndexes.filter((slotIndex) => !compatible.includes(slotIndex))
        const slotLabel = (slotIndex: number) =>
          variant.module === "reading"
            ? t("labels.passageSlot", {index: slotIndex})
            : t("labels.sectionSlot", {index: slotIndex})

        return (
          <Card key={variant.id} className="rounded-xl border-border/70 bg-background/35 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{variant.name}</p>
              <p className="text-xs text-muted-foreground">{variant.questionTypesSummary}</p>
              <p className="text-[11px] text-emerald-300">
                {t("compatibleWith", {
                  slots: compatible.length ? compatible.map(slotLabel).join(", ") : t("labels.none")
                })}
              </p>
              <p className="text-[11px] text-amber-300">
                {t("notCompatibleWith", {
                  slots: incompatible.length ? incompatible.map(slotLabel).join(", ") : t("labels.none")
                })}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={cn("border", statusClass(variant.status))}>
                {t(`status.${variant.status}`)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 rounded-lg">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">{t("actions.openMenu")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onPreviewVariant(variant.id)}>{t("actions.previewQuestions")}</DropdownMenuItem>
                  <DropdownMenuItem className="text-rose-400 focus:text-rose-300" onSelect={() => onArchiveVariant(variant.id)}>
                    {t("actions.archive")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {variant.usedInTests.length ? (
              variant.usedInTests.map((test) => (
                <Badge key={`${variant.id}-${test.id}`} variant="outline" className="border-border/70 bg-card/45 text-[11px]">
                  {test.name}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">{t("labels.notUsed")}</span>
            )}
          </div>
          </Card>
        )
      })}
    </div>
  )
}
