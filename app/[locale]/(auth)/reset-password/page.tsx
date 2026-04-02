"use client";

import Link from "next/link";
import {Suspense, useMemo, useState} from "react";
import {useSearchParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {authApi} from "@/lib/api/auth";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

import {AuthFlowShell} from "../auth/components/AuthFlowShell";
import {PasswordField} from "../auth/components/PasswordField";

function ResetPasswordPageContent() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setStatusType(null);
    setNeedsVerification(false);

    if (newPassword !== confirmPassword) {
      setStatus(t("validation.confirmPassword"));
      setStatusType("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await authApi.resetPassword({
        email: normalizedEmail,
        new_password: newPassword
      });

      if (!response.ok) {
        const detail = response.detail ?? t("messages.genericError");
        setStatus(detail);
        setStatusType("error");
        setNeedsVerification(detail.toLowerCase().includes("verification is required"));
        return;
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
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("fields.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("placeholders.email")}
            className="h-11 rounded-xl"
          />
        </div>

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

      {needsVerification ? (
        <Button asChild variant="link" className="mt-1 h-auto justify-start px-0">
          <Link href={`/${locale}/verify-reset-code?email=${encodeURIComponent(email.trim().toLowerCase())}`}>
            {t("resetPassword.goToVerifyCode")}
          </Link>
        </Button>
      ) : null}
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
