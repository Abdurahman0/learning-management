"use client";

import Link from "next/link";
import {useState} from "react";
import {ChevronDown, Copy, LayoutDashboard, LogOut, UserRound} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {getTeacherProfile} from "@/data/teacher/selectors";
import {cn} from "@/lib/utils";

type TeacherProfileMenuProps = {
  compact?: boolean;
  visibility?: "desktop" | "mobile" | "all";
  className?: string;
};

export function TeacherProfileMenu({compact = false, visibility = "desktop", className}: TeacherProfileMenuProps) {
  const t = useTranslations("teacherDashboard");
  const locale = useLocale();
  const router = useRouter();
  const profile = getTeacherProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [copied, setCopied] = useState(false);

  const visibilityClassName =
    visibility === "mobile"
      ? "flex md:hidden"
      : visibility === "all"
        ? "flex"
        : "hidden md:flex";

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const handleSignOut = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {method: "POST"});
    } finally {
      router.replace(`/${locale}/login`);
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-auto items-center rounded-xl p-1 hover:bg-muted/60",
            visibilityClassName,
            compact ? "gap-0.5" : "gap-2.5 pl-2 pr-1",
            className
          )}
          aria-label={t("topbar.openProfileMenu")}
        >
          {compact ? null : (
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{profile.name}</p>
              <p className="text-xs text-muted-foreground">
                {t("teacherRoleLabel")} - {profile.title}
              </p>
            </div>
          )}
          <Avatar className="ring-2 ring-border/70" size="lg">
            <AvatarFallback className="bg-primary/18 text-primary">{profile.avatarFallback}</AvatarFallback>
          </Avatar>
          {compact ? null : <ChevronDown className="size-4 text-muted-foreground" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">{profile.name}</p>
          <p className="text-xs font-normal text-muted-foreground">{profile.title}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/teacher`}>
            <LayoutDashboard className="size-4" />
            {t("topbar.goDashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/teacher/students`}>
            <UserRound className="size-4" />
            {t("sidebar.items.myStudents")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleCopyEmail();
          }}
        >
          <Copy className="size-4" />
          {t("topbar.copyEmail")}
          <DropdownMenuShortcut>{copied ? t("topbar.copied") : "Ctrl+C"}</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isLoggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          className="text-rose-600 focus:text-rose-600"
        >
          <LogOut className="size-4" />
          {isLoggingOut ? t("topbar.signingOut") : t("topbar.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
