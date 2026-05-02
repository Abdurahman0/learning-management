"use client";

import {useEffect, useMemo, useState} from "react";
import {BrainCircuit, Save, TriangleAlert} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmModal} from "@/components/ui/confirm-modal";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {adminUsersService, type AdminReasonUsageLimits} from "@/src/services/admin/users.service";

function toLimit(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function GlobalReasonUsageLimitsCard() {
  const [limits, setLimits] = useState<AdminReasonUsageLimits | null>(null);
  const [readingLimit, setReadingLimit] = useState("");
  const [listeningLimit, setListeningLimit] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updatedAt = useMemo(() => formatUpdatedAt(limits?.updatedAt ?? null), [limits?.updatedAt]);

  useEffect(() => {
    let active = true;

    const loadLimits = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await adminUsersService.getGlobalReasonUsageLimits();
        if (!active) return;
        setLimits(response);
        setReadingLimit(String(response.readingLimit));
        setListeningLimit(String(response.listeningLimit));
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Could not load global mistake-reason limits.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadLimits();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const validateAndOpenConfirm = () => {
    const nextReadingLimit = toLimit(readingLimit);
    const nextListeningLimit = toLimit(listeningLimit);

    if (nextReadingLimit === null || nextListeningLimit === null) {
      setError("Limits must be whole numbers from 0 and above.");
      setNotice(null);
      return;
    }

    setError(null);
    setConfirmOpen(true);
  };

  const handleSave = async () => {
    const nextReadingLimit = toLimit(readingLimit);
    const nextListeningLimit = toLimit(listeningLimit);
    if (nextReadingLimit === null || nextListeningLimit === null) {
      setConfirmOpen(false);
      setError("Limits must be whole numbers from 0 and above.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = {
        ...(limits?.readingLimit !== nextReadingLimit ? {readingLimit: nextReadingLimit} : {}),
        ...(limits?.listeningLimit !== nextListeningLimit ? {listeningLimit: nextListeningLimit} : {})
      };
      if (!Object.keys(payload).length) {
        setConfirmOpen(false);
        setNotice("No global limit changes to save.");
        return;
      }
      const response = await adminUsersService.updateGlobalReasonUsageLimits(payload);
      setLimits(response);
      setReadingLimit(String(response.readingLimit));
      setListeningLimit(String(response.listeningLimit));
      setConfirmOpen(false);
      setNotice("Global weekly limits saved for all students.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save global mistake-reason limits.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card className="rounded-3xl border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-card/75 to-cyan-500/10 py-0">
        <CardHeader className="space-y-2 border-b border-border/60 pt-5 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
                <span className="grid size-9 place-items-center rounded-2xl border border-blue-500/25 bg-blue-500/15 text-blue-400">
                  <BrainCircuit className="size-4.5" />
                </span>
                Global mistake-reason limits
              </CardTitle>
              <CardDescription>
                Default weekly AI reason/solution usage for every student. Saving here overwrites per-user overrides.
              </CardDescription>
            </div>
            {updatedAt ? (
              <span className="rounded-full border border-border/70 bg-background/55 px-3 py-1 text-xs text-muted-foreground">
                Updated {updatedAt}
              </span>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-5 pb-5">
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-100">
            <div className="flex gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <p>
                This is a global policy change. It immediately updates active weekly periods and clears previous per-student custom values.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="global-reading-reason-limit">Reading limit per week</Label>
              <Input
                id="global-reading-reason-limit"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={readingLimit}
                disabled={isLoading || isSaving}
                onChange={(event) => setReadingLimit(event.target.value)}
                className="h-11 rounded-xl border-border/70 bg-background/45"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="global-listening-reason-limit">Listening limit per week</Label>
              <Input
                id="global-listening-reason-limit"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={listeningLimit}
                disabled={isLoading || isSaving}
                onChange={(event) => setListeningLimit(event.target.value)}
                className="h-11 rounded-xl border-border/70 bg-background/45"
              />
            </div>
          </div>

          {error ? <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
          {notice ? <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{notice}</p> : null}

          <Button type="button" className="h-11 rounded-xl font-semibold" disabled={isLoading || isSaving} onClick={validateAndOpenConfirm}>
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save global limits"}
          </Button>
        </CardContent>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        title="Update global AI limits?"
        description="This will overwrite every student's per-user mistake-reason limit and update active weekly periods immediately."
        confirmText={isSaving ? "Saving..." : "Update limits"}
        cancelText="Cancel"
        onConfirm={handleSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
