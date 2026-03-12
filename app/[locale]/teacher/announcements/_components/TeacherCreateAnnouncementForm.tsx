"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {
  TeacherAnnouncementAudienceOption,
  TeacherAnnouncementCreateInput
} from "@/data/teacher/selectors";
import type {TeacherAnnouncementAudience, TeacherAnnouncementAttachment} from "@/types/teacher";

import {TeacherAnnouncementAudienceSelect} from "./TeacherAnnouncementAudienceSelect";
import {TeacherAnnouncementFileUploader} from "./TeacherAnnouncementFileUploader";
import {TeacherAnnouncementScheduleInput} from "./TeacherAnnouncementScheduleInput";

type TeacherCreateAnnouncementFormProps = {
  audienceOptions: TeacherAnnouncementAudienceOption[];
  onSubmit: (input: TeacherAnnouncementCreateInput) => boolean;
};

export function TeacherCreateAnnouncementForm({audienceOptions, onSubmit}: TeacherCreateAnnouncementFormProps) {
  const t = useTranslations("teacherAnnouncements");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<TeacherAnnouncementAudience>("all");
  const [scheduleDate, setScheduleDate] = useState("");
  const [attachment, setAttachment] = useState<TeacherAnnouncementAttachment | undefined>(undefined);

  const canSubmit = title.trim().length > 2 && content.trim().length > 8;

  const submit = (mode: TeacherAnnouncementCreateInput["mode"]) => {
    if (!canSubmit) {
      return;
    }

    const created = onSubmit({
      mode,
      title: title.trim(),
      content: content.trim(),
      audience,
      scheduledDate: scheduleDate || undefined,
      attachment
    });

    if (!created) {
      return;
    }

    setTitle("");
    setContent("");
    setScheduleDate("");
    setAttachment(undefined);
  };

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("createAnnouncement")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 border-t border-border/65 pt-5 pb-5">
        <label className="space-y-2">
          <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("announcementTitle")}</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("announcementTitlePlaceholder")}
            className="h-11 w-full rounded-xl border border-border/70 bg-background/45 px-3 text-sm outline-none transition-colors focus:border-primary/55"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("messageContent")}</span>
          <textarea
            rows={6}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t("messageContentPlaceholder")}
            className="w-full resize-none rounded-xl border border-border/70 bg-background/45 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/55"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("targetAudience")}</span>
            <TeacherAnnouncementAudienceSelect value={audience} options={audienceOptions} onChange={setAudience} />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("scheduleDate")}</span>
            <TeacherAnnouncementScheduleInput value={scheduleDate} onChange={setScheduleDate} />
          </label>
        </div>

        <section className="space-y-2">
          <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("attachResource")}</span>
          <TeacherAnnouncementFileUploader value={attachment} onChange={setAttachment} />
        </section>

        <div className="flex flex-wrap justify-end gap-2.5">
          <Button type="button" variant="secondary" className="rounded-xl" disabled={!canSubmit} onClick={() => submit("draft")}>
            {t("saveDraft")}
          </Button>
          <Button type="button" className="rounded-xl" disabled={!canSubmit} onClick={() => submit("publish")}>
            {t("publishNow")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
