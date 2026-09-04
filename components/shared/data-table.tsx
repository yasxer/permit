"use client";

import { ChevronLeft, ChevronRight, Search, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Applied to the body cell. */
  className?: string;
  headerClassName?: string;
  /** Drop the column on narrow screens rather than letting the table overflow. */
  hideBelow?: "sm" | "md" | "lg";
};

const HIDE_CLASS = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

export const DEFAULT_PAGE_SIZE = 15;

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  search,
  filters,
  onRowClick,
  pageSize = DEFAULT_PAGE_SIZE,
  empty,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Select inputs and the like, rendered beside the search box. */
  filters?: ReactNode;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  empty?: { icon?: LucideIcon; title: ReactNode; description?: ReactNode };
  caption?: string;
}) {
  const t = useTranslations("common");
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  // Filtering can shrink the list past the current page. Clamping during
  // render (rather than correcting in an effect) avoids a flash of an empty
  // page and the cascading re-render that comes with it.
  const currentPage = Math.min(page, pageCount);

  const pageRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize],
  );

  const hasToolbar = Boolean(search || filters);

  return (
    <div className="space-y-4">
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-2">
          {search && (
            <div className="relative min-w-56 flex-1 sm:max-w-xs">
              <Search
                className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search.value}
                onChange={(event) => {
                  search.onChange(event.target.value);
                  setPage(1);
                }}
                placeholder={search.placeholder ?? t("searchPlaceholder")}
                aria-label={t("search")}
                className="ps-9"
              />
            </div>
          )}
          {filters}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          {caption && <caption className="sr-only">{caption}</caption>}
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.hideBelow && HIDE_CLASS[column.hideBelow],
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(column.hideBelow && HIDE_CLASS[column.hideBelow])}
                    >
                      <Skeleton className="h-4 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState
                    icon={empty?.icon}
                    title={empty?.title ?? t("noResults")}
                    description={empty?.description ?? t("noResultsHint")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  className={cn(
                    onRowClick &&
                      "cursor-pointer focus-visible:bg-muted focus-visible:outline-none",
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        column.hideBelow && HIDE_CLASS[column.hideBelow],
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {t("resultsCount", { count: rows.length })}
          </p>

          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label={t("previous")}
              >
                <ChevronLeft className="size-4 rtl-flip" />
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground">
                {t("page", { page: currentPage, total: pageCount })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                disabled={currentPage === pageCount}
                aria-label={t("next")}
              >
                <ChevronRight className="size-4 rtl-flip" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
