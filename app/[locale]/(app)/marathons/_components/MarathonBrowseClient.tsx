"use client";

import Link from "next/link";
import {ChevronDown} from "lucide-react";
import {useEffect, useState} from "react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import {studentMarathonService} from "@/src/services/student/marathon.service";
import type {StudentMarathonListItem} from "@/src/services/student/marathon.types";
import {StudentApiError} from "@/src/services/student/types";

function MarathonListItem({
  item,
  locale
}: {
  item: StudentMarathonListItem;
  locale: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className={cn("border-slate-200 bg-white py-0 shadow-sm dark:border-white/10 dark:bg-white/6", isOpen && "border-sky-300 dark:border-cyan-300/30")}>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
        >
          <h3 className="truncate text-base font-semibold text-slate-950 dark:text-white">{item.title}</h3>
          <ChevronDown
            className={cn("size-4 shrink-0 text-slate-500 transition-transform dark:text-slate-400", isOpen && "rotate-180")}
            aria-hidden="true"
          />
        </button>

        {isOpen ? (
          <div className="space-y-4 border-t border-slate-200 px-4 py-4 dark:border-white/10">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Days</p>
                <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">{item.total_days || item.marathon_days || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Target Band</p>
                <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">{item.target_band ?? "-"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Category</p>
                <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">{item.category_display}</p>
              </div>
            </div>

            {item.description ? (
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                {item.difficulty_display}
              </span>
              {item.access_type === "LOCKED" ? (
                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  Premium
                </span>
              ) : item.access_type === "TRIAL" ? (
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {item.free_days_count || 3} days free
                </span>
              ) : null}
              {item.enrollment?.status ? (
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                  {item.enrollment.status}
                </span>
              ) : null}
            </div>

            <Button asChild className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15">
              <Link href={`/${locale}/marathons/${item.id}`}>Open marathon</Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function MarathonBrowseClient() {
  const t = useTranslations("marathon");
  const locale = useLocale();
  const [items, setItems] = useState<StudentMarathonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await studentMarathonService.list({ordering: "-created_at", pageSize: 100});
        if (!active) return;
        setItems(response.results);
      } catch (cause) {
        if (!active) return;
        setItems([]);
        setError(cause instanceof StudentApiError ? cause.message : t("errors.load"));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [t]);

  if (loading) {
    return (
      <Card className="rounded-[28px] border border-slate-200 bg-white/94 dark:border-white/10 dark:bg-white/7">
        <CardContent className="space-y-3 p-5">
          {Array.from({length: 6}).map((_, index) => (
            <div key={index} className="h-14 rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/6" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-[28px] border border-rose-200 bg-rose-50 dark:border-rose-300/20 dark:bg-rose-500/10">
        <CardContent className="p-4 text-sm text-rose-700 dark:text-rose-100">{error}</CardContent>
      </Card>
    );
  }

  if (!items.length) {
    return (
      <Card className="rounded-[28px] border border-slate-200 bg-white/94 dark:border-white/10 dark:bg-white/7">
        <CardContent className="p-5 text-sm text-slate-600 dark:text-slate-300">{t("browse.emptyEnrolled")}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[28px] border border-slate-200 bg-white/94 dark:border-white/10 dark:bg-white/7">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2">
          {items.map((item) => <MarathonListItem key={item.id} item={item} locale={locale} />)}
        </div>
      </CardContent>
    </Card>
  );
}
