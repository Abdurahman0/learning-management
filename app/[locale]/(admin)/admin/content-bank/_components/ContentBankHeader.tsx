"use client"

import {Bell, FileUp, Plus, Search, Sparkles} from "lucide-react"
import {useTranslations} from "next-intl"

import {ThemeToggle} from "@/components/theme-toggle"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Separator} from "@/components/ui/separator"

import {AdminProfileMenu} from "../../_components/AdminProfileMenu"
import {AdminSidebarMobileNav} from "../../_components/AdminSidebar"

type ContentBankHeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  onImportCsv: () => void
  onAddNewPassage: () => void
  onQuickPublish: () => void
}

export function ContentBankHeader({
  searchValue,
  onSearchChange,
  onImportCsv,
  onAddNewPassage,
  onQuickPublish
}: ContentBankHeaderProps) {
  const t = useTranslations("adminContentBank")

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <AdminSidebarMobileNav />

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10 rounded-xl border-border/70 bg-card/55 pl-9 focus-visible:ring-primary/35"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            aria-label={t("notificationsLabel")}
          >
            <Bell className="size-4.5" />
            <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-rose-500" />
          </Button>
          <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />
          <AdminProfileMenu />
        </div>
      </div>

      <div className="border-t border-border/60 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
            <p className="text-sm text-muted-foreground sm:text-base">{t("subtitle")}</p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
            <Button variant="outline" className="h-10 rounded-xl border-border/70 bg-card/55 px-4 font-semibold" onClick={onImportCsv}>
              <FileUp className="size-4" />
              {t("importCsv")}
            </Button>
            <Button variant="outline" className="h-10 rounded-xl border-border/70 bg-card/55 px-4 font-semibold" onClick={onQuickPublish}>
              <Sparkles className="size-4" />
              {t("quickPublish")}
            </Button>
            <Button className="h-10 rounded-xl px-4 font-semibold" onClick={onAddNewPassage}>
              <Plus className="size-4" />
              {t("addNewPassage")}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

