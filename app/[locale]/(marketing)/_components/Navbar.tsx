"use client";

import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import ReactCountryFlag from "react-country-flag";
import {
  BookOpenCheck,
  ChevronDown,
  GraduationCap,
  Headphones,
  Lock,
  Menu,
  MessageSquareQuote,
  Mic,
  PenSquare,
  Sparkles,
  WalletCards,
  X
} from "lucide-react";

import {Button} from "@/components/ui/button";
import {ThemeToggle} from "@/components/theme-toggle";
import {cn} from "@/lib/utils";

import {Container} from "./Container";

type PracticeItem = {
  key: "reading" | "listening" | "writing" | "speaking";
  descriptionKey: "readingDescription" | "listeningDescription" | "writingDescription" | "speakingDescription";
  icon: typeof BookOpenCheck;
  href?: string;
  enabled: boolean;
};

const practiceItems: PracticeItem[] = [
  {
    key: "reading",
    descriptionKey: "readingDescription",
    icon: BookOpenCheck,
    href: "/reading",
    enabled: true
  },
  {
    key: "listening",
    descriptionKey: "listeningDescription",
    icon: Headphones,
    href: "/listening",
    enabled: true
  },
  {
    key: "writing",
    descriptionKey: "writingDescription",
    icon: PenSquare,
    enabled: false
  },
  {
    key: "speaking",
    descriptionKey: "speakingDescription",
    icon: Mic,
    enabled: false
  }
];

export function Navbar() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const homeHref = `/${locale}`;
  const localeHref = (path: string) => `${homeHref}${path}`;

  const switchLocale = (nextLocale: "uz" | "en") => {
    if (nextLocale === locale) {
      return;
    }

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const withoutLocale = pathname.replace(/^\/(uz|en)(?=\/|$)/, "") || "/";
    const localizedPath = `/${nextLocale}${withoutLocale === "/" ? "" : withoutLocale}`;

    router.replace(`${localizedPath}${hash}`);
  };

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
      if (!languageRef.current?.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
      if (!mobileMenuRef.current?.contains(event.target as Node)) {
        setIsMobileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsLanguageOpen(false);
        setIsMobileOpen(false);
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
    <header
      className="sticky top-0 z-50 border-b border-border bg-background/80 shadow-sm backdrop-blur"
      ref={mobileMenuRef}
    >
      <Container className="flex h-20 items-center justify-between gap-4">
        <Link href={homeHref} className="flex items-center gap-2.5 font-semibold text-foreground">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-xl",
              "bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-sm"
            )}
          >
            <GraduationCap className="size-4.5" aria-hidden="true" />
          </span>
          <span className="text-base tracking-tight">{t("nav.brand")}</span>
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
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {t("nav.practiceTests")}
              <ChevronDown
                className={cn("size-4 transition-transform duration-200", isOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>

            <div
              className={cn(
                "absolute top-[calc(100%+12px)] left-1/2 z-50 w-155 -translate-x-1/2 rounded-2xl border border-border bg-card p-3 shadow-lg ring-1 ring-border/70 backdrop-blur transition-all duration-200",
                isOpen
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
              )}
              role="menu"
              aria-label={t("nav.practiceMenu")}
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdownWithDelay}
            >
              <div className="grid grid-cols-2 gap-3">
                {practiceItems.map((item) => {
                  const Icon = item.icon;

                  if (item.enabled) {
                    return (
                      <Link
                        key={item.key}
                        href={localeHref(item.href ?? "")}
                        role="menuitem"
                        className="group rounded-xl border border-border bg-background p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                          <Icon className="size-4.5" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{t(`nav.${item.key}`)}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(`nav.${item.descriptionKey}`)}</p>
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={item.key}
                      aria-disabled="true"
                      className="cursor-not-allowed rounded-xl border border-border bg-muted/80 p-4 opacity-75"
                    >
                      <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4.5" aria-hidden="true" />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-muted-foreground">{t(`nav.${item.key}`)}</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <Lock className="size-3" aria-hidden="true" />
                          {t("nav.comingSoon")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(`nav.${item.descriptionKey}`)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Link
            href={`${homeHref}#features`}
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
            {t("nav.features")}
          </Link>
          <Link
            href={`${homeHref}#reviews`}
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <MessageSquareQuote className="size-4 text-muted-foreground" aria-hidden="true" />
            {t("nav.reviews")}
          </Link>
          <Link
            href={`${homeHref}#pricing`}
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <WalletCards className="size-4 text-muted-foreground" aria-hidden="true" />
            {t("nav.pricing")}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={languageRef}>
            <button
              type="button"
              onClick={() => setIsLanguageOpen((prev) => !prev)}
              aria-expanded={isLanguageOpen}
              aria-haspopup="menu"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70"
            >
              <ReactCountryFlag
                countryCode={locale === "uz" ? "UZ" : "GB"}
                svg
                style={{width: "1em", height: "1em"}}
                aria-hidden="true"
              />
              {t(`nav.language.${locale}`)}
              <ChevronDown
                className={cn("size-3.5 transition-transform", isLanguageOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>

            <div
              className={cn(
                "absolute flex gap-0.5 flex-col right-0 top-[calc(100%+8px)] z-50 w-28 rounded-lg border border-border bg-card p-1.5 shadow-md ring-1 ring-border/60 transition-all duration-150",
                isLanguageOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              )}
              role="menu"
            >
              {(["uz", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    switchLocale(lang);
                    setIsLanguageOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center cursor-pointer gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors",
                    locale === lang
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <ReactCountryFlag
                    countryCode={lang === "uz" ? "UZ" : "GB"}
                    svg
                    style={{width: "1em", height: "1em"}}
                    aria-hidden="true"
                  />
                  {t(`nav.language.${lang}`)}
                </button>
              ))}
            </div>
          </div>
          <ThemeToggle />
          <Button asChild className="hidden rounded-xl bg-linear-to-br from-blue-700 to-indigo-400 px-5 sm:inline-flex">
            <Link href={localeHref("/auth")}>{t("nav.register")}</Link>
          </Button>
          <button
            type="button"
            aria-label={t("nav.toggleMobile")}
            aria-expanded={isMobileOpen}
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
          >
            {isMobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </Container>

      <div
        className={cn(
          "border-t border-border bg-background/95 px-4 py-4 shadow-sm backdrop-blur lg:hidden",
          isMobileOpen ? "block" : "hidden"
        )}
      >
        <nav aria-label="Mobile primary" className="mx-auto flex max-w-350 flex-col gap-2">
          <p className="px-2 pt-1 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t("nav.practiceTests")}
          </p>
          <Link
            href={localeHref("/reading")}
            onClick={() => setIsMobileOpen(false)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60"
          >
            {t("nav.reading")}
          </Link>
          <Link
            href={localeHref("/listening")}
            onClick={() => setIsMobileOpen(false)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60"
          >
            {t("nav.listening")}
          </Link>
          <p className="cursor-not-allowed rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground">
            {t("nav.writing")} ({t("nav.comingSoon")})
          </p>
          <p className="cursor-not-allowed rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground">
            {t("nav.speaking")} ({t("nav.comingSoon")})
          </p>

          <div className="my-2 h-px bg-border" />

          <Link
            href={`${homeHref}#features`}
            onClick={() => setIsMobileOpen(false)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60"
          >
            {t("nav.features")}
          </Link>
          <Link
            href={`${homeHref}#reviews`}
            onClick={() => setIsMobileOpen(false)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60"
          >
            {t("nav.reviews")}
          </Link>
          <Link
            href={`${homeHref}#pricing`}
            onClick={() => setIsMobileOpen(false)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60"
          >
            {t("nav.pricing")}
          </Link>

          <Button asChild className="mt-2 rounded-xl bg-linear-to-br from-blue-700 to-indigo-400 sm:hidden">
            <Link href={localeHref("/auth")} onClick={() => setIsMobileOpen(false)}>
              {t("nav.register")}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
