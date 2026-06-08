"use client";

import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from "react";

import {cn} from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  variant?: "up" | "left" | "right" | "scale";
  delayMs?: number;
};

export function ScrollReveal({
  children,
  className,
  variant = "up",
  delayMs = 0
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const style = {"--landing-reveal-delay": `${delayMs}ms`} as CSSProperties;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("landing-reveal-section", isVisible && "is-visible", className)}
      data-reveal-variant={variant}
      style={style}
    >
      {children}
    </div>
  );
}
