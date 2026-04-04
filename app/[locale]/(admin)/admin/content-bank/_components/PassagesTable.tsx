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
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import type {AdminTestSummary, ContentBankPassage} from "@/data/admin-content-bank"
import {cn} from "@/lib/utils"

type PassagesTableProps = {
  passages: ContentBankPassage[]
  testsById: Map<string, AdminTestSummary>
  selectedPassageId: string | null
  onSelectPassage: (passageId: string) => void
  onReadFullPassage: (passageId: string) => void
  onOpenCreateVariant: (passageId: string) => void
  onDeletePassage: (passageId: string) => void
}

function moduleBadgeClass(module: ContentBankPassage["module"]) {
  return module === "reading"
    ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
    : "border-violet-500/40 bg-violet-500/15 text-violet-300"
}

function difficultyClass(difficulty: ContentBankPassage["difficulty"]) {
  if (difficulty === "easy") return "border-emerald-500/45 bg-emerald-500/15 text-emerald-300"
  if (difficulty === "hard") return "border-rose-500/45 bg-rose-500/15 text-rose-300"
  return "border-amber-500/45 bg-amber-500/15 text-amber-300"
}

export function PassagesTable({
  passages,
  testsById,
  selectedPassageId,
  onSelectPassage,
  onReadFullPassage,
  onOpenCreateVariant,
  onDeletePassage
}: PassagesTableProps) {
  const t = useTranslations("adminContentBank")

  if (!passages.length) {
    return (
      <Card className="rounded-2xl border-border/70 bg-card/70 p-6">
        <p className="text-sm text-muted-foreground">{t("empty.passages")}</p>
      </Card>
    )
  }

  return (
    <>
      <Card className="hidden overflow-hidden rounded-2xl border-border/70 bg-card/70 p-0 lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border/80 bg-muted/25">
              <TableHead>{t("table.columns.titleAndModule")}</TableHead>
              <TableHead>{t("table.columns.difficulty")}</TableHead>
              <TableHead>{t("table.columns.topic")}</TableHead>
              <TableHead className="text-center">{t("table.columns.variants")}</TableHead>
              <TableHead>{t("table.columns.usedIn")}</TableHead>
              <TableHead className="w-14 text-right">{t("table.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {passages.map((passage) => {
              const usedTests = passage.usedInTestIds
                .map((testId) => testsById.get(testId))
                .filter((test): test is AdminTestSummary => Boolean(test))

              return (
                <TableRow
                  key={passage.id}
                  onClick={() => onSelectPassage(passage.id)}
                  className={cn(
                    "cursor-pointer border-border/70 hover:bg-muted/25",
                    selectedPassageId === passage.id && "bg-primary/10"
                  )}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-tight">{passage.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className={cn("border", moduleBadgeClass(passage.module))}>
                          {t(`modules.${passage.module}`)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {passage.module === "reading"
                            ? t("meta.wordCountShort", {count: passage.wordCount ?? 0})
                            : t("meta.durationShort", {count: passage.durationMinutes ?? 0})}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border", difficultyClass(passage.difficulty))}>
                      {t(`difficulty.${passage.difficulty}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{passage.topic}</TableCell>
                  <TableCell className="text-center text-base font-semibold">{passage.variantCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {usedTests.length ? (
                        usedTests.slice(0, 2).map((test) => (
                          <Badge key={test.id} variant="outline" className="border-border/80 bg-background/45 text-[11px]">
                            {test.name}
                          </Badge>
                        ))
                      ) : passage.usedInTestIds.length ? (
                        <Badge variant="outline" className="border-border/80 bg-background/45 text-[11px]">
                          {t("labels.usedInCount", {count: passage.usedInTestIds.length})}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("labels.notUsed")}</span>
                      )}
                      {usedTests.length > 2 ? (
                        <Badge variant="outline" className="border-border/80 bg-background/45 text-[11px]">
                          +{usedTests.length - 2}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                          <MoreVertical className="size-4" />
                          <span className="sr-only">{t("actions.openMenu")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onReadFullPassage(passage.id)}>{t("actions.readFullPassage")}</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onOpenCreateVariant(passage.id)}>{t("actions.createVariantSet")}</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDeletePassage(passage.id)}>
                          {t("actions.deletePassage")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="space-y-2 lg:hidden">
        {passages.map((passage) => (
          <Card
            key={passage.id}
            className={cn(
              "cursor-pointer rounded-2xl border-border/70 bg-card/70 p-4",
              selectedPassageId === passage.id && "border-primary/50 bg-primary/10"
            )}
            onClick={() => onSelectPassage(passage.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold leading-tight">{passage.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{passage.topic}</p>
              </div>
              <Badge variant="outline" className={cn("border", moduleBadgeClass(passage.module))}>
                {t(`modules.${passage.module}`)}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("border", difficultyClass(passage.difficulty))}>
                {t(`difficulty.${passage.difficulty}`)}
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/45">
                {t("labels.variantsCount", {count: passage.variantCount})}
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/45">
                {passage.usedInTestIds.length ? t("labels.usedInCount", {count: passage.usedInTestIds.length}) : t("labels.notUsed")}
              </Badge>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="h-8 rounded-lg border-border/70 bg-background/45 text-xs" onClick={() => onReadFullPassage(passage.id)}>
                {t("actions.readFullPassage")}
              </Button>
              <Button variant="outline" className="h-8 rounded-lg border-border/70 bg-background/45 text-xs" onClick={() => onOpenCreateVariant(passage.id)}>
                {t("actions.createVariantSet")}
              </Button>
              <Button
                variant="outline"
                className="h-8 rounded-lg border-border/70 bg-background/45 text-xs text-destructive"
                onClick={() => onDeletePassage(passage.id)}
              >
                {t("actions.deletePassage")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
