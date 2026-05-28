"use client";

import {useMemo, useState, useSyncExternalStore} from "react";
import {NotebookPen, Trash2} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {loadTextNotes, saveTextNotes, subscribeTextNotes} from "@/lib/text-notes-storage";
import type {StoredTextNote} from "@/lib/text-notes-storage";
import {cn} from "@/lib/utils";

type TestNotesButtonProps = {
  storageKey: string;
  className?: string;
};

function getNotesSnapshot(storageKey: string) {
  return JSON.stringify(loadTextNotes(storageKey));
}

function parseNotesSnapshot(snapshot: string): StoredTextNote[] {
  try {
    const parsed = JSON.parse(snapshot) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredTextNote[]) : [];
  } catch {
    return [];
  }
}

export function TestNotesButton({storageKey, className}: TestNotesButtonProps) {
  const [open, setOpen] = useState(false);
  const snapshot = useSyncExternalStore(
    (onStoreChange) => subscribeTextNotes(storageKey, () => onStoreChange()),
    () => getNotesSnapshot(storageKey),
    () => "[]"
  );
  const notes = useMemo(
    () => parseNotesSnapshot(snapshot).sort((a, b) => b.createdAt - a.createdAt || b.updatedAt - a.updatedAt),
    [snapshot]
  );
  const noteCount = notes.length;

  const updateNote = (id: string, value: string) => {
    const next = notes.map((note) => (note.id === id ? {...note, note: value, updatedAt: Date.now()} : note));
    saveTextNotes(storageKey, next);
  };

  const deleteNote = (id: string) => {
    saveTextNotes(storageKey, notes.filter((note) => note.id !== id));
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn("relative h-9 w-9 rounded-xl border-border/70 bg-background/60 p-0 sm:h-10 sm:w-10", className)}
        aria-label="Open notes"
        title="Notes"
      >
        <NotebookPen className="size-4" />
        {noteCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold leading-none text-white">
            {noteCount > 99 ? "99+" : noteCount}
          </span>
        ) : null}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full border-l border-border/70 bg-background/95 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border/70">
            <SheetTitle className="inline-flex items-center gap-2">
              <NotebookPen className="size-4 text-blue-600" />
              Notes
            </SheetTitle>
            <SheetDescription>{noteCount ? `${noteCount} saved note${noteCount === 1 ? "" : "s"}` : "No notes yet"}</SheetDescription>
          </SheetHeader>

          <div className="h-[calc(100dvh-97px)] space-y-3 overflow-y-auto p-4">
            {notes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/35 px-4 py-6 text-sm text-muted-foreground">
                Select text during the test and click Note to create one.
              </div>
            ) : null}

            {notes.map((note) => (
              <article key={note.id} className="rounded-xl border border-border/70 bg-card/80 p-3 shadow-sm">
                <p className="text-sm font-semibold text-foreground italic">{note.quote}</p>
                <textarea
                  value={note.note}
                  onChange={(event) => updateNote(note.id, event.target.value)}
                  placeholder="Type your note..."
                  className="mt-2 min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-blue-500/60"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-md px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => deleteNote(note.id)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
