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
 * sortent — ce sont les deux qu'on peut lire sur la fiche ; sous `md`, la
 * table cède la place à une liste de cartes, parce qu'une ligne de sept
 * colonnes sur 390 px n'est plus une ligne.
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
  /** Fournie quand la recherche vit dans le bandeau nuit de la page. */
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
        <div className="rounded-xl border border-border bg-card p-4 sm:px-5">
          <div className="relative sm:max-w-xs">
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
              className="ps-9"
            />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* En-tête de table — micro-libellés, réservé aux vraies colonnes. */}
        <div
          className={cn(
            ROW_GRID,
            "hidden bg-surface-head py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:grid",
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

        {isPending ? (
          <ul>
            {Array.from({ length: 6 }, (_, index) => (
              <li
                key={index}
                className="flex items-center gap-3 border-t border-separator px-5 py-4 first:border-t-0 md:first:border-t"
              >
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="ms-auto h-4 w-24" />
              </li>
            ))}
          </ul>
        ) : pageRows.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={needle ? tc("noResults") : emptyTitle}
            description={needle ? tc("noResultsHint") : undefined}
          />
        ) : (
          <ul>
            {pageRows.map((file) => (
              <li key={file.id} className="border-t border-separator first:border-t-0 md:first:border-t">
                <StudentRow file={file} locale={locale} paidInFull={t("paidInFull")} />
              </li>
            ))}
          </ul>
        )}
      </div>

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
      className="block transition-colors hover:bg-background focus-visible:bg-background focus-visible:outline-none"
    >
      {/* md et au-delà : la ligne de table. */}
      <div className={cn(ROW_GRID, "hidden py-3.5 md:grid")}>
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
      </div>

      {/* Sous md : la carte de la maquette mobile — le restant en gros au coin
          de fin, parce que c'est la seule colonne qu'on vient vérifier. */}
      <div className="flex flex-col gap-3 p-4 md:hidden">
        <div className="flex items-start justify-between gap-3">
          <CandidateIdentity
            nameFr={file.candidate_name_fr}
            nameAr={file.candidate_name}
            photoUrl={file.candidate_photo_url}
          />
          <CategoryBadge code={file.category_code} />
        </div>

        <div className="flex items-center gap-4">
          <ProgressBar value={file.code_progress} className="flex-1" />
          <span
            className={cn(
              "shrink-0 font-heading text-[0.9375rem] font-bold tabular-nums",
              settled ? "text-success" : "text-foreground",
            )}
          >
            {settled ? paidInFull : formatCurrency(file.amount_remaining, locale)}
          </span>
        </div>
      </div>
    </Link>
  );
}
