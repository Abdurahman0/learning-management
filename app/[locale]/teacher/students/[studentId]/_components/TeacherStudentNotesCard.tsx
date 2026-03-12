"use client";

import {useState, type RefObject} from "react";
import {NotebookPen} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherStudentNote} from "@/types/teacher";

type TeacherStudentNotesCardProps = {
  notes: TeacherStudentNote[];
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onSaveNote: (content: string) => void;
};

function formatDate(locale: string, isoDate: string) {
  return new Intl.DateTimeFormat(locale, {month: "short", day: "numeric"}).format(new Date(isoDate));
}

export function TeacherStudentNotesCard({notes, inputRef, onSaveNote}: TeacherStudentNotesCardProps) {
  const t = useTranslations("teacherStudentProfile");
  const locale = useLocale();
  const [value, setValue] = useState("");

  const submit = () => {
    const content = value.trim();
    if (!content) {
      return;
    }

    onSaveNote(content);
    setValue("");
  };

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="inline-flex items-center gap-2 text-xl">
          <NotebookPen className="size-4.5 text-primary" />
          {t("teacherNotes")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5 pb-5">
        {notes.map((note) => (
          <div key={note.id} className="rounded-xl border border-border/70 bg-background/50 p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{note.teacherName}</p>
              <p className="text-xs text-muted-foreground">{formatDate(locale, note.createdAt)}</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{note.content}</p>
          </div>
        ))}

        <textarea
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("addNotePlaceholder")}
          rows={4}
          className="w-full resize-none rounded-xl border border-border/70 bg-background/45 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/55"
        />

        <Button type="button" className="w-full rounded-xl" onClick={submit} disabled={!value.trim()}>
          {t("saveNote")}
        </Button>
      </CardContent>
    </Card>
  );
}
