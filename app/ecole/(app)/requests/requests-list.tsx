"use client";

import { Check, Inbox, Phone, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CandidateIdentity } from "@/components/shared/candidate-identity";
import { CategoryBadge } from "@/components/shared/category-badge";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useAcceptEnrollment,
  useRejectEnrollment,
  useStudentFiles,
} from "@/hooks/use-enrollments";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EnrollmentStatus, StudentFileRow } from "@/types";

type Decision = { file: StudentFileRow; action: "accept" | "reject" };
type Filter = EnrollmentStatus | "all";

/** Only the states a request can be in — 'completed' belongs to /completed. */
const FILTERS: Filter[] = ["all", "pending", "active", "rejected"];

/**
 * Les demandes, en cartes plutôt qu'en tableau : chacune porte une décision,
 * et une décision veut de la place — deux boutons pleine largeur, pas une
 * icône au bout d'une ligne.
 */
export function RequestsList({ schoolId }: { schoolId: string }) {
  const t = useTranslations("ecole.requests");
  const tc = useTranslations("common");
  const tStatus = useTranslations("status");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const [status, setStatus] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);
  const [decision, setDecision] = useState<Decision | null>(null);

  // Tout charger une fois : les compteurs de chaque segment se lisent sur la
  // même liste, et un aller-retour par filtre ferait clignoter la rangée.
  const { data: all = [], isPending } = useStudentFiles(schoolId, "all");
  const accept = useAcceptEnrollment();
  const reject = useRejectEnrollment();

  const counts = useMemo(() => {
    const byStatus = { all: 0, pending: 0, active: 0, rejected: 0 } as Record<Filter, number>;
    for (const file of all) {
      if (file.status === "completed") continue;
      byStatus.all += 1;
      if (file.status in byStatus) byStatus[file.status] += 1;
    }
    return byStatus;
  }, [all]);

  const rows = useMemo(() => {
    const needle = debounced.trim().toLowerCase();
    return all.filter((file) => {
      if (file.status === "completed") return false;
      if (status !== "all" && file.status !== status) return false;
      if (!needle) return true;
      return [file.candidate_name, file.candidate_name_fr, file.candidate_phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle));
    });
  }, [all, status, debounced]);

  async function confirm() {
    if (!decision) return;
    const { file, action } = decision;
    try {
      if (action === "accept") {
        await accept.mutateAsync({ id: file.id });
        toast.success(t("accepted"));
      } else {
        await reject.mutateAsync({ id: file.id });
        toast.success(t("rejected"));
      }
      setDecision(null);
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-5 lg:px-5">
        {/* Le compteur vit dans le segment : le filtre dit alors ce qu'il
            cache autant que ce qu'il montre. */}
        <div className="flex gap-0.5 overflow-x-auto rounded-xl bg-muted p-1">
          {FILTERS.map((value) => {
            const selected = value === status;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setStatus(value)}
                className={cn(
                  "flex shrink-0 items-center gap-[7px] rounded-[9px] px-3.5 py-[7px] text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
                  selected
                    ? "border border-border bg-card font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "all" ? tc("all") : tStatus(value)}
                <span
                  className={cn(
                    "text-[0.6875rem] font-bold tabular-nums",
                    selected && value === "pending"
                      ? "text-warning"
                      : "text-muted-foreground/70",
                  )}
                >
                  {counts[value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative lg:w-72">
          <Search
            className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={tc("search")}
            className="ps-9"
          />
        </div>
      </div>

      {isPending ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState icon={Inbox} title={t("empty")} />
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((file) => (
            <li
              key={file.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <CandidateIdentity
                  nameFr={file.candidate_name_fr}
                  nameAr={file.candidate_name}
                  photoUrl={file.candidate_photo_url}
                  size="lg"
                  className="flex-1"
                />
                <CategoryBadge code={file.category_code} />
              </div>

              <div className="flex flex-col gap-[7px] border-t border-separator pt-3.5 text-[0.8125rem]">
                <span className="flex items-center gap-2 text-secondary-foreground">
                  <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span dir="ltr" className="tabular-nums">
                    {file.candidate_phone ?? "—"}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {t("requestedAt")} {formatDate(file.requested_at, locale, { dateStyle: "long" })}
                </span>
              </div>

              {file.status === "pending" ? (
                <div className="mt-auto flex gap-2.5">
                  <Button
                    className="flex-1"
                    onClick={() => setDecision({ file, action: "accept" })}
                  >
                    <Check className="size-4" />
                    {t("accept")}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-destructive/35 text-destructive hover:border-destructive/60 hover:bg-destructive/8"
                    onClick={() => setDecision({ file, action: "reject" })}
                  >
                    <X className="size-4" />
                    {t("reject")}
                  </Button>
                </div>
              ) : (
                <div className="mt-auto">
                  <StatusBadge status={file.status} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={decision !== null}
        onOpenChange={(open) => !open && setDecision(null)}
        title={decision?.action === "reject" ? t("rejectTitle") : t("acceptTitle")}
        message={
          decision
            ? decision.action === "reject"
              ? t("rejectMessage", { name: decision.file.candidate_name ?? "—" })
              : t("acceptMessage", { name: decision.file.candidate_name ?? "—" })
            : undefined
        }
        confirmLabel={decision?.action === "reject" ? t("reject") : t("accept")}
        destructive={decision?.action === "reject"}
        pending={accept.isPending || reject.isPending}
        onConfirm={confirm}
      />
    </>
  );
}
