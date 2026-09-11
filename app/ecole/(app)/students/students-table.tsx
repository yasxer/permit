"use client";

import { ChevronRight, GraduationCap, Search } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { CandidateIdentity } from "@/components/shared/candidate-identity";
import { CategoryBadge } from "@/components/shared/category-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Pager } from "@/components/shared/pager";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useStudentFiles } from "@/hooks/use-enrollments";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EnrollmentStatus, StudentFileRow } from "@/types";

const PAGE_SIZE = 12;

/**
 * Les sept colonnes de la charte. Sous `lg`, le téléphone et le montant payé
 * sortent — ce sont les deux qu'on peut lire sur la fiche.
 */
const ROW_GRID =
  "grid grid-cols-[1.6fr_0.7fr_1.3fr_1fr_1.75rem] items-center gap-4 px-5 lg:grid-cols-[1.5fr_1.1fr_0.6fr_1.2fr_1fr_1fr_2.25rem]";

export function StudentsTable({
  schoolId,
  status = "active",
  emptyTitle,
  search: controlledSearch,
}: {
  schoolId: string;
  status?: EnrollmentStatus;
  emptyTitle: string;
  /** Fournie quand la recherche vit ailleurs — dans le bandeau, par exemple. */
  search?: string;
}) {
  const t = useTranslations("ecole.students");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [ownSearch, setOwnSearch] = useState("");
  const ownDebounced = useDebouncedValue(ownSearch);
  const needle = (controlledSearch ?? ownDebounced).trim().toLowerCase();

  const [page, setPage] = useState(1);
  const { data = [], isPending } = useStudentFiles(schoolId, status);

  const rows = useMemo(() => {
    if (!needle) return data;
    return data.filter((file) =>
      [file.candidate_name, file.candidate_name_fr, file.candidate_phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle)),
    );
  }, [data, needle]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // Filtering can shrink the list past the current page. Clamping during
  // render avoids a flash of an empty page and the re-render that follows.
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      {controlledSearch === undefined && (
        <div className="relative md:rounded-xl md:border md:border-border md:bg-card md:p-4 md:px-5">
          <div className="relative md:max-w-xs">
            <Search
              className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={ownSearch}
              onChange={(event) => {
                setOwnSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("searchPlaceholder")}
              aria-label={tc("search")}
              className="h-11 border-border ps-9 md:h-10 md:border-input"
            />
          </div>
        </div>
      )}

      {isPending ? (
        <ul className="flex flex-col gap-3 md:gap-0 md:overflow-hidden md:rounded-xl md:border md:border-border md:bg-card">
          {Array.from({ length: 6 }, (_, index) => (
            <li
              key={index}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 md:rounded-none md:border-0 md:border-t md:border-separator md:px-5 md:py-4 md:first:border-t-0"
            >
              <Skeleton className="hidden size-9 shrink-0 rounded-full md:block" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-1.5 w-full md:hidden" />
              </div>
              <Skeleton className="h-4 w-20" />
            </li>
          ))}
        </ul>
      ) : pageRows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={GraduationCap}
            title={needle ? tc("noResults") : emptyTitle}
            description={needle ? tc("noResultsHint") : undefined}
          />
        </div>
      ) : (
        <>
          {/* Sous md (2h) : des cartes séparées, sans avatar — le nom, la
              catégorie, la barre, et le restant en gros au coin de fin, parce
              que c'est la seule colonne qu'on vient vérifier. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {pageRows.map((file) => (
              <li key={file.id}>
                <StudentCard
                  file={file}
                  locale={locale}
                  remainingLabel={t("amountRemaining")}
                  paidInFull={t("paidInFull")}
                />
              </li>
            ))}
          </ul>

          {/* md et au-delà (2e) : la table. */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <div
              className={cn(
                ROW_GRID,
                "bg-surface-head py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
              )}
            >
              <span>{t("name")}</span>
              <span className="hidden lg:block">{t("phone")}</span>
              <span>{t("category")}</span>
              <span>{t("progress")}</span>
              <span className="hidden text-end lg:block">{t("amountPaid")}</span>
              <span className="text-end">{t("amountRemaining")}</span>
              <span />
            </div>

            <ul>
              {pageRows.map((file) => (
                <li key={file.id} className="border-t border-separator">
                  <StudentRow file={file} locale={locale} paidInFull={t("paidInFull")} />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {!isPending && rows.length > 0 && (
        <Pager
          page={currentPage}
          pageCount={pageCount}
          summary={tc("resultsCount", { count: rows.length })}
          onPage={setPage}
        />
      )}
    </>
  );
}

function StudentRow({
  file,
  locale,
  paidInFull,
}: {
  file: StudentFileRow;
  locale: string;
  paidInFull: string;
}) {
  const settled = file.amount_remaining === 0;

  return (
    <Link
      href={`/ecole/students/${file.id}`}
      className={cn(
        ROW_GRID,
        "py-3.5 transition-colors hover:bg-background focus-visible:bg-background focus-visible:outline-none",
      )}
    >
      <CandidateIdentity
        nameFr={file.candidate_name_fr}
        nameAr={file.candidate_name}
        photoUrl={file.candidate_photo_url}
      />

      <span
        dir="ltr"
        className="hidden truncate text-sm tabular-nums text-secondary-foreground lg:block"
      >
        {file.candidate_phone ?? "—"}
      </span>

      <span className="justify-self-start">
        <CategoryBadge code={file.category_code} />
      </span>

      <ProgressBar value={file.code_progress} />

      <span className="hidden text-end text-sm tabular-nums text-secondary-foreground lg:block">
        {formatCurrency(file.amount_paid, locale)}
      </span>

      <span
        className={cn(
          "text-end text-sm font-semibold tabular-nums",
          settled ? "text-success" : "text-foreground",
        )}
      >
        {settled ? paidInFull : formatCurrency(file.amount_remaining, locale)}
      </span>

      <ChevronRight className="size-4 justify-self-end text-muted-foreground/60 rtl-flip" aria-hidden />
    </Link>
  );
}

function StudentCard({
  file,
  locale,
  remainingLabel,
  paidInFull,
}: {
  file: StudentFileRow;
  locale: string;
  remainingLabel: string;
  paidInFull: string;
}) {
  const settled = file.amount_remaining === 0;
  const primary = file.candidate_name_fr ?? file.candidate_name ?? "—";
  const secondary =
    file.candidate_name_fr && file.candidate_name && file.candidate_name !== file.candidate_name_fr
      ? file.candidate_name
      : null;

  return (
    <Link
      href={`/ecole/students/${file.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors active:bg-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[0.9375rem] font-semibold">{primary}</span>
          <CategoryBadge code={file.category_code} size="sm" />
        </div>
        {secondary && (
          <span
            lang="ar"
            dir="rtl"
            className="max-w-full self-start truncate text-[0.8125rem] text-muted-foreground"
          >
            {secondary}
          </span>
        )}
        <ProgressBar value={file.code_progress} size="sm" />
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-[0.625rem] uppercase tracking-[0.06em] text-muted-foreground/80">
          {remainingLabel}
        </span>
        <span
          className={cn(
            "text-[0.9375rem] font-bold tabular-nums",
            settled ? "text-success" : "text-foreground",
          )}
        >
          {settled ? paidInFull : formatCurrency(file.amount_remaining, locale)}
        </span>
      </div>
    </Link>
  );
}
