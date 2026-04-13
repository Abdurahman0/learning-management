"use client";

import {ChevronRight} from "lucide-react";
import {useTranslations} from "next-intl";
import type {ReactNode} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {BuilderMode, BuilderStatus, TestDifficulty, TestModule} from "@/data/admin-test-builder";

type BuilderTopbarProps = {
  bookName: string;
  testTitle: string;
  testDifficulty: TestDifficulty;
  module: TestModule;
  mode: BuilderMode;
  status: BuilderStatus;
  questionProgressLabel?: string;
  publishDisabled?: boolean;
  isPersisting?: boolean;
  mobileNav?: ReactNode;
  onTestTitleChange: (title: string) => void;
  onTestDifficultyChange: (value: TestDifficulty) => void;
  onModeChange: (mode: BuilderMode) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
};

export function BuilderTopbar({
  bookName,
  testTitle,
  testDifficulty,
  module,
  mode,
  status,
  questionProgressLabel,
  publishDisabled = false,
  isPersisting = false,
  mobileNav,
  onTestTitleChange,
  onTestDifficultyChange,
  onModeChange,
  onSaveDraft,
  onPublish
}: BuilderTopbarProps) {
  const t = useTranslations("adminTestBuilder");

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 lg:hidden">{mobileNav}</div>
          <div className="flex items-center gap-1 text-xs tracking-[0.12em] text-muted-foreground uppercase">
            <span>{t("topbar.breadcrumb.tests")}</span>
            <ChevronRight className="size-3.5" />
            <span className="truncate">{bookName}</span>
            <ChevronRight className="size-3.5" />
            <span>{t(`topbar.breadcrumb.builder.${module}`)}</span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">{t("topbar.title")}</h1>
            <Badge className="rounded-md border border-border/70 bg-muted/35 px-2 py-0.5 text-[10px] tracking-wide uppercase">
              {t(`status.${status}`)}
            </Badge>
            {questionProgressLabel ? (
              <Badge className="rounded-md border border-primary/35 bg-primary/12 px-2 py-0.5 text-[10px] tracking-wide text-primary uppercase">
                {questionProgressLabel}
              </Badge>
            ) : null}
          </div>

          <div className="max-w-2xl pt-1">
            <Input
              value={testTitle}
              onChange={(event) => onTestTitleChange(event.target.value)}
              placeholder={t("topbar.testTitlePlaceholder")}
              aria-label={t("topbar.testTitleLabel")}
              className="h-9 bg-card/70"
              disabled={isPersisting}
            />
          </div>

          <div className="max-w-2xl pt-1">
            <p className="mb-1 text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
              {t("topbar.difficultyLabel")}
            </p>
            <Select
              value={testDifficulty}
              onValueChange={(value) => onTestDifficultyChange(value as TestDifficulty)}
              disabled={isPersisting}
            >
              <SelectTrigger className="h-9 w-[220px] rounded-xl border-border/70 bg-card/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">{t("difficulty.beginner")}</SelectItem>
                <SelectItem value="intermediate">{t("difficulty.intermediate")}</SelectItem>
                <SelectItem value="advanced">{t("difficulty.advanced")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-border/70 bg-card/60 p-1">
            <Button
              type="button"
              size="sm"
              variant={mode === "editor" ? "secondary" : "ghost"}
              className="h-8 rounded-lg"
              onClick={() => onModeChange("editor")}
              disabled={isPersisting}
            >
              {t("topbar.mode.editor")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "preview" ? "secondary" : "ghost"}
              className="h-8 rounded-lg"
              onClick={() => onModeChange("preview")}
              disabled={isPersisting}
            >
              {t("topbar.mode.preview")}
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-xl border-border/70 bg-card/50"
            onClick={onSaveDraft}
            disabled={isPersisting}
          >
            {t("topbar.actions.saveDraft")}
          </Button>
          <Button type="button" className="h-9 rounded-xl" onClick={onPublish} disabled={publishDisabled || isPersisting}>
            {t("topbar.actions.publish")}
          </Button>
        </div>
      </div>
    </header>
  );
}
