"use client"

import {useTranslations} from "next-intl"

import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs"
import type {ContentBankTab} from "@/data/admin-content-bank"

type ContentBankTabsProps = {
  activeTab: ContentBankTab
  onTabChange: (value: ContentBankTab) => void
  passageCount: number
  variantCount: number
}

export function ContentBankTabs({activeTab, onTabChange, passageCount, variantCount}: ContentBankTabsProps) {
  const t = useTranslations("adminContentBank")

  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ContentBankTab)}>
      <TabsList className="h-auto w-full justify-start gap-1 rounded-xl border border-border/70 bg-card/60 p-1">
        <TabsTrigger value="passages" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
          {t("tabs.passageBank")}
          <span className="ml-1.5 text-xs text-muted-foreground">{passageCount}</span>
        </TabsTrigger>
        <TabsTrigger value="variants" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
          {t("tabs.questionVariants")}
          <span className="ml-1.5 text-xs text-muted-foreground">{variantCount}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
