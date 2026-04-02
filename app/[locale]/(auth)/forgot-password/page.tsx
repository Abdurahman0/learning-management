"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {authApi} from "@/lib/api/auth";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

import {AuthFlowShell} from "../auth/components/AuthFlowShell";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setStatusType(null);

    setIsSubmitting(true);

    try {
      const response = await authApi.forgotPassword({email: email.trim().toLowerCase()});

      if (!response.ok) {
        setStatus(response.detail ?? t("messages.genericError"));
        setStatusType("error");
        return;
      }

      setStatus(response.detail ?? t("forgotPassword.success"));
      setStatusType("success");

      const params = new URLSearchParams({email: email.trim().toLowerCase()});
      router.replace(`/${locale}/verify-reset-code?${params.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFlowShell
      heading={t("forgotPassword.title")}
      description={t("forgotPassword.subtitle")}
      sideBadge={t("forgotPassword.badge")}
      sideTitle={t("forgotPassword.sideTitle")}
      sideDescription={t("forgotPassword.sideDescription")}
      sidePoints={[t("forgotPassword.sidePoint1"), t("forgotPassword.sidePoint2"), t("forgotPassword.sidePoint3")]}
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

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-600/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("common.submitting") : t("forgotPassword.submit")}
        </Button>
      </form>

      {status ? (
        <p className={cn("mt-4 text-sm", statusType === "error" ? "text-destructive" : "text-emerald-600")}>{status}</p>
      ) : null}

      <Button asChild variant="link" className="mt-2 h-auto justify-start px-0">
        <Link href={`/${locale}/login`}>{t("forgotPassword.backToLogin")}</Link>
      </Button>
    </AuthFlowShell>
  );
}
