export type GeneralSettings = {
  platformName: string;
  supportEmail: string;
  timezone: string;
  maintenanceMode: boolean;
};

export type TimezoneOption = {
  value: string;
  label: string;
};

export const DEFAULT_GENERAL_SETTINGS = {
  platformName: "IELTS MASTER",
  supportEmail: "support@ieltsmaster.com",
  timezone: "utc_london",
  maintenanceMode: false
} satisfies GeneralSettings;

export const GENERAL_SETTINGS_TIMEZONE_OPTIONS = [
  {value: "utc_london", label: "UTC (London)"},
  {value: "asia_tashkent", label: "Asia/Tashkent"},
  {value: "europe_berlin", label: "Europe/Berlin"},
  {value: "america_new_york", label: "America/New_York"}
] satisfies TimezoneOption[];
