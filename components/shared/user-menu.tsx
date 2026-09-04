"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole } from "@/types/database";

/** Two letters from the display name, falling back to the email. */
function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export function UserMenu({
  name,
  email,
  photoUrl,
  role,
}: {
  name: string | null;
  email: string;
  photoUrl: string | null;
  role: UserRole;
}) {
  const t = useTranslations("nav");
  const tRoles = useTranslations("roles");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={name ?? email}
        >
          <Avatar className="size-8">
            {photoUrl && <AvatarImage src={photoUrl} alt="" />}
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {initials(name, email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-3 py-2.5">
          <Avatar className="size-9">
            {photoUrl && <AvatarImage src={photoUrl} alt="" />}
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {initials(name, email)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {name ?? tRoles(role)}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground" dir="ltr">
              {email}
            </span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled className="gap-2">
          <UserIcon className="size-4" />
          {tRoles(role)}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* A form POST, so signing out cannot be triggered by a stray GET. */}
        <form action="/api/auth/signout" method="post">
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full gap-2">
              <LogOut className="size-4 rtl-flip" />
              {t("logout")}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
