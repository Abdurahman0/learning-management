"use client";

import Link from "next/link";
import {Suspense, useEffect, useMemo, useState} from "react";
import {useSearchParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";
import {KeyRound, ShieldAlert} from "lucide-react";

import {authApi} from "@/lib/api/auth";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

import {AuthFlowShell} from "../auth/components/AuthFlowShell";
import {PasswordField} from "../auth/components/PasswordField";

const RESET_ACTIVATION_TOKEN_STORAGE_KEY = "englishlabs.reset.activationToken";

function ResetPasswordPageContent() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const urlResetToken = useMemo(
    () => (searchParams.get("token") ?? searchParams.get("activation_token") ?? "").trim(),
    [searchParams]
  );
  const [emailResetToken] = useState(urlResetToken);
  const [hasStoredActivationToken, setHasStoredActivationToken] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (urlResetToken) {
      window.sessionStorage.removeItem(RESET_ACTIVATION_TOKEN_STORAGE_KEY);
      const cleanUrl = `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState(null, "", cleanUrl);
      return;
    }

    setHasStoredActivationToken(Boolean(window.sessionStorage.getItem(RESET_ACTIVATION_TOKEN_STORAGE_KEY)));
  }, [urlResetToken]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setStatusType(null);

    if (newPassword !== confirmPassword) {
      setStatus(t("validation.confirmPassword"));
      setStatusType("error");
      return;
    }

    setIsSubmitting(true);

    try {
      let activationToken =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(RESET_ACTIVATION_TOKEN_STORAGE_KEY)?.trim() ?? ""
          : "";

      if (!activationToken) {
        const activationResponse = await authApi.activateResetToken({token: emailResetToken});

        if (!activationResponse.ok) {
          setStatus(activationResponse.detail ?? t("resetPassword.invalidLinkDescription"));
          setStatusType("error");
          return;
        }

        activationToken = String(activationResponse.data?.activation_token ?? "").trim();
        if (!activationToken) {
          setStatus(t("resetPassword.invalidLinkDescription"));
          setStatusType("error");
          return;
        }

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(RESET_ACTIVATION_TOKEN_STORAGE_KEY, activationToken);
          setHasStoredActivationToken(true);
        }
      }

      const response = await authApi.resetPassword({
        new_password: newPassword,
        activation_token: activationToken
      });

      if (!response.ok) {
        const detail = response.detail ?? t("messages.genericError");
        setStatus(detail);
        setStatusType("error");
        if (detail.toLowerCase().includes("invalid") || detail.toLowerCase().includes("expired")) {
          window.sessionStorage.removeItem(RESET_ACTIVATION_TOKEN_STORAGE_KEY);
          setHasStoredActivationToken(false);
        }
        return;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(RESET_ACTIVATION_TOKEN_STORAGE_KEY);
      }
      setStatus(response.detail ?? t("resetPassword.success"));
      setStatusType("success");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFlowShell
      heading={t("resetPassword.title")}
      description={t("resetPassword.subtitle")}
      sideBadge={t("resetPassword.badge")}
      sideTitle={t("resetPassword.sideTitle")}
      sideDescription={t("resetPassword.sideDescription")}
      sidePoints={[t("resetPassword.sidePoint1"), t("resetPassword.sidePoint2"), t("resetPassword.sidePoint3")]}
    >
      {!emailResetToken && !hasStoredActivationToken ? (
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-sm dark:border-amber-500/25 dark:from-amber-950/30 dark:via-slate-950/40 dark:to-orange-950/20">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
              <ShieldAlert className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{t("resetPassword.invalidLinkTitle")}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{t("resetPassword.invalidLinkDescription")}</p>
            </div>
          </div>
          <Button asChild className="mt-5 h-11 rounded-xl bg-blue-600 px-5 text-base font-semibold hover:bg-blue-600/90">
            <Link href={`/${locale}/forgot-password`}>{t("resetPassword.requestNewLink")}</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-2xl border border-blue-200/70 bg-blue-50/70 p-4 text-sm text-blue-950 dark:border-blue-500/25 dark:bg-blue-950/20 dark:text-blue-100">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-300" />
              <p className="leading-6">{t("resetPassword.secureLinkNotice")}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("resetPassword.newPasswordLabel")}</Label>
              <PasswordField
                id="newPassword"
                value={newPassword}
                placeholder={t("placeholders.password")}
                showLabel={t("common.showPassword")}
                hideLabel={t("common.hidePassword")}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("fields.confirmPassword")}</Label>
              <PasswordField
                id="confirmPassword"
                value={confirmPassword}
                placeholder={t("placeholders.confirmPassword")}
                showLabel={t("common.showPassword")}
                hideLabel={t("common.hidePassword")}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-600/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("common.submitting") : t("resetPassword.submit")}
            </Button>
          </form>

          {status ? (
            <p className={cn("mt-4 text-sm", statusType === "error" ? "text-destructive" : "text-emerald-600")}>{status}</p>
          ) : null}

          {statusType === "success" ? (
            <Button asChild variant="outline" className="mt-3 h-11 w-full rounded-xl border-border/70">
              <Link href={`/${locale}/login`}>{t("resetPassword.backToLogin")}</Link>
            </Button>
          ) : null}
        </>
      )}
    </AuthFlowShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
