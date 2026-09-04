"use client";

import { BadgeCheck, Minus, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useUsers } from "@/hooks/use-users";
import { formatDate } from "@/lib/format";
import type { ProfileRow, UserRole } from "@/types";

const ROLES: (UserRole | "all")[] = [
  "all",
  "super_admin",
  "auto_ecole",
  "candidat",
];

export function UsersTable() {
  const t = useTranslations("admin.users");
  const tc = useTranslations("common");
  const tRoles = useTranslations("roles");
  const locale = useLocale();

  const [role, setRole] = useState<UserRole | "all">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data = [], isPending } = useUsers(role);

  const rows = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((profile) =>
      [profile.full_name, profile.email, profile.phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle)),
    );
  }, [data, debouncedSearch]);

  const columns: Column<ProfileRow>[] = [
    {
      id: "name",
      header: t("name"),
      cell: (profile) => (
        <span className="font-medium">{profile.full_name ?? "—"}</span>
      ),
    },
    {
      id: "email",
      header: t("email"),
      cell: (profile) => (
        <span dir="ltr" className="text-muted-foreground">
          {profile.email ?? "—"}
        </span>
      ),
    },
    {
      id: "role",
      header: t("role"),
      cell: (profile) => (
        <Badge variant="secondary" className="font-medium">
          {tRoles(profile.role)}
        </Badge>
      ),
    },
    {
      id: "license",
      header: t("hasLicense"),
      hideBelow: "md",
      cell: (profile) =>
        profile.has_license ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-success">
            <BadgeCheck className="size-4" aria-hidden />
            {tc("yes")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Minus className="size-4" aria-hidden />
            {tc("no")}
          </span>
        ),
    },
    {
      id: "created",
      header: tc("createdAt"),
      hideBelow: "lg",
      cell: (profile) => formatDate(profile.created_at, locale),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(profile) => profile.id}
      isLoading={isPending}
      caption={t("title")}
      search={{ value: search, onChange: setSearch }}
      filters={
        <Select
          value={role}
          onValueChange={(value) => setRole(value as UserRole | "all")}
        >
          <SelectTrigger className="w-48" aria-label={tc("filter")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((value) => (
              <SelectItem key={value} value={value}>
                {value === "all" ? tc("all") : tRoles(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      empty={{ icon: Users, title: t("empty") }}
    />
  );
}
