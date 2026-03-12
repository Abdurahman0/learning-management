"use client";

import {Paperclip, SendHorizonal} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";

type TeacherMessageComposerProps = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function TeacherMessageComposer({value, disabled, onChange, onSend}: TeacherMessageComposerProps) {
  const t = useTranslations("teacherMessages");
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-border/65 px-4 py-3.5">
      <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-background/40 px-2.5 py-2">
        <Button type="button" size="icon" variant="ghost" className="size-8 rounded-lg text-muted-foreground">
          <Paperclip className="size-4" />
        </Button>

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder={t("writeMessage")}
          className="h-9 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm outline-none placeholder:text-muted-foreground"
        />

        <Button type="button" size="icon" className="size-8 rounded-lg" disabled={!canSend} onClick={onSend}>
          <SendHorizonal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
