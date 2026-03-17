"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";

export type TestContrastMode = "black-on-white" | "white-on-black" | "yellow-on-black";
export type TestTextSize = "small" | "medium" | "large";

export type TestAppearanceState = {
  contrast: TestContrastMode;
  textSize: TestTextSize;
};

const DEFAULT_APPEARANCE: TestAppearanceState = {
  contrast: "black-on-white",
  textSize: "medium",
};

function getStorageKey(scope: string) {
  return `ielts-master:test-appearance:${scope}`;
}

function getDefaultContrastMode(): TestContrastMode {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "white-on-black";
  }
  return "black-on-white";
}

function readInitialAppearance(scope: string): TestAppearanceState {
  if (typeof window === "undefined") {
    return DEFAULT_APPEARANCE;
  }

  const defaultContrast = getDefaultContrastMode();

  try {
    const raw = window.localStorage.getItem(getStorageKey(scope));
    if (!raw) {
      return {
        contrast: defaultContrast,
        textSize: "medium",
      };
    }
    const parsed = JSON.parse(raw) as Partial<TestAppearanceState>;
    const contrast =
      parsed.contrast === "black-on-white" ||
      parsed.contrast === "white-on-black" ||
      parsed.contrast === "yellow-on-black"
        ? parsed.contrast
        : parsed.contrast === "high"
          ? "white-on-black"
          : defaultContrast;
    const textSize =
      parsed.textSize === "small" || parsed.textSize === "large"
        ? parsed.textSize
        : "medium";
    return { contrast, textSize };
  } catch {
    return {
      contrast: defaultContrast,
      textSize: "medium",
    };
  }
}

export function useTestAppearance(scope = "default") {
  const [appearance, setAppearance] = useState<TestAppearanceState>(DEFAULT_APPEARANCE);
  const [initializedScope, setInitializedScope] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return Boolean(document.fullscreenElement);
  });
  const { setTheme } = useTheme();

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

  useEffect(() => {
    if (initializedScope !== scope) {
      return;
    }

    const preferredTheme: "light" | "dark" =
      appearance.contrast === "black-on-white" ? "light" : "dark";
    setTheme(preferredTheme);
  }, [appearance.contrast, initializedScope, scope, setTheme]);

  const setContrast = useCallback((contrast: TestContrastMode) => {
    const preferredTheme: "light" | "dark" =
      contrast === "black-on-white" ? "light" : "dark";
    setTheme(preferredTheme);
    setAppearance((prev) => (prev.contrast === contrast ? prev : { ...prev, contrast }));
  }, [setTheme]);

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
