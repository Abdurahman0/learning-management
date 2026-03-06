"use client";

import {EllipsisVertical, Eye, FilePenLine, Files, Trash2} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type {AdminTest} from "@/data/admin-tests";

type TestActionsMenuProps = {
  test: AdminTest;
  onEdit: (testId: string) => void;
  onPreview: (testId: string) => void;
  onDuplicate: (testId: string) => void;
  onDelete: (testId: string) => void;
};

export function TestActionsMenu({test, onEdit, onPreview, onDuplicate, onDelete}: TestActionsMenuProps) {
  const t = useTranslations("adminTests");
  const [open, setOpen] = useState(false);

  const handleAction = (callback: () => void) => {
    callback();
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          aria-label={t("table.actions.open")}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onSelect={() => handleAction(() => onEdit(test.id))}>
          <FilePenLine className="size-4" />
          {t("table.actions.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleAction(() => onPreview(test.id))}>
          <Eye className="size-4" />
          {t("table.actions.preview")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleAction(() => onDuplicate(test.id))}>
          <Files className="size-4" />
          {t("table.actions.duplicate")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-300"
          onSelect={() => handleAction(() => onDelete(test.id))}
        >
          <Trash2 className="size-4" />
          {t("table.actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
