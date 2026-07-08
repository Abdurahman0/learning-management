"use client";

import {useEffect, useState} from "react";
import {CheckCircle2, Crown, ExternalLink, Lock} from "lucide-react";
import Link from "next/link";
import {useLocale} from "next-intl";

import {Button} from "@/components/ui/button";
import {studentProfileService} from "@/src/services/student/profile.service";
import {DEFAULT_PREMIUM_CONFIG, loadPremiumConfig, type PremiumPaymentConfig} from "@/src/config/premiumPayment";
import {useAppSessionRole} from "../../_components/session/AppSessionContext";

export function UpgradePageClient() {
  const role = useAppSessionRole();
  const locale = useLocale();
  const isStudent = role === "user";
  const [config, setConfig] = useState<PremiumPaymentConfig>(DEFAULT_PREMIUM_CONFIG);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    setConfig(loadPremiumConfig());
  }, []);

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
            Barcha premium kontentga to&apos;liq kirish huquqingiz bor. Testlar yuklab oling.
          </p>
        </div>
        <Button asChild className="h-11 w-full max-w-xs rounded-2xl bg-blue-600 font-semibold hover:bg-blue-600/90">
          <Link href={`/${locale}/reading`}>Testlarga o&apos;tish</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-7 px-4 pb-16 pt-8">

      {/* Hero */}
      <div className="space-y-2 text-center">
        <div className="mx-auto mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-amber-500/10">
          <Crown className="size-7 text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Premium oling</h1>
        <p className="text-base text-muted-foreground">
          Barcha testlar, marathon dasturlari va batafsil izohlar sizning.
        </p>
      </div>

      {/* Price callout */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-5 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">Oylik narx</p>
        <p className="mt-2 text-4xl font-extrabold tracking-tight">
          {config.price} <span className="text-2xl font-bold text-muted-foreground">{config.currency}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">har {config.period} uchun</p>
      </div>

      {/* Features */}
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card/60 px-6 py-5">
        <p className="text-sm font-semibold text-foreground">Nimalar kiradi?</p>
        <ul className="space-y-2.5">
          {config.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <span className="text-sm text-foreground/90">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* What's locked */}
      <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/40 px-4 py-3.5">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Premium testlar hozir qulflangan ko&apos;rinishda. To&apos;lov qilinganidan so&apos;ng admin sizni faollashtiradi.
        </p>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <a href={config.telegramUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="h-13 w-full rounded-2xl bg-[#2AABEE] text-base font-bold text-white hover:bg-[#229ED9] dark:bg-[#2AABEE] dark:hover:bg-[#229ED9]">
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {config.telegramLabel}
            <ExternalLink className="size-4" />
          </Button>
        </a>
        <p className="text-center text-xs text-muted-foreground">
          To&apos;lov Telegram orqali amalga oshiriladi. Admin bir necha daqiqada faollashtiradi.
        </p>
      </div>

    </div>
  );
}
