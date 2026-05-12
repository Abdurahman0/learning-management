"use client";

import Link from "next/link";
import {Suspense, useEffect, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {AlertCircle, Clock3, MailCheck, ShieldCheck} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {authApi} from "@/lib/api/auth";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

import {AuthFlowShell} from "../auth/components/AuthFlowShell";

type ActivateState = "idle" | "loading" | "success" | "error" | "missing" | "email_sent" | "rate_limited";

const RESEND_COOLDOWN_SECONDS = 60;

function ActivatePageContent() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const emailFromQuery = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const [state, setState] = useState<ActivateState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendStatusType, setResendStatusType] = useState<"success" | "error" | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!emailFromQuery) return;
    setResendEmail(emailFromQuery.toLowerCase());
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }, [emailFromQuery]);

  useEffect(() => {
    let isCancelled = false;

    const activateAccount = async () => {
      if (!token) {
        setState(emailFromQuery ? "email_sent" : "missing");
        setStatusMessage(emailFromQuery ? null : t("activation.missingToken"));
        return;
      }

      setState("loading");
      setStatusMessage(null);

      const response = await authApi.activate({token});

      if (isCancelled) {
        return;
      }

      if (response.ok) {
        setState("success");
        setStatusMessage(response.detail ?? t("activation.success"));
        return;
      }

      if (response.status === 429) {
        setState("rate_limited");
        setStatusMessage(response.detail ?? t("activation.rateLimited"));
        return;
      }

      setState("error");
      setStatusMessage(response.detail ?? t("activation.invalidToken"));
    };

    void activateAccount();

    return () => {
      isCancelled = true;
    };
  }, [emailFromQuery, t, token]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (state !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace(`/${locale}/login`);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [locale, router, state]);

  const onResendActivation = async () => {
    if (resendCooldown > 0) return;
    const normalizedEmail = resendEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setResendStatus(t("resendActivation.emailRequired"));
      setResendStatusType("error");
      return;
    }

    setResendStatus(null);
    setResendStatusType(null);
    setIsResending(true);

    const response = await authApi.resendActivation({email: normalizedEmail});
    const detail = response.detail ?? t("messages.genericError");
    const alreadyActive = detail.toLowerCase().includes("already active");

    if (response.ok || alreadyActive) {
      setResendStatus(response.ok ? t("activation.resendSuccess") : detail);
      setResendStatusType("success");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } else {
      setResendStatus(detail);
      setResendStatusType("error");
    }

    setIsResending(false);
  };

  const isCheckEmailState = state === "email_sent";
  const canResend = resendEmail.trim().length > 0 && resendCooldown <= 0 && !isResending;
  const resendCooldownLabel = useMemo(() => {
    const minutes = Math.floor(resendCooldown / 60);
    const seconds = resendCooldown % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [resendCooldown]);

  return (
    <AuthFlowShell
      heading={isCheckEmailState ? t("activation.emailSentTitle") : t("activation.title")}
      description={isCheckEmailState ? t("activation.emailSentSubtitle") : t("activation.subtitle")}
      sideBadge={t("activation.badge")}
      sideTitle={t("activation.sideTitle")}
      sideDescription={t("activation.sideDescription")}
      sidePoints={[t("activation.sidePoint1"), t("activation.sidePoint2"), t("activation.sidePoint3")]}
    >
      <div className="space-y-4">
        {isCheckEmailState ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-blue-400/25 bg-blue-500/10 p-4">
              <div className="pointer-events-none absolute -top-10 right-0 size-28 rounded-full bg-blue-500/20 blur-2xl" />
              <div className="relative flex gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <MailCheck className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{t("activation.emailSentCardTitle")}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t("activation.emailSentCardDescription", {email: resendEmail || t("activation.yourEmail")})}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("activation.spamTitle")}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("activation.spamDescription")}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {state === "loading" ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
            {t("activation.loading")}
          </div>
        ) : null}

        {statusMessage ? (
          <div
            className={cn(
              "rounded-2xl border p-4 text-sm",
              state === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                : state === "error" || state === "missing" || state === "rate_limited"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border/70 bg-background/70 text-muted-foreground"
            )}
          >
            {statusMessage}
          </div>
        ) : null}

        {state === "success" ? (
          <Button asChild className="h-11 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-600/90">
            <Link href={`/${locale}/login`}>{t("activation.goToLogin")}</Link>
          </Button>
        ) : null}

        {(state === "email_sent" || state === "error" || state === "missing" || state === "rate_limited") ? (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                {resendCooldown > 0 ? <Clock3 className="size-4" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("activation.resendPrompt")}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("activation.resendHelp")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resendActivationEmail">{t("resendActivation.emailLabel")}</Label>
              <Input
                id="resendActivationEmail"
                type="email"
                value={resendEmail}
                onChange={(event) => setResendEmail(event.target.value)}
                placeholder={t("resendActivation.emailPlaceholder")}
                className="h-10 rounded-xl"
              />
            </div>

            <div
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs",
                resendCooldown > 0
                  ? "border-blue-400/25 bg-blue-500/10 text-blue-700 dark:text-blue-200"
                  : "border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
              )}
              role="status"
              aria-live="polite"
            >
              <span className="flex items-center gap-2">
                {resendCooldown > 0 ? <Clock3 className="size-3.5" aria-hidden="true" /> : <ShieldCheck className="size-3.5" aria-hidden="true" />}
                {resendCooldown > 0 ? t("resendActivation.timerLabel") : t("resendActivation.readyLabel")}
              </span>
              <span className="font-semibold tabular-nums">
                {resendCooldown > 0 ? resendCooldownLabel : t("resendActivation.readyNow")}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-xl border-border/70"
              onClick={() => void onResendActivation()}
              disabled={!canResend}
            >
              {isResending
                ? t("common.submitting")
                : resendCooldown > 0
                  ? t("resendActivation.wait", {seconds: resendCooldown})
                  : t("resendActivation.submit")}
            </Button>

            {resendStatus ? (
              <p className={cn("text-sm", resendStatusType === "error" ? "text-destructive" : "text-emerald-600")}>{resendStatus}</p>
            ) : null}
          </div>
        ) : null}

        <Button asChild variant="link" className="h-auto justify-start px-0">
          <Link href={`/${locale}/login`}>{t("activation.backToLogin")}</Link>
        </Button>
      </div>
    </AuthFlowShell>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={null}>
      <ActivatePageContent />
    </Suspense>
  );
}
