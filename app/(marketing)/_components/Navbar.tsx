"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BookOpenCheck,
  ChevronDown,
  GraduationCap,
  Headphones,
  Lock,
  MessageSquareQuote,
  Mic,
  PenSquare,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Container } from "./Container";

const practiceItems = [
  {
    title: "Reading Test",
    description: "Practice full IELTS reading tests with real passages",
    icon: BookOpenCheck,
    href: "#reading",
    enabled: true,
  },
  {
    title: "Listening Test",
    description: "Answer real IELTS listening questions with audio",
    icon: Headphones,
    href: "#listening",
    enabled: true,
  },
  {
    title: "Writing Test",
    description: "Task-based writing simulator and band feedback",
    icon: PenSquare,
    enabled: false,
  },
  {
    title: "Speaking Test",
    description: "Interactive speaking prompts with evaluation",
    icon: Mic,
    enabled: false,
  },
] as const;

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDropdown = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const closeDropdownWithDelay = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, 140);
  };

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_4px_18px_-16px_rgba(15,23,42,0.35)] backdrop-blur">
      <Container className="flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-slate-900">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-xl",
              "bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-sm"
            )}
          >
            <GraduationCap className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="text-base tracking-tight">IELTS MASTER</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-2 lg:flex">
          <div
            className="relative"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdownWithDelay}
            ref={dropdownRef}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="menu"
              onClick={() => setIsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Practice Tests
              <ChevronDown
                className={cn("size-4 transition-transform duration-200", isOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>

            <div
              className={cn(
                "absolute top-[calc(100%+12px)] left-1/2 z-50 w-[620px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-xl transition-all duration-200",
                isOpen
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
              )}
              role="menu"
              aria-label="Practice Tests Menu"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdownWithDelay}
            >
              <div className="grid grid-cols-2 gap-3">
                {practiceItems.map((item) => {
                  const Icon = item.icon;

                  if (item.enabled) {
                    return (
                      <Link
                        key={item.title}
                        href={item.href ?? "#"}
                        role="menuitem"
                        className="group rounded-xl border border-blue-100 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                          <Icon className="size-[18px]" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={item.title}
                      aria-disabled="true"
                      className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100/80 p-4 opacity-60"
                    >
                      <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                        <Icon className="size-[18px]" aria-hidden="true" />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          <Lock className="size-3" aria-hidden="true" />
                          Coming soon
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Link
            href="#features"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Sparkles className="size-4 text-slate-500" aria-hidden="true" />
            Features
          </Link>
          <Link
            href="#reviews"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <MessageSquareQuote className="size-4 text-slate-500" aria-hidden="true" />
            Reviews
          </Link>
          <Link
            href="#pricing"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <WalletCards className="size-4 text-slate-500" aria-hidden="true" />
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            className="rounded-xl px-4 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="rounded-xl bg-indigo-600 px-5 hover:bg-indigo-700">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
