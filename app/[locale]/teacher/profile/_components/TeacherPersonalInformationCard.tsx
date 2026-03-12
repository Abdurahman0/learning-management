"use client";

import {UserRound} from "lucide-react";
import {useTranslations} from "next-intl";
import type {RefObject} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type TeacherPersonalFormState = {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  country: string;
  timezone: string;
};

type TeacherPersonalInformationCardProps = {
  value: TeacherPersonalFormState;
  onChange: (value: TeacherPersonalFormState) => void;
  onCancel: () => void;
  onSave: () => void;
  canSave: boolean;
  fullNameInputRef?: RefObject<HTMLInputElement | null>;
};

const countryOptions = ["United States", "United Kingdom", "Uzbekistan", "Canada", "Australia"];
const timezoneOptions = [
  "(GMT-05:00) Eastern Time (US & Canada)",
  "(GMT+00:00) London",
  "(GMT+05:00) Tashkent",
  "(GMT+10:00) Sydney"
];
const inputClassName =
  "h-11 w-full rounded-xl border border-border/70 bg-background/45 px-3 text-sm shadow-sm outline-none transition-[border-color,box-shadow,background-color] focus:border-primary/55 focus:bg-background/60 focus:shadow-primary/10 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.14)]";
const labelClassName = "text-sm font-medium text-foreground/90";

export function TeacherPersonalInformationCard({
  value,
  onChange,
  onCancel,
  onSave,
  canSave,
  fullNameInputRef
}: TeacherPersonalInformationCardProps) {
  const t = useTranslations("teacherProfile");

  const update = <K extends keyof TeacherPersonalFormState>(key: K, nextValue: TeacherPersonalFormState[K]) => {
    onChange({...value, [key]: nextValue});
  };

  return (
    <Card className="rounded-2xl border-border/70 bg-card/80 py-0 shadow-[0_10px_36px_-26px_rgba(59,130,246,0.65)]">
      <CardHeader className="border-b border-border/65 pt-6 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <UserRound className="size-5 text-primary" />
          {t("personalInformation")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-5 pb-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className={labelClassName}>{t("fullName")}</span>
            <input
              ref={fullNameInputRef}
              value={value.fullName}
              onChange={(event) => update("fullName", event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>{t("emailAddress")}</span>
            <input
              value={value.emailAddress}
              onChange={(event) => update("emailAddress", event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>{t("phoneNumber")}</span>
            <input
              value={value.phoneNumber}
              onChange={(event) => update("phoneNumber", event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>{t("country")}</span>
            <Select value={value.country} onValueChange={(nextValue) => update("country", nextValue)}>
              <SelectTrigger className={`${inputClassName} justify-between`}>
                <SelectValue placeholder={t("country")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/70 bg-card/95 backdrop-blur-md">
                {countryOptions.map((option) => (
                  <SelectItem key={option} value={option} className="rounded-lg">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        <label className="space-y-2">
          <span className={labelClassName}>{t("timezone")}</span>
          <Select value={value.timezone} onValueChange={(nextValue) => update("timezone", nextValue)}>
            <SelectTrigger className={`${inputClassName} justify-between`}>
              <SelectValue placeholder={t("timezone")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/70 bg-card/95 backdrop-blur-md">
              {timezoneOptions.map((option) => (
                <SelectItem key={option} value={option} className="rounded-lg">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="mt-2 flex flex-wrap justify-end gap-2.5">
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
