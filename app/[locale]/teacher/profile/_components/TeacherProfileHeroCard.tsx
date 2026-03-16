"use client";

import {PencilLine, Sparkles, UploadCloud} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import type {TeacherProfileStatItem} from "@/data/teacher/selectors";
import type {TeacherProfile} from "@/types/teacher";

type TeacherProfileHeroCardProps = {
  profile: TeacherProfile;
  stats: TeacherProfileStatItem[];
  onEditProfile: () => void;
  onChangeAvatar: () => void;
};

function formatStudents(stats: TeacherProfileStatItem[]) {
  const students = stats.find((item) => item.id === "students")?.value ?? 0;
  return `${students}+`;
}

export function TeacherProfileHeroCard({
  profile,
  stats,
  onEditProfile,
  onChangeAvatar
}: TeacherProfileHeroCardProps) {
  const t = useTranslations("teacherProfile");

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-linear-to-br from-card/95 via-card/85 to-primary/10 py-0 shadow-[0_16px_48px_-28px_rgba(59,130,246,0.65)]">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="ring-2 ring-primary/30 shadow-[0_0_0_6px_hsl(var(--primary)/0.08)]" size="lg">
              <AvatarFallback className="bg-primary/18 text-primary">{profile.avatarFallback}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-2xl font-semibold tracking-tight">{profile.name}</p>
                <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/14 px-2 py-0.5 text-xs font-medium text-primary">
                  {profile.title}
                </span>
                {profile.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-600/72 px-2 py-0.5 text-xs text-white dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Sparkles className="size-3.5" />
                    {t("verified")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">{profile.email}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{t("instructorId")}: {profile.instructorId}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" className="rounded-xl" onClick={onEditProfile}>
              <PencilLine className="size-4" />
              {t("editProfile")}
            </Button>
            <Button type="button" variant="secondary" className="rounded-xl" onClick={onChangeAvatar}>
              <UploadCloud className="size-4" />
              {t("changeAvatar")}
            </Button>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-background/45 px-3 py-2.5 shadow-sm">
            <p className="text-xs text-muted-foreground">{t("experience")}</p>
            <p className="mt-1 text-lg font-semibold">{profile.experienceYears.toFixed(1)}+ {t("years")}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/45 px-3 py-2.5 shadow-sm">
            <p className="text-xs text-muted-foreground">{t("students")}</p>
            <p className="mt-1 text-lg font-semibold">{formatStudents(stats)}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/45 px-3 py-2.5 shadow-sm">
            <p className="text-xs text-muted-foreground">{t("avgImprovement")}</p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">+{profile.averageImprovementBand.toFixed(1)} {t("bandUnit")}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/45 px-3 py-2.5 shadow-sm">
            <p className="text-xs text-muted-foreground">{t("rating")}</p>
            <p className="mt-1 text-lg font-semibold">{profile.rating.toFixed(1)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
