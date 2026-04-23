"use client";

import {useEffect, useState} from "react";

import type {StudentTestRecord} from "@/src/services/student/types";

type PublicPaginatedResponse = {
  count?: unknown;
  next?: unknown;
  previous?: unknown;
  results?: unknown;
};

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

async function fetchAllPublicTests(module: "reading" | "listening") {
  const collected: StudentTestRecord[] = [];
  let nextPath = `/api/public/tests/${module}?page_size=100`;

  while (nextPath) {
    const response = await fetch(nextPath, {cache: "no-store"});
    if (!response.ok) {
      throw new Error(`Failed to fetch public ${module} tests.`);
    }

    const payload = (await response.json().catch(() => null)) as PublicPaginatedResponse | null;
    const results = asArray<StudentTestRecord>(payload?.results);
    collected.push(...results);

    const next = typeof payload?.next === "string" ? payload.next.trim() : "";
    if (!next) {
      nextPath = "";
      continue;
    }

    try {
      const url = new URL(next);
      nextPath = `/api/public/tests/${module}${url.search}`;
    } catch {
      nextPath = "";
    }
  }

  return collected;
}

type GuestDemoStats = {
  readingPublicCount: number;
  listeningPublicCount: number;
  totalPublicCount: number;
  totalAllCount: number;
};

let cachedPromise: Promise<GuestDemoStats> | null = null;

async function loadGuestDemoStats(): Promise<GuestDemoStats> {
  const [reading, listening] = await Promise.all([
    fetchAllPublicTests("reading"),
    fetchAllPublicTests("listening")
  ]);

  const readingPublicCount = reading.filter((item) => !item.active_for_registered_users).length;
  const listeningPublicCount = listening.filter((item) => !item.active_for_registered_users).length;

  return {
    readingPublicCount,
    listeningPublicCount,
    totalPublicCount: readingPublicCount + listeningPublicCount,
    totalAllCount: reading.length + listening.length
  };
}

export function useGuestDemoStats(enabled: boolean) {
  const [stats, setStats] = useState<GuestDemoStats | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    if (!cachedPromise) {
      cachedPromise = loadGuestDemoStats();
    }

    cachedPromise
      .then((value) => {
        if (!active) return;
        setStats(value);
      })
      .catch(() => {
        if (!active) return;
        // keep null: components will show their existing fallback UI
        setStats(null);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return stats;
}

