"use client";

import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {ACHIEVEMENT_CATEGORY_OPTIONS, type ActiveAchievementIcon, type ActiveAchievementTone, type AchievementCategory} from "@/data/admin-achievements";

type CreateAchievementPayload = {
  title: string;
  description: string;
  badgeIcon: ActiveAchievementIcon;
  category: AchievementCategory;
  timesEarned: number;
};

type CreateAchievementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: CreateAchievementPayload) => void;
};

const iconOptions: ActiveAchievementIcon[] = ["trophy", "award", "flame", "sparkles"];
const toneByCategory: Record<AchievementCategory, ActiveAchievementTone> = {
  streak: "orange",
  score: "gold",
  module: "slate",
  engagement: "purple"
};

export function CreateAchievementDialog({open, onOpenChange, onCreate}: CreateAchievementDialogProps) {
  const t = useTranslations("adminAchievements");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<ActiveAchievementIcon>("trophy");
  const [category, setCategory] = useState<AchievementCategory>("streak");
  const [timesEarned, setTimesEarned] = useState("0");

  useEffect(() => {
    if (!open) {
      return;
    }
    setTitle("");
    setDescription("");
    setIcon("trophy");
    setCategory("streak");
    setTimesEarned("0");
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-l border-border/70 bg-background/95 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border/70 pb-4">
          <SheetTitle>{t("createDialog.title")}</SheetTitle>
          <SheetDescription>{t("createDialog.description")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="achievement-name">{t("createDialog.fields.name")}</Label>
            <Input
              id="achievement-name"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("createDialog.placeholders.name")}
              className="h-10 rounded-xl border-border/70 bg-card/55"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="achievement-description">{t("createDialog.fields.description")}</Label>
            <textarea
              id="achievement-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("createDialog.placeholders.description")}
              className="focus-visible:border-ring focus-visible:ring-ring/40 min-h-[96px] w-full rounded-xl border border-border/70 bg-card/55 px-3 py-2 text-sm outline-none focus-visible:ring-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("createDialog.fields.iconType")}</Label>
              <Select value={icon} onValueChange={(value) => setIcon(value as ActiveAchievementIcon)}>
                <SelectTrigger className="h-10 rounded-xl border-border/70 bg-card/55">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`iconTypes.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("createDialog.fields.category")}</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as AchievementCategory)}>
                <SelectTrigger className="h-10 rounded-xl border-border/70 bg-card/55">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACHIEVEMENT_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`categories.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="times-earned">{t("createDialog.fields.timesEarnedDefault")}</Label>
            <Input
              id="times-earned"
              type="number"
              min={0}
              value={timesEarned}
              onChange={(event) => setTimesEarned(event.target.value)}
              className="h-10 rounded-xl border-border/70 bg-card/55"
            />
          </div>
        </div>

        <SheetFooter className="mt-auto border-t border-border/70">
          <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            onClick={() => {
              if (!title.trim()) {
                return;
              }
              onCreate({
                title: title.trim(),
                description: description.trim(),
                badgeIcon: icon,
                category,
                timesEarned: Math.max(0, Number(timesEarned || 0))
              });
              onOpenChange(false);
            }}
          >
            {t("common.create")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export {toneByCategory, type CreateAchievementPayload};
