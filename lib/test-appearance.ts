"use client";

import { useCallback, useEffect, useState } from "react";

export type TestContrastMode = "default" | "high";
export type TestTextSize = "small" | "medium" | "large";

export type TestAppearanceState = {
  contrast: TestContrastMode;
  textSize: TestTextSize;
};

const DEFAULT_APPEARANCE: TestAppearanceState = {
  contrast: "default",
  textSize: "medium",
};

function getStorageKey(scope: string) {
  return `ielts-master:test-appearance:${scope}`;
}

function readInitialAppearance(scope: string): TestAppearanceState {
  if (typeof window === "undefined") {
    return DEFAULT_APPEARANCE;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(scope));
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<TestAppearanceState>;
    const contrast = parsed.contrast === "high" ? "high" : "default";
    const textSize =
      parsed.textSize === "small" || parsed.textSize === "large"
        ? parsed.textSize
        : "medium";
    return { contrast, textSize };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function useTestAppearance(scope = "default") {
  const [appearance, setAppearance] = useState<TestAppearanceState>(DEFAULT_APPEARANCE);
  const [initializedScope, setInitializedScope] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return Boolean(document.fullscreenElement);
  });

  useEffect(() => {
    setAppearance(readInitialAppearance(scope));
    setInitializedScope(scope);
  }, [scope]);

  useEffect(() => {
    if (initializedScope !== scope) {
      return;
    }

    try {
      window.localStorage.setItem(getStorageKey(scope), JSON.stringify(appearance));
    } catch {
      // Ignore storage failures.
    }
  }, [appearance, initializedScope, scope]);

  useEffect(() => {
    const onFullscreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const setContrast = useCallback((contrast: TestContrastMode) => {
    setAppearance((prev) => ({ ...prev, contrast }));
  }, []);

  const setTextSize = useCallback((textSize: TestTextSize) => {
    setAppearance((prev) => ({ ...prev, textSize }));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore browser fullscreen failures.
    }
  }, []);

  return {
    appearance,
    setContrast,
    setTextSize,
    isFullscreen,
    toggleFullscreen,
  };
}
