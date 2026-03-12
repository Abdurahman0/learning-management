"use client";

import {BadgeCheck} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherModuleKey} from "@/types/teacher";

type TeachingProfileFormState = {
  specialization: string;
  totalExperience: string;
  bio: string;
  preferredModules: TeacherModuleKey[];
};

type TeacherTeachingProfileCardProps = {
  value: TeachingProfileFormState;
  onChange: (value: TeachingProfileFormState) => void;
  onCancel: () => void;
  onSave: () => void;
  canSave: boolean;
};

const modules: TeacherModuleKey[] = ["reading", "listening", "writing", "speaking"];
const inputClassName =
  "h-11 w-full rounded-xl border border-border/70 bg-background/45 px-3 text-sm shadow-sm outline-none transition-[border-color,box-shadow,background-color] focus:border-primary/55 focus:bg-background/60 focus:shadow-primary/10 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.14)]";
const labelClassName = "text-sm font-medium text-foreground/90";

export function TeacherTeachingProfileCard({
  value,
  onChange,
  onCancel,
  onSave,
  canSave
}: TeacherTeachingProfileCardProps) {
  const t = useTranslations("teacherProfile");

  const toggleModule = (module: TeacherModuleKey, checked: boolean) => {
    const nextModules = checked
      ? value.preferredModules.includes(module)
        ? value.preferredModules
        : [...value.preferredModules, module]
      : value.preferredModules.filter((item) => item !== module);

    onChange({...value, preferredModules: nextModules});
  };

  return (
    <Card className="rounded-2xl border-border/70 bg-card/80 py-0 shadow-[0_10px_36px_-26px_rgba(59,130,246,0.65)]">
      <CardHeader className="border-b border-border/65 pt-6 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <BadgeCheck className="size-5 text-primary" />
          {t("teachingProfile")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-5 pb-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className={labelClassName}>{t("specialization")}</span>
            <input
              value={value.specialization}
              onChange={(event) => onChange({...value, specialization: event.target.value})}
              className={inputClassName}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>{t("totalExperience")}</span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={value.totalExperience}
              onChange={(event) => onChange({...value, totalExperience: event.target.value})}
              className={inputClassName}
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className={labelClassName}>{t("bio")}</span>
          <textarea
            rows={4}
            value={value.bio}
            onChange={(event) => onChange({...value, bio: event.target.value})}
            className="w-full resize-none rounded-xl border border-border/70 bg-background/45 px-3 py-2.5 text-sm shadow-sm outline-none transition-[border-color,box-shadow,background-color] focus:border-primary/55 focus:bg-background/60 focus:shadow-primary/10 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.14)]"
          />
        </label>

        <section className="space-y-2">
          <p className={labelClassName}>{t("preferredModules")}</p>
          <div className="flex flex-wrap gap-2">
            {modules.map((module) => {
              const active = value.preferredModules.includes(module);

              return (
                <label
                  key={module}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ${active ? "border-primary/35 bg-primary/16 text-primary shadow-[0_8px_20px_-16px_rgba(59,130,246,0.75)]" : "border-border/70 bg-background/40 text-muted-foreground hover:border-border hover:bg-background/55 hover:text-foreground"}`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) => toggleModule(module, event.target.checked)}
                    className="size-3.5 accent-primary"
                  />
                  {t(`moduleLabels.${module}`)}
                </label>
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2.5">
          <Button type="button" variant="ghost" className="rounded-xl" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button type="button" className="rounded-xl" disabled={!canSave} onClick={onSave}>
            {t("saveChanges")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
