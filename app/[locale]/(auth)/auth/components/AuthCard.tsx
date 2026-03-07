"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { AuthMode } from "./AuthShell";
import { GoogleButton } from "./GoogleButton";
import { PasswordField } from "./PasswordField";

type AuthCardProps = {
  mode: AuthMode;
};

type FormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
  remember: boolean;
};

type Errors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  agree: false,
  remember: false,
};

export function AuthCard({ mode }: AuthCardProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);

  const isSignup = mode === "signup";

  const dividerLabel = isSignup ? t("orContinueWithEmail") : t("or");
  const submitLabel = isSignup ? t("signup.submit") : t("signin.submit");
  const successLabel = isSignup ? t("signup.success") : t("signin.success");

  const modeSwitch = useMemo(
    () => ({
      href: `/${locale}/${isSignup ? "login" : "register"}`,
      text: isSignup ? t("signup.bottomText") : t("signin.bottomText"),
      linkText: isSignup ? t("signup.bottomLink") : t("signin.bottomLink"),
    }),
    [isSignup, locale, t]
  );

  const setValue = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: Errors = {};
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

    if (isSignup && form.fullName.trim().length < 2) {
      nextErrors.fullName = t("validation.fullName");
    }
    if (!emailOk) {
      nextErrors.email = t("validation.email");
    }
    if (form.password.length < 8) {
      nextErrors.password = t("validation.password");
    }
    if (isSignup && form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = t("validation.confirmPassword");
    }
    if (isSignup && !form.agree) {
      nextErrors.agree = t("validation.agree");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setStatusType(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {role?: "user" | "admin"; error?: string} | null;

      if (!response.ok || !payload?.role) {
        setStatus(payload?.error ?? "Invalid credentials.");
        setStatusType("error");
        return;
      }

      setStatus(successLabel);
      setStatusType("success");

      if (payload.role === "admin") {
        router.replace(`/${locale}/admin`);
      } else {
        router.replace(`/${locale}/reading`);
      }

      router.refresh();
    } catch {
      setStatus("Something went wrong. Please try again.");
      setStatusType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-[620px] rounded-3xl border-border/80 bg-card/95 px-5 py-6 shadow-xl shadow-slate-950/5 sm:px-8 sm:py-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">{isSignup ? t("signup.title") : t("signin.title")}</h2>
        <p className="text-lg text-muted-foreground">{isSignup ? t("signup.subtitle") : t("signin.subtitle")}</p>
      </div>

      <GoogleButton label={t("common.continueWithGoogle")} disabled={isSubmitting} />

      <div className="my-6 flex w-full items-center gap-3 overflow-hidden">
        <div className="h-px flex-1 bg-border" />
        <span className="shrink-0 whitespace-nowrap text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {dividerLabel}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {isSignup ? (
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("fields.fullName")}</Label>
            <div className="relative">
              <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(event) => setValue("fullName", event.target.value)}
                placeholder={t("placeholders.fullName")}
                autoComplete="name"
                aria-invalid={errors.fullName ? "true" : "false"}
                className={cn("h-11 rounded-xl pl-9", errors.fullName && "border-destructive")}
              />
            </div>
            {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName}</p> : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">{t("fields.email")}</Label>
          <div className="relative">
            <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setValue("email", event.target.value)}
              placeholder={t("placeholders.email")}
              aria-invalid={errors.email ? "true" : "false"}
              className={cn("h-11 rounded-xl pl-9", errors.email && "border-destructive")}
            />
          </div>
          {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
        </div>

        {isSignup ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">{t("fields.password")}</Label>
              <PasswordField
                id="password"
                value={form.password}
                placeholder={t("placeholders.password")}
                showLabel={t("common.showPassword")}
                hideLabel={t("common.hidePassword")}
                onChange={(value) => setValue("password", value)}
                invalid={Boolean(errors.password)}
                autoComplete="new-password"
              />
              {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("fields.confirmPassword")}</Label>
              <PasswordField
                id="confirmPassword"
                value={form.confirmPassword}
                placeholder={t("placeholders.confirmPassword")}
                showLabel={t("common.showPassword")}
                hideLabel={t("common.hidePassword")}
                onChange={(value) => setValue("confirmPassword", value)}
                invalid={Boolean(errors.confirmPassword)}
                autoComplete="new-password"
              />
              {errors.confirmPassword ? <p className="text-xs text-destructive">{errors.confirmPassword}</p> : null}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="password">{t("fields.password")}</Label>
            <PasswordField
              id="password"
              value={form.password}
              placeholder={t("placeholders.password")}
              showLabel={t("common.showPassword")}
              hideLabel={t("common.hidePassword")}
              onChange={(value) => setValue("password", value)}
              invalid={Boolean(errors.password)}
              autoComplete="current-password"
            />
            {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
          </div>
        )}

        {isSignup ? (
          <div className="space-y-1">
            <Label htmlFor="agree" className="items-start text-sm leading-relaxed text-muted-foreground">
              <Checkbox
                id="agree"
                checked={form.agree}
                onChange={(event) => setValue("agree", event.target.checked)}
                className="mt-0.5"
                aria-invalid={errors.agree ? "true" : "false"}
              />
              <span>
                {t("signup.termsPrefix")}{" "}
                <Link href="#" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
                  {t("signup.terms")}
                </Link>{" "}
                {t("signup.and")}{" "}
                <Link href="#" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
                  {t("signup.privacy")}
                </Link>
                .
              </span>
            </Label>
            {errors.agree ? <p className="pl-6 text-xs text-destructive">{errors.agree}</p> : null}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="remember" className="text-base font-medium text-muted-foreground">
              <Checkbox
                id="remember"
                checked={form.remember}
                onChange={(event) => setValue("remember", event.target.checked)}
              />
              {t("signin.remember")}
            </Label>
            <Link href="#" className="text-base font-semibold text-blue-700 hover:underline dark:text-blue-400">
              {t("signin.forgot")}
            </Link>
          </div>
        )}

        <Button type="submit" className="h-12 w-full rounded-xl bg-blue-600 text-lg font-semibold hover:bg-blue-600/90" disabled={isSubmitting}>
          {isSubmitting ? t("common.submitting") : submitLabel}
        </Button>

        {status ? (
          <p className={cn("text-center text-sm", statusType === "error" ? "text-destructive" : "text-emerald-600")}>
            {status}
          </p>
        ) : null}
        {!isSignup ? (
          <p className="text-center text-xs text-muted-foreground">
            Demo credentials: string@gmail.com/string1234 (user), admin@gmail.com/admin1234 (admin)
          </p>
        ) : null}
      </form>

      <Separator />

      <p className="text-center text-base text-muted-foreground">
        {modeSwitch.text}{" "}
        <Link href={modeSwitch.href} className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
          {modeSwitch.linkText}
        </Link>
      </p>
    </Card>
  );
}
