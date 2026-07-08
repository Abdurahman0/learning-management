"use client";

import {useEffect, useState} from "react";
import {CheckCircle2, Crown, ExternalLink, Lock, Star} from "lucide-react";
import Link from "next/link";
import {useLocale} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {studentProfileService} from "@/src/services/student/profile.service";
import {useAppSessionRole} from "../../_components/session/AppSessionContext";

const TELEGRAM_URL = "https://t.me/+U1YftX0MkDgzOGNi";

const SILVER_FEATURES = [
  "Barcha REAL exam reading testlar",
  "Barcha REAL exam listening testlar (tez orada)",
  "Ustuvor qo'llab-quvvatlash",
  "Cheksiz AI tahlil",
];

const GOLD_EXTRA_FEATURES = [
  "Barcha marathonlarga kirish",
  "Online Reading kursi sovg'aga",
];

function TelegramButton({label}: {label: string}) {
  return (
    <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="block">
      <Button className="h-11 w-full rounded-2xl bg-[#2AABEE] font-bold text-white hover:bg-[#229ED9] dark:bg-[#2AABEE] dark:hover:bg-[#229ED9]">
        <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        {label}
        <ExternalLink className="size-3.5" />
      </Button>
    </a>
  );
}

export function UpgradePageClient() {
  const role = useAppSessionRole();
  const locale = useLocale();
  const isStudent = role === "user";
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isStudent) return;
    studentProfileService.getProfile().then((profile) => {
      setIsPremium(profile.is_premium ?? false);
    }).catch(() => {
      setIsPremium(false);
    });
  }, [isStudent]);

  if (isPremium === true) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 pb-16 pt-12 text-center">
        <div className="inline-flex size-20 items-center justify-center rounded-full bg-amber-500/10">
          <Crown className="size-9 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Siz allaqachon Premium!</h1>
          <p className="mt-2 text-muted-foreground">
            Barcha premium kontentga to&apos;liq kirish huquqingiz bor.
          </p>
        </div>
        <Button asChild className="h-11 w-full max-w-xs rounded-2xl bg-blue-600 font-semibold hover:bg-blue-600/90">
          <Link href={`/${locale}/reading`}>Testlarga o&apos;tish</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 pb-16 pt-8">

      {/* Hero */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Tarifni tanlang</h1>
        <p className="text-base text-muted-foreground">
          IELTS tayyorgarligingizni yangi bosqichga olib chiqing.
        </p>
      </div>

      {/* Tier cards */}
      <div className="grid gap-5 sm:grid-cols-2">

        {/* Silver */}
        <Card className="border-border bg-card py-0 shadow-sm">
          <CardContent className="flex h-full flex-col px-6 py-6">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-slate-400" />
              <p className="font-bold tracking-wide text-slate-500 dark:text-slate-400">Silver</p>
            </div>

            <div className="mt-3">
              <span className="text-3xl font-extrabold">60 000</span>
              <span className="ml-1 text-sm font-semibold text-muted-foreground">so&apos;m / oy</span>
            </div>

            <ul className="mt-5 flex-1 space-y-2.5">
              {SILVER_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <TelegramButton label="Silver olish" />
            </div>
          </CardContent>
        </Card>

        {/* Gold */}
        <Card className="relative border-amber-500/40 bg-card py-0 shadow-md">
          <Badge className="absolute top-3 right-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">
            Eng yaxshi
          </Badge>
          <CardContent className="flex h-full flex-col px-6 py-6">
            <div className="flex items-center gap-2">
              <Crown className="size-4 text-amber-500" />
              <p className="font-bold tracking-wide text-amber-600 dark:text-amber-400">Gold</p>
            </div>

            <div className="mt-3">
              <span className="text-3xl font-extrabold">99 000</span>
              <span className="ml-1 text-sm font-semibold text-muted-foreground">so&apos;m / oy</span>
            </div>

            <ul className="mt-5 flex-1 space-y-2.5">
              {SILVER_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
              {GOLD_EXTRA_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm font-medium text-foreground">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <TelegramButton label="Gold olish" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer note */}
      <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/40 px-4 py-3.5">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          To&apos;lov Telegram orqali amalga oshiriladi. Admin bir necha daqiqada Premium faollashtiradi.
        </p>
      </div>
    </div>
  );
}
