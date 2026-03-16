"use client";

import {useEffect, useState} from "react";
import {CheckCircle2} from "lucide-react";
import {useTranslations} from "next-intl";

import {
  createTeacherAnnouncement,
  getTeacherAnnouncementsPageData,
  type TeacherAnnouncementCreateInput,
  type TeacherAnnouncementsPageData
} from "@/data/teacher/selectors";

import {TeacherSidebar} from "../../_components/TeacherSidebar";
import {TeacherTopbar} from "../../_components/TeacherTopbar";
import {TeacherAnnouncementEngagementCard} from "./TeacherAnnouncementEngagementCard";
import {TeacherAnnouncementQuickTipCard} from "./TeacherAnnouncementQuickTipCard";
import {TeacherAnnouncementStatsCards} from "./TeacherAnnouncementStatsCards";
import {TeacherCreateAnnouncementForm} from "./TeacherCreateAnnouncementForm";

type TeacherAnnouncementsPageClientProps = {
  initialData: TeacherAnnouncementsPageData;
};

export function TeacherAnnouncementsPageClient({initialData}: TeacherAnnouncementsPageClientProps) {
  const t = useTranslations("teacherAnnouncements");

  const [pageData, setPageData] = useState(initialData);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timer = window.setTimeout(() => setActionMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const handleSubmit = (input: TeacherAnnouncementCreateInput) => {
    const created = createTeacherAnnouncement(input);

    if (!created) {
      return false;
    }

    setPageData(getTeacherAnnouncementsPageData());

    if (created.status === "draft") {
      setActionMessage(t("feedback.savedDraft"));
      return true;
    }

    if (created.status === "scheduled") {
      setActionMessage(t("feedback.scheduled"));
      return true;
    }

    setActionMessage(t("feedback.published"));
    return true;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <TeacherSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopbar title={t("title")} />

          <main className="mx-auto min-w-0 w-full max-w-370 space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <section>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
            </section>

            <TeacherAnnouncementStatsCards stats={pageData.stats} />

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.82fr)]">
              <TeacherCreateAnnouncementForm audienceOptions={pageData.audienceOptions} onSubmit={handleSubmit} />

              <div className="space-y-5">
                <TeacherAnnouncementEngagementCard engagement={pageData.engagement} />
                <TeacherAnnouncementQuickTipCard />
              </div>
            </section>
          </main>
        </div>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed top-20 right-4 z-60">
        {actionMessage ? (
          <div className="min-w-70 rounded-xl border border-emerald-500/35 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-emerald-600/72 text-white dark:bg-emerald-500/15 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
              </span>
              <p className="text-sm font-medium">{actionMessage}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
