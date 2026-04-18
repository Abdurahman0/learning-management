"use client";

import {ChevronRight} from "lucide-react";
import {useTranslations} from "next-intl";
import type {ReactNode} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import type {BuilderMode, BuilderStatus, TestDifficulty, TestModule} from "@/data/admin-test-builder";

type PracticeSource = "custom" | "real" | "cambridge";

type BuilderTopbarProps = {
  bookName: string;
  testTitle: string;
  testDifficulty: TestDifficulty;
  testPracticeSource?: PracticeSource;
  testRegisteredOnly?: boolean;
  module: TestModule;
  mode: BuilderMode;
  status: BuilderStatus;
  questionProgressLabel?: string;
  publishDisabled?: boolean;
  isPersisting?: boolean;
  mobileNav?: ReactNode;
  onOpenFullListeningAudio?: () => void;
  onTestTitleChange: (title: string) => void;
  onTestDifficultyChange: (value: TestDifficulty) => void;
  onTestPracticeSourceChange?: (value: PracticeSource) => void;
  onTestRegisteredOnlyChange?: (value: boolean) => void;
  onModeChange: (mode: BuilderMode) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
};

export function BuilderTopbar({
  bookName,
  testTitle,
  testDifficulty,
  testPracticeSource = "custom",
  testRegisteredOnly = false,
  module,
  mode,
  status,
  questionProgressLabel,
  publishDisabled = false,
  isPersisting = false,
  mobileNav,
  onOpenFullListeningAudio,
  onTestTitleChange,
  onTestDifficultyChange,
  onTestPracticeSourceChange,
  onTestRegisteredOnlyChange,
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

          <div className="flex flex-wrap items-end gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                {t("topbar.sourceLabel")}
              </p>
              <Select
                value={testPracticeSource}
                onValueChange={(value) => onTestPracticeSourceChange?.(value as PracticeSource)}
                disabled={isPersisting || !onTestPracticeSourceChange}
              >
                <SelectTrigger className="h-9 w-[220px] rounded-xl border-border/70 bg-card/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">{t("topbar.sources.custom")}</SelectItem>
                  <SelectItem value="cambridge">{t("topbar.sources.cambridge")}</SelectItem>
                  <SelectItem value="real">{t("topbar.sources.real")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-tight">{t("topbar.visibilityLabel")}</p>
                  <p className="text-xs text-muted-foreground">{t("topbar.registeredOnlyHint")}</p>
                </div>
                <Switch
                  checked={testRegisteredOnly}
                  onCheckedChange={(checked) => onTestRegisteredOnlyChange?.(Boolean(checked))}
                  disabled={isPersisting || !onTestRegisteredOnlyChange}
                  aria-label={t("topbar.visibilityLabel")}
                />
              </div>
            </div>
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

          {module === "listening" && onOpenFullListeningAudio ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-border/70 bg-card/50"
              onClick={onOpenFullListeningAudio}
              disabled={isPersisting}
            >
              {t("fullListeningAudio.button")}
            </Button>
          ) : null}

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
