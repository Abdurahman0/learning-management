"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import type {GeneralSettings, TimezoneOption} from "@/data/admin-settings";

type GeneralSettingsCardProps = {
  settings: GeneralSettings;
  timezoneOptions: TimezoneOption[];
  onPlatformNameChange: (value: string) => void;
  onSupportEmailChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onMaintenanceModeChange: (value: boolean) => void;
};

export function GeneralSettingsCard({
  settings,
  timezoneOptions,
  onPlatformNameChange,
  onSupportEmailChange,
  onTimezoneChange,
  onMaintenanceModeChange
}: GeneralSettingsCardProps) {
  const t = useTranslations("adminSettings");

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0">
      <CardHeader className="space-y-1 border-b border-border/60 pt-5 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">{t("generalSettings")}</CardTitle>
        <CardDescription>{t("generalSettingsDescription")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-5 pb-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="platformName">{t("platformName")}</Label>
            <Input
              id="platformName"
              value={settings.platformName}
              onChange={(event) => onPlatformNameChange(event.target.value)}
              className="h-11 rounded-xl border-border/70 bg-background/45"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">{t("supportEmail")}</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(event) => onSupportEmailChange(event.target.value)}
              className="h-11 rounded-xl border-border/70 bg-background/45"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">{t("timezone")}</Label>
            <Select value={settings.timezone} onValueChange={onTimezoneChange}>
              <SelectTrigger id="timezone" className="h-11 w-full rounded-xl border-border/70 bg-background/45">
                <SelectValue placeholder={t("timezonePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/35 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold tracking-tight">{t("maintenanceMode")}</p>
                <p className="text-sm text-muted-foreground">{t("maintenanceModeDescription")}</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={onMaintenanceModeChange}
                aria-label={t("maintenanceMode")}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
