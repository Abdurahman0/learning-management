"use client";

import {useEffect, useMemo, useState} from "react";
import {Clock, Music2, Trash2, UploadCloud} from "lucide-react";
import {useTranslations} from "next-intl";

import type {BuilderStructureItem} from "@/data/admin-test-builder";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";
import {fullListeningAudioService} from "@/src/services/admin/fullListeningAudio.service";
import {listeningPartsService} from "@/src/services/admin/listeningParts.service";
import {AdminApiError} from "@/src/services/admin/types";

type SegmentDraft = {
  start: string;
  end: string;
};

type FullListeningAudioModalProps = {
  open: boolean;
  testId: string;
  parts: BuilderStructureItem[];
  onClose: () => void;
  onSaved?: (nextAudioLabelByPartId: Record<string, string>) => void;
};

const PROXY_SOFT_LIMIT_MB = 4;

function toIntOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor(parsed);
}

function parseTimeToSecondsOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Allow `mm:ss` or `hh:mm:ss` for convenience, while keeping API values in seconds.
  if (trimmed.includes(":")) {
    const parts = trimmed
      .split(":")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length !== 2 && parts.length !== 3) {
      return null;
    }

    if (!parts.every((part) => /^\d+$/.test(part))) {
      return null;
    }

    const numbers = parts.map((part) => Number(part));
    if (numbers.some((n) => !Number.isFinite(n) || n < 0)) {
      return null;
    }

    if (numbers.length === 2) {
      const [minutes, seconds] = numbers;
      if (seconds > 59) return null;
      return Math.floor(minutes) * 60 + Math.floor(seconds);
    }

    const [hours, minutes, seconds] = numbers;
    if (minutes > 59 || seconds > 59) return null;
    return Math.floor(hours) * 3600 + Math.floor(minutes) * 60 + Math.floor(seconds);
  }

  return toIntOrNull(trimmed);
}

function formatSecondsAsTime(seconds: unknown) {
  const value = typeof seconds === "number" ? seconds : Number(seconds);
  if (!Number.isFinite(value)) return "";
  const total = Math.max(0, Math.floor(value));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function FullListeningAudioModal({open, testId, parts, onClose, onSaved}: FullListeningAudioModalProps) {
  const t = useTranslations("adminTestBuilder");
  const orderedParts = useMemo(() => [...parts].sort((a, b) => a.index - b.index), [parts]);
  const canUse = orderedParts.length === 4;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSource, setExistingSource] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<Record<string, SegmentDraft>>({});

  useEffect(() => {
    if (!open) return;

    let active = true;
    setError(null);
    setLoading(true);

    const initSegments = () => {
      const next: Record<string, SegmentDraft> = {};
      for (const part of orderedParts) {
        next[part.id] = {start: "", end: ""};
      }
      return next;
    };

    const load = async () => {
      if (!canUse) {
        if (!active) return;
        setExistingSource(null);
        setSourceFile(null);
        setSegments(initSegments());
        setLoading(false);
        return;
      }

      try {
        const record = await fullListeningAudioService.get(testId);
        if (!active) return;

        setExistingSource(record.source_audio_file || null);
        setSourceFile(null);

        const next = initSegments();
        for (const seg of record.segments ?? []) {
          const key = String(seg.listening_part);
          if (key in next) {
            next[key] = {
              start: formatSecondsAsTime(seg.start_seconds),
              end: formatSecondsAsTime(seg.end_seconds)
            };
          }
        }
        setSegments(next);
      } catch (e) {
        const mapped = e instanceof AdminApiError ? e : null;
        if (!active) return;
        // 404 means "not created yet" -> open create mode.
        if (mapped?.status === 404) {
          setExistingSource(null);
          setSourceFile(null);
          setSegments(initSegments());
        } else {
          setError(mapped?.message ?? t("fullListeningAudio.genericError"));
        }
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [open, testId, canUse, orderedParts, t]);

  if (!open) return null;

  const validate = () => {
    if (!canUse) {
      return t("fullListeningAudio.missingParts");
    }

    // On create, we require a file. On edit, file is optional.
    if (!existingSource && !(sourceFile instanceof File)) {
      return t("fullListeningAudio.fileRequired");
    }

    const drafts = orderedParts.map((part) => {
      const draft = segments[part.id] ?? {start: "", end: ""};
      const start = parseTimeToSecondsOrNull(draft.start);
      const end = parseTimeToSecondsOrNull(draft.end);
      return {part, start, end};
    });

    for (const row of drafts) {
      if (row.start === null || row.end === null) {
        return t("fullListeningAudio.validationSeconds");
      }
      if (row.end <= row.start) {
        return t("fullListeningAudio.validationEndAfterStart");
      }
    }

    for (let i = 1; i < drafts.length; i += 1) {
      const prev = drafts[i - 1];
      const current = drafts[i];
      if (prev.end! > current.start!) {
        return t("fullListeningAudio.validationNoOverlap");
      }
    }

    return null;
  };

  const handleSave = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payloadSegments = orderedParts.map((part) => {
      const draft = segments[part.id] ?? {start: "", end: ""};
      return {
        listening_part: part.id,
        start_seconds: parseTimeToSecondsOrNull(draft.start) ?? 0,
        end_seconds: parseTimeToSecondsOrNull(draft.end) ?? 0
      };
    });

    setSaving(true);
    try {
      if (existingSource) {
        await fullListeningAudioService.patch(testId, {
          ...(sourceFile ? {source_audio_file: sourceFile} : {}),
          segments: payloadSegments
        });
      } else {
        await fullListeningAudioService.create(testId, {
          source_audio_file: sourceFile,
          segments: payloadSegments
        });
      }

      // Refresh per-part audio labels (backend regenerates the 4 part files).
      const nextAudioLabelByPartId: Record<string, string> = {};
      await Promise.all(
        orderedParts.map(async (part) => {
          try {
            const record = await listeningPartsService.getById(part.id);
            nextAudioLabelByPartId[part.id] = String(record.audio_url ?? record.audio_file ?? "").trim();
          } catch {
            // ignore
          }
        })
      );

      onSaved?.(nextAudioLabelByPartId);
      onClose();
    } catch (e) {
      const mapped = e instanceof AdminApiError ? e : null;
      setError(mapped?.message ?? t("fullListeningAudio.genericError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingSource) {
      onClose();
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await fullListeningAudioService.remove(testId);
      onClose();
    } catch (e) {
      const mapped = e instanceof AdminApiError ? e : null;
      setError(mapped?.message ?? t("fullListeningAudio.genericError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm sm:p-6">
      <Card className="w-full max-w-4xl overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Music2 className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {t("fullListeningAudio.badge")}
                </p>
                <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">{t("fullListeningAudio.title")}</h2>
              </div>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("fullListeningAudio.description")}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {existingSource ? (
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-border/70 bg-background/50"
                onClick={handleDelete}
                disabled={saving || deleting || loading}
              >
                <Trash2 className="mr-2 size-4" />
                {deleting ? t("fullListeningAudio.deleting") : t("fullListeningAudio.delete")}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-xl"
              onClick={onClose}
              disabled={saving || deleting}
            >
              {t("fullListeningAudio.cancel")}
            </Button>
            <Button type="button" className="h-9 rounded-xl" onClick={handleSave} disabled={saving || deleting || loading || !canUse}>
              {saving ? t("fullListeningAudio.saving") : t("fullListeningAudio.save")}
            </Button>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-6">
          {!canUse ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              {t("fullListeningAudio.missingParts")}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UploadCloud className="size-4" />
                  <p className="text-xs font-semibold tracking-[0.14em] uppercase">{t("fullListeningAudio.sourceLabel")}</p>
                </div>

                {existingSource ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground/90">{t("fullListeningAudio.currentFile")}:</span>{" "}
                    <span className="break-all">{existingSource}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">{t("fullListeningAudio.noFileYet")}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setSourceFile(file);
                      if (event.target) {
                        event.target.value = "";
                      }
                    }}
                    disabled={saving || deleting || loading}
                    className="h-10 w-full rounded-xl border-border/70 bg-background/50 file:cursor-pointer"
                  />
                </div>

                {sourceFile ? (
                  <p className="mt-2 text-xs text-primary">
                    {t("fullListeningAudio.selectedFile")}: {sourceFile.name} ({Math.round(sourceFile.size / 1024 / 1024)} MB)
                  </p>
                ) : null}

                {sourceFile && sourceFile.size > PROXY_SOFT_LIMIT_MB * 1024 * 1024 ? (
                  <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    {t("fullListeningAudio.largeFileHint", {mb: PROXY_SOFT_LIMIT_MB})}
                  </div>
                ) : null}

                <p className="mt-2 text-xs text-muted-foreground">{t("fullListeningAudio.regeneratesNote")}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/35 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                <p className="text-xs font-semibold tracking-[0.14em] uppercase">{t("fullListeningAudio.segmentsTitle")}</p>
              </div>
              <p className="text-xs text-muted-foreground">{t("fullListeningAudio.timeFormatHint")}</p>

              <div className="space-y-3">
                {orderedParts.map((part) => {
                  const draft = segments[part.id] ?? {start: "", end: ""};
                  return (
                    <div key={part.id} className="rounded-2xl border border-border/70 bg-background/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge className="rounded-full border border-border/70 bg-muted/30 px-2 py-0.5 text-[10px] tracking-wide uppercase">
                              {t("structure.labels.section", {index: part.index})}
                            </Badge>
                            <p className="truncate text-sm font-semibold text-foreground">{part.title}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{part.questionRangeLabel}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                            {t("fullListeningAudio.startSeconds")}
                          </p>
                          <Input
                            value={draft.start}
                            onChange={(event) =>
                              setSegments((current) => ({
                                ...current,
                                [part.id]: {...(current[part.id] ?? {start: "", end: ""}), start: event.target.value}
                              }))
                            }
                            inputMode="text"
                            placeholder="0:00"
                            className="h-9 rounded-xl border-border/70 bg-background/50"
                            disabled={saving || deleting || loading}
                            autoComplete="off"
                            spellCheck={false}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                            {t("fullListeningAudio.endSeconds")}
                          </p>
                          <Input
                            value={draft.end}
                            onChange={(event) =>
                              setSegments((current) => ({
                                ...current,
                                [part.id]: {...(current[part.id] ?? {start: "", end: ""}), end: event.target.value}
                              }))
                            }
                            inputMode="text"
                            placeholder="5:00"
                            className="h-9 rounded-xl border-border/70 bg-background/50"
                            disabled={saving || deleting || loading}
                            autoComplete="off"
                            spellCheck={false}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={cn("rounded-2xl border border-border/70 bg-muted/15 p-3 text-xs text-muted-foreground", loading && "opacity-70")}>
                {loading ? t("fullListeningAudio.loading") : t("fullListeningAudio.validationHint")}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
