"use client";

import {useEffect, useMemo, useRef, useState} from "react";

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

function formatNumber(value: number, decimals: number) {
  if (!Number.isFinite(value)) return decimals > 0 ? (0).toFixed(decimals) : "0";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function AnimatedNumber({
  value,
  decimals = 0,
  durationMs = 650,
  prefix = "",
  suffix = "",
  className
}: AnimatedNumberProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const [displayValue, setDisplayValue] = useState(safeValue);
  const previousValueRef = useRef(safeValue);

  useEffect(() => {
    if (typeof window === "undefined") {
      setDisplayValue(safeValue);
      previousValueRef.current = safeValue;
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || durationMs <= 0) {
      setDisplayValue(safeValue);
      previousValueRef.current = safeValue;
      return;
    }

    const from = previousValueRef.current;
    const to = safeValue;
    if (from === to) return;

    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(from + (to - from) * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      previousValueRef.current = to;
      setDisplayValue(to);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [durationMs, safeValue]);

  const formatted = useMemo(() => formatNumber(displayValue, decimals), [decimals, displayValue]);

  return <span className={className}>{prefix}{formatted}{suffix}</span>;
}
