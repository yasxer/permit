"use client";

import { Building2, Check, Eye, X } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useApproveSchool,
  useRejectSchool,
  useSchools,
} from "@/hooks/use-schools";
import { formatDate } from "@/lib/format";
import type { SchoolStatus, SchoolWithOwner } from "@/types";

type Decision = { school: SchoolWithOwner; action: "approve" | "reject" };

const STATUSES: (SchoolStatus | "all")[] = [
  "all",
  "pending",
  "approved",
  "rejected",
];

export function SchoolsTable() {
  const t = useTranslations("admin.schools");
  const tc = useTranslations("common");
  const tStatus = useTranslations("status");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const [status, setStatus] = useState<SchoolStatus | "all">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [decision, setDecision] = useState<Decision | null>(null);

  const { data = [], isPending } = useSchools(status);
  const approve = useApproveSchool();
  const reject = useRejectSchool();

  const rows = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((school) =>
      [school.name, school.director_name, school.phone, school.owner?.email]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle)),
    );
  }, [data, debouncedSearch]);

  const columns: Column<SchoolWithOwner>[] = [
    {
      id: "name",
      header: t("name"),
      cell: (school) => (
        <span className="font-medium">{school.name ?? "—"}</span>
      ),
    },
    {
      id: "director",
      header: t("director"),
      hideBelow: "md",
      cell: (school) => school.director_name ?? "—",
    },
    {
      id: "phone",
      header: t("phone"),
      hideBelow: "sm",
      cell: (school) => (
        <span dir="ltr" className="tabular-nums">
          {school.phone ?? "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: tc("status"),
      cell: (school) => <StatusBadge status={school.status} />,
    },
    {
      id: "created",
      header: tc("createdAt"),
      hideBelow: "lg",
      cell: (school) => formatDate(school.created_at, locale),
    },
    {
      id: "actions",
      header: <span className="sr-only">{tc("actions")}</span>,
      headerClassName: "w-px",
      className: "w-px whitespace-nowrap",
      cell: (school) => (
        <div className="flex items-center justify-end gap-1">
          {school.status !== "approved" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDecision({ school, action: "approve" })}
              className="text-success hover:bg-success/10 hover:text-success"
            >
              <Check className="size-4" />
              <span className="sr-only sm:not-sr-only">{t("approve")}</span>
            </Button>
          )}
          {school.status !== "rejected" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDecision({ school, action: "reject" })}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-4" />
              <span className="sr-only sm:not-sr-only">{t("reject")}</span>
            </Button>
          )}
          <Button asChild size="icon" variant="ghost">
            <Link href={`/admin/auto-ecoles/${school.id}`} aria-label={tc("view")}>
              <Eye className="size-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  const pending = approve.isPending || reject.isPending;

  async function confirm() {
    if (!decision) return;
    const { school, action } = decision;
    try {
      if (action === "approve") {
        await approve.mutateAsync({ id: school.id });
        toast.success(t("approved"));
      } else {
        await reject.mutateAsync({ id: school.id });
        toast.success(t("rejected"));
      }
      setDecision(null);
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(school) => school.id}
        isLoading={isPending}
        caption={t("title")}
        search={{ value: search, onChange: setSearch }}
        filters={
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as SchoolStatus | "all")}
          >
            <SelectTrigger className="w-44" aria-label={tc("filter")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value === "all" ? tc("all") : tStatus(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        empty={{ icon: Building2, title: t("empty") }}
      />

      <ConfirmModal
        open={decision !== null}
        onOpenChange={(open) => !open && setDecision(null)}
        title={
          decision?.action === "reject" ? t("rejectTitle") : t("approveTitle")
        }
        message={
          decision
            ? decision.action === "reject"
              ? t("rejectMessage", { name: decision.school.name ?? "—" })
              : t("approveMessage", { name: decision.school.name ?? "—" })
            : undefined
        }
        confirmLabel={
          decision?.action === "reject" ? t("reject") : t("approve")
        }
        destructive={decision?.action === "reject"}
        pending={pending}
        onConfirm={confirm}
      />
    </>
  );
}
