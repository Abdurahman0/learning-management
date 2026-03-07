"use client"

import {ArrowRight, Info} from "lucide-react"
import {useTranslations} from "next-intl"

import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import type {ContentBankMeta} from "@/data/admin-content-bank"

type PlatformRuleBannerProps = {
  meta: ContentBankMeta
  onViewGuidelines: () => void
}

export function PlatformRuleBanner({meta, onViewGuidelines}: PlatformRuleBannerProps) {
  const t = useTranslations("adminContentBank")

  return (
    <Card className="rounded-2xl border-primary/35 bg-primary/8 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <Info className="size-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">{t("platformRule.title")}</p>
          <p className="text-sm text-muted-foreground">{t("platformRule.description")}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="border-border/70 bg-background/40">
              {t("meta.linkedTests", {count: meta.linkedTestsCount})}
            </Badge>
            <Badge variant="outline" className="border-border/70 bg-background/40">
              {t("meta.activeLearners", {count: meta.activeLearnersCount})}
            </Badge>
            <Badge variant="outline" className="border-border/70 bg-background/40">
              {t("meta.achievementTracks", {count: meta.achievementTracksCount})}
            </Badge>
          </div>
        </div>

        <Button variant="ghost" className="h-9 rounded-xl px-2.5 text-primary hover:bg-primary/10" onClick={onViewGuidelines}>
          {t("viewGuidelines")}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </Card>
  )
}

