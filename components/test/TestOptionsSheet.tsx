"use client";

import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  TestAppearanceState,
  TestContrastMode,
  TestTextSize,
} from "@/lib/test-appearance";
import { cn } from "@/lib/utils";

type TestOptionsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCompact: boolean;
  appearance: TestAppearanceState;
  onContrastChange: (contrast: TestContrastMode) => void;
  onTextSizeChange: (size: TestTextSize) => void;
};

export function TestOptionsSheet({
  open,
  onOpenChange,
  isCompact,
  appearance,
  onContrastChange,
  onTextSizeChange,
}: TestOptionsSheetProps) {
  const t = useTranslations("testOptions");
  const [view, setView] = useState<"root" | "contrast" | "textSize">("root");

  const contrastOptions: Array<{ value: TestContrastMode; label: string }> = [
    { value: "black-on-white", label: t("contrastBlackOnWhite") },
    { value: "white-on-black", label: t("contrastWhiteOnBlack") },
    { value: "yellow-on-black", label: t("contrastYellowOnBlack") },
  ];

  const textSizeOptions: Array<{ value: TestTextSize; label: string }> = [
    { value: "small", label: t("textSizeSmall") },
    { value: "medium", label: t("textSizeMedium") },
    { value: "large", label: t("textSizeLarge") },
  ];

  const panelTitle = useMemo(() => {
    if (view === "contrast") {
      return t("contrast");
    }
    if (view === "textSize") {
      return t("textSize");
    }
    return t("title");
  }, [t, view]);

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setView("root");
        }
        onOpenChange(nextOpen);
      }}
    >
      <SheetContent
        side={isCompact ? "bottom" : "right"}
        className={cn(
          "gap-0 overflow-x-hidden border-border/80 bg-card p-0",
          isCompact ? "max-h-[88vh] rounded-t-2xl" : "sm:max-w-md",
        )}
      >
        <SheetTitle className="sr-only">{panelTitle}</SheetTitle>
        <div className="border-b border-border/80 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {view !== "root" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setView("root")}
                  className="size-8 rounded-lg"
                  aria-label={t("back")}
                >
                  <ArrowLeft className="size-4" />
                </Button>
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{panelTitle}</p>
                {view === "root" ? (
                  <p className="test-muted-copy mt-0.5 text-xs text-muted-foreground">
                    {t("description")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          {view === "root" ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="test-panel h-auto w-full justify-between rounded-xl border-border/70 bg-background p-3 text-left"
                onClick={() => setView("contrast")}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t("contrast")}</span>
                  <span className="test-muted-copy mt-0.5 block truncate text-xs text-muted-foreground">
                    {t("contrastHint")}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="test-panel h-auto w-full justify-between rounded-xl border-border/70 bg-background p-3 text-left"
                onClick={() => setView("textSize")}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t("textSize")}</span>
                  <span className="test-muted-copy mt-0.5 block truncate text-xs text-muted-foreground">
                    {t("textSizeHint")}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0" />
              </Button>
            </>
          ) : null}

          {view === "contrast"
            ? contrastOptions.map((option) => {
                const active = appearance.contrast === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={active ? "default" : "outline"}
                    onClick={() => onContrastChange(option.value)}
                    className={cn(
                      "h-10 w-full justify-between rounded-xl px-3 text-sm",
                      !active && "bg-background",
                    )}
                    aria-pressed={active}
                  >
                    <span>{option.label}</span>
                    {active ? <Check className="size-4" /> : null}
                  </Button>
                );
              })
            : null}

          {view === "textSize"
            ? textSizeOptions.map((option) => {
                const active = appearance.textSize === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={active ? "default" : "outline"}
                    onClick={() => onTextSizeChange(option.value)}
                    className={cn(
                      "h-10 w-full justify-between rounded-xl px-3 text-sm",
                      !active && "bg-background",
                    )}
                    aria-pressed={active}
                  >
                    <span>{option.label}</span>
                    {active ? <Check className="size-4" /> : null}
                  </Button>
                );
              })
            : null}

        </div>
      </SheetContent>
    </Sheet>
  );
}
