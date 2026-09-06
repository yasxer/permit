"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/** 1 … 4 5 6 … 11 — jamais plus de sept cases, quel que soit le nombre de pages. */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const around = [page - 1, page, page + 1].filter((n) => n > 1 && n < pageCount);
  const items: (number | "gap")[] = [1];
  if ((around[0] ?? pageCount) > 2) items.push("gap");
  items.push(...around);
  if ((around[around.length - 1] ?? 1) < pageCount - 1) items.push("gap");
  items.push(pageCount);
  return items;
}

/**
 * Le pied de liste de la charte : ce qu'on regarde à gauche, où l'on est à
 * droite. La page courante est une pastille bleu nuit — le seul aplat plein de
 * la rangée, donc le seul endroit où l'œil se pose.
 */
export function Pager({
  page,
  pageCount,
  summary,
  onPage,
  className,
}: {
  page: number;
  pageCount: number;
  /** « 1 – 8 sur 87 candidats ». */
  summary?: string;
  onPage: (page: number) => void;
  className?: string;
}) {
  const t = useTranslations("common");
  if (pageCount <= 1 && !summary) return null;

  const control =
    "grid h-9 min-w-9 place-items-center rounded-[10px] border border-input px-2 text-[0.8125rem] tabular-nums transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35";

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
      {summary && <p className="text-[0.8125rem] tabular-nums text-muted-foreground">{summary}</p>}

      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={control}
            aria-label={t("previous")}
            disabled={page === 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft className="size-4 rtl-flip" aria-hidden />
          </button>

          {pageWindow(page, pageCount).map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} className="px-1 text-[0.8125rem] text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPage(item)}
                className={cn(
                  control,
                  item === page &&
                    "border-transparent bg-primary font-semibold text-primary-foreground hover:bg-primary",
                )}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            className={control}
            aria-label={t("next")}
            disabled={page === pageCount}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight className="size-4 rtl-flip" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
