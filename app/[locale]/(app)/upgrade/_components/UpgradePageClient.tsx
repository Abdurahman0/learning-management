"use client";

import {useEffect, useMemo, useState} from "react";
import {CheckCircle2, Crown, ExternalLink, Loader2, Lock, Sparkles} from "lucide-react";
import Link from "next/link";
import {useLocale} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {studentPackagesService, type StudentPackage, type StudentSubscriptionResponse} from "@/src/services/student/packages.service";
import {useAppSessionRole} from "../../_components/session/AppSessionContext";

function formatPrice(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return new Intl.NumberFormat("uz-UZ").format(numeric);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {day: "2-digit", month: "short", year: "numeric"}).format(date);
}

function tierTone(tier: string) {
  const normalized = tier.toUpperCase();
  if (normalized === "GOLD") return "border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-300";
  if (normalized === "PLATINUM") return "border-cyan-500/40 bg-cyan-500/5 text-cyan-600 dark:text-cyan-300";
  return "border-slate-400/30 bg-slate-500/5 text-slate-600 dark:text-slate-300";
}

function PackageCard({item}: {item: StudentPackage}) {
  const hasDiscount = item.has_discount && item.discounted_price;
  const features = [
    "Premium testlarga kirish",
    "Premium marathon kunlarini ochish",
    "AI tahlil limitlari paketga qarab ishlaydi"
  ];

  return (
    <Card className="overflow-hidden border-border/70 bg-card/80 py-0 shadow-sm">
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className={`rounded-full px-3 py-1 ${tierTone(item.tier)}`}>
              {item.tier_display || item.tier}
            </Badge>
            <h2 className="mt-4 text-xl font-bold tracking-tight">{item.name}</h2>
          </div>
          {hasDiscount ? <Badge className="rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300">Chegirma</Badge> : null}
        </div>

        <div className="mt-5">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold">{formatPrice(item.effective_price)}</span>
            <span className="pb-1 text-sm font-semibold text-muted-foreground">so&apos;m</span>
          </div>
          {hasDiscount ? (
            <p className="mt-1 text-sm text-muted-foreground line-through">{formatPrice(item.price)} so&apos;m</p>
          ) : null}
        </div>

        <ul className="mt-6 flex-1 space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground/80">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <a href={item.purchase_url} target="_blank" rel="noopener noreferrer" className="mt-6 block">
          <Button className="h-11 w-full rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-600/90">
            Paketni olish
            <ExternalLink className="size-4" />
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}

export function UpgradePageClient() {
  const role = useAppSessionRole();
  const locale = useLocale();
  const isStudent = role === "user";
  const [packages, setPackages] = useState<StudentPackage[]>([]);
  const [subscription, setSubscription] = useState<StudentSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [packageResponse, subscriptionResponse] = await Promise.all([
          studentPackagesService.listPackages(),
          isStudent ? studentPackagesService.getSubscription() : Promise.resolve(null)
        ]);
        if (!active) return;
        setPackages(packageResponse.filter((item) => item.purchase_url));
        setSubscription(subscriptionResponse);
      } catch {
        if (!active) return;
        setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [isStudent]);

  const activeSubscription = useMemo(() => {
    if (!subscription?.active || !subscription.subscription?.is_currently_active) return null;
    return subscription.subscription;
  }, [subscription]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[55vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Paketlar yuklanmoqda...</p>
      </div>
    );
  }

  if (activeSubscription) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 pb-16 pt-12 text-center">
        <div className="inline-flex size-20 items-center justify-center rounded-full bg-amber-500/10">
          <Crown className="size-9 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Premium access active</h1>
          <p className="mt-2 text-muted-foreground">
            {activeSubscription.package_name} paketingiz {formatDate(activeSubscription.expires_at)} gacha faol.
          </p>
        </div>
        <div className="grid w-full gap-3 rounded-3xl border border-border/70 bg-card/70 p-4 text-left sm:grid-cols-2">
          <div className="rounded-2xl bg-background/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Package</p>
            <p className="mt-2 font-semibold">{activeSubscription.package_name}</p>
          </div>
          <div className="rounded-2xl bg-background/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Days left</p>
            <p className="mt-2 font-semibold">{activeSubscription.days_remaining ?? "-"}</p>
          </div>
        </div>
        <Button asChild className="h-11 w-full max-w-xs rounded-2xl bg-blue-600 font-semibold hover:bg-blue-600/90">
          <Link href={`/${locale}/reading`}>Testlarga o&apos;tish</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-16 pt-8">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <Badge className="rounded-full bg-blue-500/12 px-4 py-1.5 text-blue-600 dark:text-blue-300">
          <Sparkles className="size-3.5" /> Premium access
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tarifni tanlang</h1>
        <p className="text-base text-muted-foreground">Premium testlar va marathon kontentlarini ochish uchun paket tanlang.</p>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-600 dark:text-rose-300">
          Paketlarni yuklashda xatolik yuz berdi. Sahifani yangilab qayta urinib ko&apos;ring.
        </div>
      ) : null}

      {packages.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((item) => <PackageCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/60 px-6 py-12 text-center text-muted-foreground">
          Hozircha faol paketlar mavjud emas.
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3.5">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          To&apos;lov linki backend paketidan olinadi. Premium faollashganda kirish huquqi avtomatik subscription orqali tekshiriladi.
        </p>
      </div>
    </div>
  );
}
