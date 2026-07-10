"use client";

import {ChevronDown, Clock3, ExternalLink, ListChecks, Lock, Youtube} from "lucide-react";
import {useState, type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import type {ReadingGuestTest} from "../tests/types";
import {resolveTestLockReason} from "../tests/lockState";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import {DifficultySignal} from "../guest-tests/DifficultySignal";

type ReadingTestCardProps = {
  test: ReadingGuestTest;
  isUserPremium?: boolean;
  isGuest?: boolean;
  action?: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    label: string;
    icon?: ReactNode;
    loading?: boolean;
    onClick: () => void;
  };
  resourceLink?: {
    href: string;
    label: string;
  };
  badgeLabel?: string;
};

export function ReadingTestCard({test, isUserPremium = false, isGuest = false, action, secondaryAction, resourceLink, badgeLabel}: ReadingTestCardProps) {
  const t = useTranslations("guest");
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const lockReason = resolveTestLockReason({isPremium: test.isPremium, isAccessible: test.isAccessible, isUserPremium});
  const isLocked = lockReason !== null;
  const lockHref = lockReason === "premium" && !isGuest ? `/${locale}/upgrade` : `/${locale}/register`;
  const lockCtaLabel = lockReason === "premium"
    ? (isGuest ? t("card.signUpToUnlockPremium") : t("card.upgradeToUnlock"))
    : t("card.signUpToSolve");
  const scopedPassage = test.testFormat === "part" && test.passages.length === 1 ? test.passages[0] : null;
  const practiceHref = scopedPassage?.id
    ? `/${locale}/reading/${test.id}?mode=practice&passageId=${encodeURIComponent(scopedPassage.id)}`
    : `/${locale}/reading/${test.id}?mode=practice`;
  const realHref = scopedPassage?.id
    ? `/${locale}/reading/${test.id}?mode=real&passageId=${encodeURIComponent(scopedPassage.id)}`
    : `/${locale}/reading/${test.id}?mode=real`;

  return (
    <Card className={cn("border-border bg-card py-0 shadow-sm", isLocked && "opacity-85", isOpen && !isLocked && "border-blue-600")}>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left"
        >
          <div className="min-w-0">
            <Badge
              variant="secondary"
              className={cn(
                "h-6 rounded-md px-2.5 text-[11px] font-semibold tracking-wide uppercase",
                isLocked
                  ? lockReason === "premium"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                    : "bg-muted text-muted-foreground"
                  : test.isPremium
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
              )}
            >
              {isLocked ? (
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="size-3" aria-hidden="true" />
                  {lockReason === "premium" ? t("card.premium") : t("card.membersOnly")}
                </span>
              ) : test.isPremium ? (
                <span className="inline-flex items-center gap-1.5">
                  {t("card.premium")}
                </span>
              ) : (
                badgeLabel ?? t("card.free")
              )}
            </Badge>

            <h3 className={cn("mt-2 truncate text-lg font-semibold text-foreground", isLocked && "text-muted-foreground")}>{test.title}</h3>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4" aria-hidden="true" />
                {test.durationMinutes} {t("meta.minutes")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ListChecks className="size-4" aria-hidden="true" />
                {test.totalQuestions} {t("meta.questions")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs">
                <DifficultySignal difficulty={test.difficulty} />
                {t(`filters.${test.difficulty}`)}
              </span>
              {typeof test.lastAccuracyPercent === "number" ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  {t("card.lastAccuracy")}: {Math.round(test.lastAccuracyPercent)}%
                </span>
              ) : null}
            </div>
          </div>

          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
        </button>

        {isOpen && (
          <div className="border-t border-border px-4 py-4">
            {!scopedPassage ? (
              <div className="grid gap-2.5 sm:grid-cols-3">
                {test.passages.map((passage, index) => (
                  <div key={`${passage.id ?? passage.title}-${index}`} className="rounded-lg border border-border bg-background px-3 py-2.5">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{t("card.passage")} {index + 1}</p>
                    <p className="mt-1.5 text-sm font-medium text-foreground">{passage.title}</p>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{passage.questionsCount} {t("meta.questions")}</span>
                      <span>|</span>
                      <DifficultySignal difficulty={passage.difficulty} />
                      <span>{t(`filters.${passage.difficulty}`)}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-3.5">
              {isLocked ? (
                <Button
                  type="button"
                  onClick={() => router.push(lockHref)}
                  className={cn(
                    "h-10 w-full rounded-xl text-sm font-semibold",
                    lockReason === "premium"
                      ? "bg-amber-500 text-white hover:bg-amber-500/90"
                      : "bg-blue-600 text-white hover:bg-blue-600/90"
                  )}
                >
                  <Lock className="mr-2 size-4" aria-hidden="true" />
                  {lockCtaLabel}
                </Button>
              ) : action ? (
                <div className={cn("grid gap-2", secondaryAction && "grid-cols-[1fr_auto]")}>
                  <Button
                    type="button"
                    onClick={() => router.push(action.href)}
                    className="h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-600/90"
                  >
                    {action.label}
                  </Button>
                  {secondaryAction ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={secondaryAction.loading}
                      onClick={secondaryAction.onClick}
                      className="h-10 rounded-xl text-sm font-semibold"
                    >
                      {secondaryAction.icon}
                      {secondaryAction.label}
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(practiceHref)}
                    className="h-10 w-full rounded-xl text-sm font-semibold"
                  >
                    Practice
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.push(realHref)}
                    className="h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-600/90"
                  >
                    Real
                  </Button>
                </div>
              )}
              {resourceLink ? (
                <a
                  href={resourceLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 flex min-h-10 w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2.5 text-left transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 dark:border-red-400/20 dark:bg-red-500/8 dark:hover:bg-red-500/12"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
                    <Youtube className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 dark:text-red-300">{t("card.videoResource")}</span>
                    <span className="block truncate text-sm font-semibold text-foreground">{resourceLink.label || t("card.watchVideo")}</span>
                  </span>
                  <ExternalLink className="size-4 shrink-0 text-red-500" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


