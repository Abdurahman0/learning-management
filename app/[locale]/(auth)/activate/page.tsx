"use client";

import Link from "next/link";
import {Suspense, useEffect, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {authApi} from "@/lib/api/auth";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

import {AuthFlowShell} from "../auth/components/AuthFlowShell";

type ActivateState = "idle" | "loading" | "success" | "error" | "missing" | "rate_limited";

function ActivatePageContent() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [state, setState] = useState<ActivateState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendStatusType, setResendStatusType] = useState<"success" | "error" | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const activateAccount = async () => {
      if (!token) {
        setState("missing");
        setStatusMessage(t("activation.missingToken"));
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
  }, [t, token]);

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
    setResendStatus(null);
    setResendStatusType(null);
    setIsResending(true);

    const response = await authApi.resendActivation({email: resendEmail.trim().toLowerCase()});
    const detail = response.detail ?? t("messages.genericError");
    const alreadyActive = detail.toLowerCase().includes("already active");

    if (response.ok || alreadyActive) {
      setResendStatus(detail);
      setResendStatusType("success");
    } else {
      setResendStatus(detail);
      setResendStatusType("error");
    }

    setIsResending(false);
  };

  return (
    <AuthFlowShell
      heading={t("activation.title")}
      description={t("activation.subtitle")}
      sideBadge={t("activation.badge")}
      sideTitle={t("activation.sideTitle")}
      sideDescription={t("activation.sideDescription")}
      sidePoints={[t("activation.sidePoint1"), t("activation.sidePoint2"), t("activation.sidePoint3")]}
    >
      <div className="space-y-4">
        {state === "loading" ? (
          <p className="text-sm text-muted-foreground">{t("activation.loading")}</p>
        ) : null}

        {statusMessage ? (
          <p
            className={cn(
              "text-sm",
              state === "success"
                ? "text-emerald-600"
                : state === "error" || state === "missing" || state === "rate_limited"
                  ? "text-destructive"
                  : "text-muted-foreground"
            )}
          >
            {statusMessage}
          </p>
        ) : null}

        {state === "success" ? (
          <Button asChild className="h-11 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-600/90">
            <Link href={`/${locale}/login`}>{t("activation.goToLogin")}</Link>
          </Button>
        ) : null}

        {(state === "error" || state === "missing" || state === "rate_limited") ? (
          <div className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
            <p className="text-sm font-medium text-foreground">{t("activation.resendPrompt")}</p>

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

            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-xl border-border/70"
              onClick={() => void onResendActivation()}
              disabled={isResending}
            >
              {isResending ? t("common.submitting") : t("resendActivation.submit")}
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
