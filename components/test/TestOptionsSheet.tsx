"use client";

import { Check, Maximize, Minimize } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
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
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

export function TestOptionsSheet({
  open,
  onOpenChange,
  isCompact,
  appearance,
  onContrastChange,
  onTextSizeChange,
  isFullscreen,
  onToggleFullscreen,
}: TestOptionsSheetProps) {
  const t = useTranslations("testOptions");

  const contrastOptions: Array<{ value: TestContrastMode; label: string }> = [
    { value: "default", label: t("contrastDefault") },
    { value: "high", label: t("contrastHigh") },
  ];

  const textSizeOptions: Array<{ value: TestTextSize; label: string }> = [
    { value: "small", label: t("textSizeSmall") },
    { value: "medium", label: t("textSizeMedium") },
    { value: "large", label: t("textSizeLarge") },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isCompact ? "bottom" : "right"}
        className={cn(
          "gap-0 overflow-x-hidden border-border/80 bg-card p-0",
          isCompact ? "max-h-[88vh] rounded-t-2xl" : "sm:max-w-md",
        )}
      >
        <SheetHeader className="border-b border-border/80 px-5 pb-4 pt-5">
          <SheetTitle className="text-lg">{t("title")}</SheetTitle>
          <SheetDescription className="text-sm">
            {t("description")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-5 pb-5 pt-4">
          <Card className="test-panel gap-3 rounded-2xl border-border/70 bg-card p-3 shadow-none">
            <div>
              <p className="text-sm font-semibold">{t("contrast")}</p>
              <p className="test-muted-copy mt-0.5 text-xs text-muted-foreground">
                {t("contrastHint")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {contrastOptions.map((option) => {
                const active = appearance.contrast === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={active ? "default" : "outline"}
                    onClick={() => onContrastChange(option.value)}
                    className={cn(
                      "h-9 justify-between rounded-xl px-3 text-sm",
                      !active && "bg-background",
                    )}
                    aria-pressed={active}
                  >
                    <span>{option.label}</span>
                    {active ? <Check className="size-4" /> : null}
                  </Button>
                );
              })}
            </div>
          </Card>

          <Card className="test-panel gap-3 rounded-2xl border-border/70 bg-card p-3 shadow-none">
            <div>
              <p className="text-sm font-semibold">{t("textSize")}</p>
              <p className="test-muted-copy mt-0.5 text-xs text-muted-foreground">
                {t("textSizeHint")}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {textSizeOptions.map((option) => {
                const active = appearance.textSize === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={active ? "default" : "outline"}
                    onClick={() => onTextSizeChange(option.value)}
                    className={cn(
                      "h-9 rounded-xl px-3 text-sm",
                      !active && "bg-background",
                    )}
                    aria-pressed={active}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </Card>

          <Card className="test-panel gap-3 rounded-2xl border-border/70 bg-card p-3 shadow-none">
            <div>
              <p className="text-sm font-semibold">{t("fullscreen")}</p>
              <p className="test-muted-copy mt-0.5 text-xs text-muted-foreground">
                {t("fullscreenHint")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onToggleFullscreen}
              className="h-9 justify-start rounded-xl border-border/70 bg-background px-3 text-sm"
            >
              {isFullscreen ? (
                <Minimize className="size-4" />
              ) : (
                <Maximize className="size-4" />
              )}
              {isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
            </Button>
          </Card>

          <div className="flex justify-end">
            <SheetClose asChild>
              <Button type="button" variant="ghost" className="h-9 rounded-xl">
                {t("close")}
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
