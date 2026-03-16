"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {CheckCircle2} from "lucide-react";
import {useTranslations} from "next-intl";

import {
  getTeacherProfilePageData,
  requestTeacherAvatarChange,
  updateTeacherPassword,
  updateTeacherProfilePersonalInfo,
  updateTeacherTeachingProfile,
  type TeacherProfilePageData
} from "@/data/teacher/selectors";
import type {TeacherModuleKey} from "@/types/teacher";

import {TeacherSidebar} from "../../_components/TeacherSidebar";
import {TeacherTopbar} from "../../_components/TeacherTopbar";
import {TeacherAccountSecurityCard} from "./TeacherAccountSecurityCard";
import {TeacherPersonalInformationCard} from "./TeacherPersonalInformationCard";
import {TeacherProfileHeroCard} from "./TeacherProfileHeroCard";
import {TeacherProfileRecentActivityCard} from "./TeacherProfileRecentActivityCard";
import {TeacherProfileStatsGrid} from "./TeacherProfileStatsGrid";
import {TeacherProfileStatusCard} from "./TeacherProfileStatusCard";
import {TeacherTeachingProfileCard} from "./TeacherTeachingProfileCard";

type TeacherProfilePageClientProps = {
  initialData: TeacherProfilePageData;
};

type PersonalFormState = {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  country: string;
  timezone: string;
};

type TeachingFormState = {
  specialization: string;
  totalExperience: string;
  bio: string;
  preferredModules: TeacherModuleKey[];
};

type SecurityFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function buildPersonalForm(data: TeacherProfilePageData): PersonalFormState {
  return {
    fullName: data.profile.name,
    emailAddress: data.profile.email,
    phoneNumber: data.profile.phone,
    country: data.profile.country,
    timezone: data.profile.timezone
  };
}

function buildTeachingForm(data: TeacherProfilePageData): TeachingFormState {
  return {
    specialization: data.profile.specialization,
    totalExperience: data.profile.experienceYears.toString(),
    bio: data.profile.bio,
    preferredModules: [...data.profile.preferredModules]
  };
}

export function TeacherProfilePageClient({initialData}: TeacherProfilePageClientProps) {
  const t = useTranslations("teacherProfile");
  const personalCardRef = useRef<HTMLElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);

  const [pageData, setPageData] = useState(initialData);
  const [personalForm, setPersonalForm] = useState(() => buildPersonalForm(initialData));
  const [teachingForm, setTeachingForm] = useState(() => buildTeachingForm(initialData));
  const [securityForm, setSecurityForm] = useState<SecurityFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const refreshData = () => {
    const next = getTeacherProfilePageData();
    setPageData(next);
    setPersonalForm(buildPersonalForm(next));
    setTeachingForm(buildTeachingForm(next));
  };

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timer = window.setTimeout(() => setActionMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const personalCanSave = useMemo(() => {
    return (
      personalForm.fullName.trim().length > 2
      && personalForm.emailAddress.includes("@")
      && personalForm.phoneNumber.trim().length > 5
    );
  }, [personalForm]);

  const teachingCanSave = useMemo(() => {
    return (
      teachingForm.specialization.trim().length > 2
      && Number.isFinite(Number(teachingForm.totalExperience))
      && Number(teachingForm.totalExperience) >= 0
      && teachingForm.bio.trim().length > 20
      && teachingForm.preferredModules.length > 0
    );
  }, [teachingForm]);

  const securityCanSubmit = useMemo(() => {
    return (
      securityForm.currentPassword.length > 0
      && securityForm.newPassword.length > 0
      && securityForm.confirmPassword.length > 0
    );
  }, [securityForm]);

  const handleEditProfile = () => {
    personalCardRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
    window.setTimeout(() => fullNameInputRef.current?.focus(), 220);
  };

  const handleChangeAvatar = () => {
    requestTeacherAvatarChange();
    refreshData();
    setActionMessage(t("feedback.avatarRequested"));
  };

  const handleSavePersonal = () => {
    if (!personalCanSave) {
      return;
    }

    updateTeacherProfilePersonalInfo({
      fullName: personalForm.fullName,
      email: personalForm.emailAddress,
      phone: personalForm.phoneNumber,
      country: personalForm.country,
      timezone: personalForm.timezone
    });

    refreshData();
    setActionMessage(t("feedback.personalSaved"));
  };

  const handleSaveTeaching = () => {
    if (!teachingCanSave) {
      return;
    }

    updateTeacherTeachingProfile({
      specialization: teachingForm.specialization,
      experienceYears: Number(teachingForm.totalExperience),
      bio: teachingForm.bio,
      preferredModules: teachingForm.preferredModules
    });

    refreshData();
    setActionMessage(t("feedback.teachingSaved"));
  };

  const handleUpdatePassword = () => {
    setSecurityError(null);

    const result = updateTeacherPassword({
      currentPassword: securityForm.currentPassword,
      newPassword: securityForm.newPassword,
      confirmPassword: securityForm.confirmPassword
    });

    if (!result.success) {
      setSecurityError(t(`passwordErrors.${result.error}`));
      return;
    }

    setSecurityForm({currentPassword: "", newPassword: "", confirmPassword: ""});
    refreshData();
    setActionMessage(t("feedback.passwordUpdated"));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_42%),radial-gradient(circle_at_85%_15%,hsl(var(--primary)/0.07),transparent_34%)]"
      />
      <div className="flex min-h-screen">
        <TeacherSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopbar title={t("title")} />

          <main className="mx-auto min-w-0 w-full max-w-370 space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <section>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
            </section>

            <TeacherProfileHeroCard
              profile={pageData.profile}
              stats={pageData.stats}
              onEditProfile={handleEditProfile}
              onChangeAvatar={handleChangeAvatar}
            />

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.82fr)]">
              <div className="space-y-5">
                <section ref={personalCardRef}>
                  <TeacherPersonalInformationCard
                    value={personalForm}
                    onChange={setPersonalForm}
                    onCancel={() => setPersonalForm(buildPersonalForm(pageData))}
                    onSave={handleSavePersonal}
                    canSave={personalCanSave}
                    fullNameInputRef={fullNameInputRef}
                  />
                </section>

                <TeacherTeachingProfileCard
                  value={teachingForm}
                  onChange={setTeachingForm}
                  onCancel={() => setTeachingForm(buildTeachingForm(pageData))}
                  onSave={handleSaveTeaching}
                  canSave={teachingCanSave}
                />

                <TeacherAccountSecurityCard
                  value={securityForm}
                  onChange={setSecurityForm}
                  onSubmit={handleUpdatePassword}
                  canSubmit={securityCanSubmit}
                  errorMessage={securityError}
                />
              </div>

              <div className="space-y-5">
                <TeacherProfileStatsGrid items={pageData.stats} />
                <TeacherProfileRecentActivityCard items={pageData.recentActivity} />
                <TeacherProfileStatusCard
                  verified={pageData.profile.verified}
                  profileCompletion={pageData.profile.profileCompletion}
                />
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
