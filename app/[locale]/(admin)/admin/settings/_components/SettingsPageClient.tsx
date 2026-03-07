"use client";

import {CheckCircle2} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {DEFAULT_GENERAL_SETTINGS, GENERAL_SETTINGS_TIMEZONE_OPTIONS, type GeneralSettings} from "@/data/admin-settings";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {GeneralSettingsCard} from "./GeneralSettingsCard";
import {SettingsHeader} from "./SettingsHeader";

const SAVE_TOAST_TIMEOUT_MS = 2400;

function cloneGeneralSettings(settings: GeneralSettings): GeneralSettings {
  return {...settings};
}

function toSnapshot(settings: GeneralSettings) {
  return JSON.stringify(settings);
}

const DEFAULT_SETTINGS_SNAPSHOT = toSnapshot(DEFAULT_GENERAL_SETTINGS);

export function SettingsPageClient() {
  const t = useTranslations("adminSettings");
  const [settings, setSettings] = useState<GeneralSettings>(() => cloneGeneralSettings(DEFAULT_GENERAL_SETTINGS));
  const [savedSnapshot, setSavedSnapshot] = useState(() => DEFAULT_SETTINGS_SNAPSHOT);
  const [saveToastOpen, setSaveToastOpen] = useState(false);

  const currentSnapshot = useMemo(() => toSnapshot(settings), [settings]);
  const hasChanges = currentSnapshot !== savedSnapshot;
  const isDefaultState = currentSnapshot === DEFAULT_SETTINGS_SNAPSHOT;

  useEffect(() => {
    if (!saveToastOpen) {
      return;
    }

    const timer = window.setTimeout(() => setSaveToastOpen(false), SAVE_TOAST_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [saveToastOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <SettingsHeader
            hasChanges={hasChanges}
            saveDisabled={!hasChanges}
            resetDisabled={isDefaultState}
            onResetToDefault={() => {
              setSettings(cloneGeneralSettings(DEFAULT_GENERAL_SETTINGS));
            }}
            onSaveChanges={() => {
              console.info("[admin-settings] save-changes", settings);
              setSavedSnapshot(currentSnapshot);
              setSaveToastOpen(true);
            }}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <GeneralSettingsCard
              settings={settings}
              timezoneOptions={GENERAL_SETTINGS_TIMEZONE_OPTIONS}
              onPlatformNameChange={(value) => setSettings((current) => ({...current, platformName: value}))}
              onSupportEmailChange={(value) => setSettings((current) => ({...current, supportEmail: value}))}
              onTimezoneChange={(value) => setSettings((current) => ({...current, timezone: value}))}
              onMaintenanceModeChange={(value) => setSettings((current) => ({...current, maintenanceMode: value}))}
            />
          </main>
        </div>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed top-20 right-4 z-[60]">
        {saveToastOpen ? (
          <div className="min-w-[260px] rounded-xl border border-emerald-500/35 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="size-3.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t("toast.savedTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("toast.savedDescription")}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
