"use client"

import {MoreVertical} from "lucide-react"
import {useTranslations} from "next-intl"

import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import type {ContentBankVariantSet} from "@/data/admin-content-bank"
import {cn} from "@/lib/utils"

type QuestionVariantsTableProps = {
  variants: ContentBankVariantSet[]
  onEdit: (variantId: string) => void
  onArchive: (variantId: string) => void
}

function statusClass(status: ContentBankVariantSet["status"]) {
  if (status === "used") return "border-blue-500/45 bg-blue-500/15 text-blue-300"
  if (status === "published") return "border-emerald-500/45 bg-emerald-500/15 text-emerald-300"
  return "border-amber-500/45 bg-amber-500/15 text-amber-300"
}

export function QuestionVariantsTable({variants, onEdit, onArchive}: QuestionVariantsTableProps) {
  const t = useTranslations("adminContentBank")

  if (!variants.length) {
    return (
      <Card className="rounded-2xl border-border/70 bg-card/70 p-6">
        <p className="text-sm text-muted-foreground">{t("empty.variants")}</p>
      </Card>
    )
  }

  return (
    <>
      <Card className="hidden overflow-hidden rounded-2xl border-border/70 bg-card/70 p-0 lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border/80 bg-muted/25">
              <TableHead>{t("variantsTable.columns.variantSet")}</TableHead>
              <TableHead>{t("variantsTable.columns.passage")}</TableHead>
              <TableHead>{t("variantsTable.columns.module")}</TableHead>
              <TableHead>{t("variantsTable.columns.questionTypes")}</TableHead>
              <TableHead>{t("variantsTable.columns.status")}</TableHead>
              <TableHead>{t("variantsTable.columns.usedInTest")}</TableHead>
              <TableHead className="w-14 text-right">{t("variantsTable.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id} className="border-border/70 hover:bg-muted/25">
                <TableCell className="font-semibold">{variant.name}</TableCell>
                <TableCell className="max-w-[220px] text-sm text-muted-foreground">{variant.passageTitle}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border", variant.module === "reading" ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-violet-500/40 bg-violet-500/15 text-violet-300")}>
                    {t(`modules.${variant.module}`)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[280px] text-sm text-muted-foreground">{variant.questionTypesSummary}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border", statusClass(variant.status))}>
                    {t(`status.${variant.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {variant.usedInTests.length ? (
                      variant.usedInTests.map((test) => (
                        <Badge key={`${variant.id}-${test.id}`} variant="outline" className="border-border/70 bg-background/45 text-[11px]">
                          {test.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("labels.notUsed")}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                        <MoreVertical className="size-4" />
                        <span className="sr-only">{t("actions.openMenu")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEdit(variant.id)}>{t("actions.edit")}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-rose-400 focus:text-rose-300" onSelect={() => onArchive(variant.id)}>
                        {t("actions.archive")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="space-y-2 lg:hidden">
        {variants.map((variant) => (
          <Card key={variant.id} className="rounded-2xl border-border/70 bg-card/70 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{variant.name}</p>
                <p className="text-xs text-muted-foreground">{variant.passageTitle}</p>
              </div>
              <Badge variant="outline" className={cn("border", statusClass(variant.status))}>
                {t(`status.${variant.status}`)}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{variant.questionTypesSummary}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="h-8 rounded-lg border-border/70 bg-background/45 text-xs" onClick={() => onEdit(variant.id)}>
                {t("actions.edit")}
              </Button>
              <Button variant="outline" className="h-8 rounded-lg border-border/70 bg-background/45 text-xs text-rose-400" onClick={() => onArchive(variant.id)}>
                {t("actions.archive")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
