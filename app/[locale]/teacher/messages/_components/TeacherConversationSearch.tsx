"use client";

import {Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {Input} from "@/components/ui/input";

type TeacherConversationSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function TeacherConversationSearch({value, onChange}: TeacherConversationSearchProps) {
  const t = useTranslations("teacherMessages");

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("searchPlaceholder")}
        className="h-11 rounded-xl border-border/70 bg-background/45 pl-10"
      />
    </div>
  );
}
