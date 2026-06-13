"use client";

import {ArrowUpRight, Play, X, Youtube} from "lucide-react";
import {useEffect, useMemo, useState} from "react";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {studentMarathonService} from "@/src/services/student/marathon.service";
import type {StudentMarathonContentLink} from "@/src/services/student/marathon.types";

type MarathonResultVideoCardProps = {
  marathonId: string;
  dayNumber: number;
  contentId: string;
  contentType: "reading" | "listening";
};

function getYoutubeVideoId(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (host !== "youtube.com" && host !== "m.youtube.com") return null;
    if (url.pathname === "/watch") return url.searchParams.get("v");

    const [prefix, videoId] = url.pathname.split("/").filter(Boolean);
    if (prefix === "embed" || prefix === "shorts" || prefix === "live") {
      return videoId ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

export function MarathonResultVideoCard({
  marathonId,
  dayNumber,
  contentId,
  contentType,
}: MarathonResultVideoCardProps) {
  const [link, setLink] = useState<StudentMarathonContentLink | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const loadVideo = async () => {
      try {
        const day = await studentMarathonService.getDay(marathonId, dayNumber);
        if (!active) return;

        const items = contentType === "reading" ? day.reading_passages : day.listening_parts;
        const assignedLink = items.find((item) => item.id === contentId)?.external_link ?? null;
        setLink(assignedLink);
      } catch {
        if (active) setLink(null);
      }
    };

    void loadVideo();
    return () => {
      active = false;
    };
  }, [contentId, contentType, dayNumber, marathonId]);

  const videoId = useMemo(() => getYoutubeVideoId(link?.url ?? ""), [link?.url]);
  const embedUrl = videoId && /^[A-Za-z0-9_-]{6,}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1`
    : null;
  const thumbnailUrl = videoId && /^[A-Za-z0-9_-]{6,}$/.test(videoId)
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : null;

  useEffect(() => {
    if (!playerOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPlayerOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [playerOpen]);

  if (!link || !embedUrl) return null;

  return (
    <>
      <Card className="max-w-3xl gap-0 overflow-hidden rounded-2xl border-slate-200/85 bg-white/95 p-0 shadow-sm shadow-slate-200/40 dark:border-border/75 dark:bg-card/75 dark:shadow-none">
        <div className="flex flex-col sm:flex-row">
          <button
            type="button"
            onClick={() => setPlayerOpen(true)}
            className="group relative aspect-video w-full shrink-0 overflow-hidden bg-slate-900 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset sm:aspect-auto sm:w-56"
            aria-label={`Play ${link.title || "marathon explanation video"}`}
          >
            {thumbnailUrl ? (
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
                style={{backgroundImage: `url("${thumbnailUrl}")`}}
              />
            ) : null}
            <span aria-hidden="true" className="absolute inset-0 bg-slate-950/25 transition-colors group-hover:bg-slate-950/15" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full border border-white/70 bg-white/95 text-blue-700 shadow-lg transition-transform group-hover:scale-105">
                <Play className="ml-0.5 size-5 fill-current" />
              </span>
            </span>
          </button>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-600 dark:text-red-300">
                <Youtube className="size-3.5" aria-hidden="true" />
                Explanation video
                <span className="text-slate-400 dark:text-slate-500">/</span>
                <span className="text-slate-500 dark:text-slate-400">Day {dayNumber}</span>
              </div>
              <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
                {link.title || "Review the explanation for this task"}
              </h2>
              <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-muted-foreground">
                Watch the explanation before continuing your marathon.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setPlayerOpen(true)}
                className="h-8 rounded-lg px-3"
              >
                <Play className="size-3.5 fill-current" />
                Watch explanation
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-muted-foreground">
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  YouTube
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {playerOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={link.title || "Marathon explanation video"}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPlayerOpen(false);
          }}
        >
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-300">Explanation video</p>
                <h2 className="truncate text-sm font-semibold text-white sm:text-base">
                  {link.title || "Marathon lesson"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPlayerOpen(false)}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                aria-label="Close video"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="aspect-video">
              <iframe
                src={embedUrl}
                title={link.title || "Marathon explanation video"}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
