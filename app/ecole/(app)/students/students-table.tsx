"use client";

import { GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DataTable, type Column } from "@/components/shared/data-table";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useStudentFiles } from "@/hooks/use-enrollments";
import { formatCurrency } from "@/lib/format";
import type { EnrollmentStatus, StudentFileRow } from "@/types";

export function StudentsTable({
  schoolId,
  status = "active",
  emptyTitle,
}: {
  schoolId: string;
  status?: EnrollmentStatus;
  emptyTitle: string;
}) {
  const t = useTranslations("ecole.students");
  const locale = useLocale();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data = [], isPending } = useStudentFiles(schoolId, status);

  const rows = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((file) =>
      [file.candidate_name, file.candidate_phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle)),
    );
  }, [data, debouncedSearch]);

  const columns: Column<StudentFileRow>[] = [
    {
      id: "name",
      header: t("name"),
      cell: (file) => (
        <span className="font-medium">{file.candidate_name ?? "—"}</span>
      ),
    },
    {
      id: "phone",
      header: t("phone"),
      hideBelow: "md",
      cell: (file) => (
        <span dir="ltr" className="tabular-nums text-muted-foreground">
          {file.candidate_phone ?? "—"}
        </span>
      ),
    },
    {
      id: "category",
      header: t("category"),
      cell: (file) => (
        <Badge variant="secondary" className="font-mono font-semibold">
          {file.category_code}
        </Badge>
      ),
    },
    {
      id: "progress",
      header: t("progress"),
      className: "min-w-40",
      cell: (file) => (
        <ProgressBar value={file.code_progress} label={t("codeProgress")} />
      ),
    },
    {
      id: "paid",
      header: t("amountPaid"),
      hideBelow: "sm",
      className: "tabular-nums",
      cell: (file) => formatCurrency(file.amount_paid, locale),
    },
    {
      id: "remaining",
      header: t("amountRemaining"),
      className: "tabular-nums",
      cell: (file) =>
        file.amount_remaining === 0 ? (
          <span className="text-sm font-medium text-success">
            {t("paidInFull")}
          </span>
        ) : (
          <span className="font-medium">
            {formatCurrency(file.amount_remaining, locale)}
          </span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(file) => file.id}
      isLoading={isPending}
      caption={t("title")}
      search={{ value: search, onChange: setSearch }}
      onRowClick={(file) => router.push(`/ecole/students/${file.id}`)}
      empty={{ icon: GraduationCap, title: emptyTitle }}
    />
  );
}
