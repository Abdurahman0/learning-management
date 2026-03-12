"use client";

import {useTranslations} from "next-intl";

import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {TeacherAnnouncementAudienceOption} from "@/data/teacher/selectors";
import type {TeacherAnnouncementAudience} from "@/types/teacher";

type TeacherAnnouncementAudienceSelectProps = {
  value: TeacherAnnouncementAudience;
  options: TeacherAnnouncementAudienceOption[];
  onChange: (value: TeacherAnnouncementAudience) => void;
};

export function TeacherAnnouncementAudienceSelect({value, options, onChange}: TeacherAnnouncementAudienceSelectProps) {
  const t = useTranslations("teacherAnnouncements");

  return (
    <Select value={value} onValueChange={(next) => onChange(next as TeacherAnnouncementAudience)}>
      <SelectTrigger className="h-11 w-full rounded-xl border-border/70 bg-background/45">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {t(`audienceOptions.${option.id}`)} ({option.studentCount})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
