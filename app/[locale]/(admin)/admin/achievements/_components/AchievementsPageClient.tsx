"use client";

import {CheckCircle2} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {
  ACHIEVEMENT_STATS,
  ACHIEVEMENT_TREND_DATA,
  ACTIVE_ACHIEVEMENTS,
  BADGE_LIBRARY_PREVIEW,
  DEFAULT_GAMIFICATION_SETTINGS,
  RECENT_USER_PROGRESS,
  type ActiveAchievement,
  type BadgeLibraryItem,
  type GamificationSettings,
  type AchievementChartMode
} from "@/data/admin-achievements";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {AchievementStatsCards} from "./AchievementStatsCards";
import {AchievementsHeader} from "./AchievementsHeader";
import {AchievementsTrendChart} from "./AchievementsTrendChart";
import {ActiveAchievementsGrid} from "./ActiveAchievementsGrid";
import {BadgeLibraryPreview} from "./BadgeLibraryPreview";
import {CreateAchievementDialog, toneByCategory, type CreateAchievementPayload} from "./CreateAchievementDialog";
import {GamificationSettingsCard} from "./GamificationSettingsCard";
import {RecentUserProgressTable} from "./RecentUserProgressTable";

type ToastState = {
  title: string;
  description: string;
} | null;

function createAchievementId(title: string) {
  return `achv-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")}`;
}

export function AchievementsPageClient() {
  const t = useTranslations("adminAchievements");

  const [searchValue, setSearchValue] = useState("");
  const [chartMode, setChartMode] = useState<AchievementChartMode>("weekly");
  const [settings, setSettings] = useState<GamificationSettings>(DEFAULT_GAMIFICATION_SETTINGS);
  const [activeAchievements, setActiveAchievements] = useState<ActiveAchievement[]>(ACTIVE_ACHIEVEMENTS);
  const [badgeLibrary, setBadgeLibrary] = useState<BadgeLibraryItem[]>(BADGE_LIBRARY_PREVIEW);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const query = searchValue.trim().toLowerCase();

  const filteredAchievements = useMemo(() => {
    if (!query) {
      return activeAchievements;
    }
    return activeAchievements.filter(
      (item) => item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    );
  }, [activeAchievements, query]);

  const filteredProgress = useMemo(() => {
    if (!query) {
      return RECENT_USER_PROGRESS;
    }
    return RECENT_USER_PROGRESS.filter(
      (row) =>
        row.userName.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.achievement.toLowerCase().includes(query)
    );
  }, [query]);

  const filteredBadges = useMemo(() => {
    if (!query) {
      return badgeLibrary;
    }

    return badgeLibrary.filter((item) => item.icon === "plus" || item.label.toLowerCase().includes(query));
  }, [badgeLibrary, query]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openCreateDialog = () => setCreateDialogOpen(true);

  const handleCreateAchievement = (payload: CreateAchievementPayload) => {
    const nextAchievement: ActiveAchievement = {
      id: createAchievementId(payload.title),
      title: payload.title,
      description: payload.description || t("createDialog.defaultDescription"),
      timesEarned: payload.timesEarned,
      badgeIcon: payload.badgeIcon,
      tone: toneByCategory[payload.category]
    };

    setActiveAchievements((current) => [nextAchievement, ...current]);
    setBadgeLibrary((current) => {
      const withoutNew = current.filter((item) => item.icon !== "plus");
      const newTile: BadgeLibraryItem = {
        id: `badge-${nextAchievement.id}`,
        label: nextAchievement.title,
        icon: payload.badgeIcon === "award" ? "star" : payload.badgeIcon === "flame" ? "rocket" : payload.badgeIcon === "sparkles" ? "mic" : "headphones"
      };
      return [...withoutNew, newTile, {id: "badge-new", label: t("newBadge"), icon: "plus"}];
    });
    setToast({
      title: t("toast.createdTitle"),
      description: t("toast.createdDescription", {title: payload.title})
    });
  };

  const chartPoints = useMemo(() => ACHIEVEMENT_TREND_DATA[chartMode], [chartMode]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AchievementsHeader searchValue={searchValue} onSearchChange={setSearchValue} onCreateAchievement={openCreateDialog} />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <AchievementStatsCards stats={ACHIEVEMENT_STATS} />

            <ActiveAchievementsGrid
              title={t("activeAchievements")}
              viewLibraryLabel={t("viewLibrary")}
              items={filteredAchievements}
              emptyLabel={t("empty.achievements")}
              onViewLibrary={() => {
                document.getElementById("achievement-badge-library")?.scrollIntoView({behavior: "smooth", block: "start"});
              }}
              onCardAction={(action, item) => {
                console.info("[achievements] card-action", {action, achievementId: item.id});
                setToast({
                  title: t("toast.actionTitle"),
                  description: t("toast.actionDescription", {action: t(`actions.${action}`), title: item.title})
                });
              }}
            />

            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.95fr)]">
              <RecentUserProgressTable
                rows={filteredProgress}
                onViewAll={() => {
                  console.info("[achievements] view-all-progress", {rows: filteredProgress.length});
                  setToast({title: t("toast.viewAllTitle"), description: t("toast.viewAllDescription")});
                }}
              />

              <GamificationSettingsCard
                settings={settings}
                onChange={(patch) => setSettings((current) => ({...current, ...patch}))}
              />
            </section>

            <AchievementsTrendChart mode={chartMode} points={chartPoints} onModeChange={setChartMode} />

            <BadgeLibraryPreview items={filteredBadges} onNewBadge={openCreateDialog} />
          </main>
        </div>
      </div>

      <CreateAchievementDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onCreate={handleCreateAchievement} />

      <div aria-live="polite" className="pointer-events-none fixed top-20 right-4 z-[70]">
        {toast ? (
          <div className="min-w-[260px] rounded-xl border border-emerald-500/35 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="size-3.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                <p className="text-xs text-muted-foreground">{toast.description}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
