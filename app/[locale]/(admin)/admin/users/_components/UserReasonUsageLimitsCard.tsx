"use client";

import {useEffect, useMemo, useState} from "react";
import {BrainCircuit, Save} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {adminUsersService, type AdminReasonUsageLimits} from "@/src/services/admin/users.service";

type UserReasonUsageLimitsCardProps = {
  userId: string;
};

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

export function UserReasonUsageLimitsCard({userId}: UserReasonUsageLimitsCardProps) {
  const [limits, setLimits] = useState<AdminReasonUsageLimits | null>(null);
  const [readingLimit, setReadingLimit] = useState("");
  const [listeningLimit, setListeningLimit] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updatedAt = useMemo(() => formatUpdatedAt(limits?.updatedAt ?? null), [limits?.updatedAt]);

  useEffect(() => {
    let active = true;

    const loadLimits = async () => {
      setIsLoading(true);
      setError(null);
      setNotice(null);
      try {
        const response = await adminUsersService.getReasonUsageLimits(userId);
        if (!active) return;
        setLimits(response);
        setReadingLimit(String(response.readingLimit));
        setListeningLimit(String(response.listeningLimit));
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Could not load AI analysis limits.");
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
  }, [userId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleSave = async () => {
    const nextReadingLimit = toLimit(readingLimit);
    const nextListeningLimit = toLimit(listeningLimit);

    if (nextReadingLimit === null || nextListeningLimit === null) {
      setError("Limits must be whole numbers from 0 and above.");
      setNotice(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await adminUsersService.updateReasonUsageLimits(userId, {
        readingLimit: nextReadingLimit,
        listeningLimit: nextListeningLimit
      });
      setLimits(response);
      setReadingLimit(String(response.readingLimit));
      setListeningLimit(String(response.listeningLimit));
      setNotice("Weekly AI analysis limits saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save AI analysis limits.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-card/70 to-cyan-500/10 py-0">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pt-5 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl border border-blue-500/25 bg-blue-500/15 text-blue-400">
              <BrainCircuit className="size-4" />
            </span>
            Weekly mistake-reason limit
          </CardTitle>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Controls how many AI reason/solution analyses this student can generate per week. Set 0 to disable.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`reading-limit-${userId}`} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Reading
            </Label>
            <Input
              id={`reading-limit-${userId}`}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={readingLimit}
              disabled={isLoading || isSaving}
              onChange={(event) => setReadingLimit(event.target.value)}
              className="h-11 rounded-xl border-border/70 bg-background/70"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`listening-limit-${userId}`} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Listening
            </Label>
            <Input
              id={`listening-limit-${userId}`}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={listeningLimit}
              disabled={isLoading || isSaving}
              onChange={(event) => setListeningLimit(event.target.value)}
              className="h-11 rounded-xl border-border/70 bg-background/70"
            />
          </div>
        </div>

        {updatedAt ? <p className="text-xs text-muted-foreground">Last updated: {updatedAt}</p> : null}
        {error ? <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p> : null}
        {notice ? <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{notice}</p> : null}

        <Button
          type="button"
          className="h-10 w-full rounded-xl font-semibold"
          disabled={isLoading || isSaving}
          onClick={handleSave}
        >
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save limits"}
        </Button>
      </CardContent>
    </Card>
  );
}
