"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMounted } from "@/hooks/use-mounted";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addDays, fromISODate, startOfWeek, toISODate, workWeekDates } from "@/lib/week";

import { SessionGrid } from "./session-grid";

/**
 * Le planning : deux ressources, une semaine à la fois.
 *
 * La barre de contrôle porte les deux gestes de l'écran — changer de ressource
 * et changer de semaine — dans une carte à part, au-dessus de la grille : elle
 * ne défile pas avec les vingt lignes de demi-heures.
 */
export function PlanningTabs({ schoolId }: { schoolId: string }) {
  const t = useTranslations("ecole.planning");
  const locale = useLocale();

  const [weekStart, setWeekStart] = useState(() => toISODate(startOfWeek(new Date())));

  // Which week "today" falls in depends on the reader's clock and timezone, and
  // month names come out differently from Node's ICU and the browser's — so the
  // server cannot render this control the way the client will.
  const mounted = useMounted();

  function shiftWeek(weeks: number) {
    setWeekStart(toISODate(addDays(fromISODate(weekStart), weeks * 7)));
  }

  const days = workWeekDates(weekStart);
  const weekLabel = `${formatDate(days[0], locale, {
    day: "numeric",
    month: "short",
  })} – ${formatDate(days[days.length - 1], locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;

  const control =
    "grid h-9 place-items-center rounded-[10px] border border-input px-2.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35";

  return (
    <Tabs defaultValue="driving" className="gap-5">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
        <TabsList aria-label={t("resource")}>
          <TabsTrigger value="driving">{t("conduite")}</TabsTrigger>
          <TabsTrigger value="code">{t("code")}</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className={cn(control, "size-9 px-0")}
            aria-label={t("previousWeek")}
            onClick={() => shiftWeek(-1)}
          >
            <ChevronLeft className="size-4 rtl-flip" aria-hidden />
          </button>

          <button
            type="button"
            className={cn(control, "font-semibold")}
            onClick={() => setWeekStart(toISODate(startOfWeek(new Date())))}
          >
            {t("thisWeek")}
          </button>

          <label className={cn(control, "relative gap-2 tabular-nums sm:flex sm:items-center")}>
            <CalendarDays className="size-[0.9375rem] text-muted-foreground" aria-hidden />
            <span className="hidden truncate sm:inline">
              {mounted ? weekLabel : <Skeleton className="h-4 w-36" />}
            </span>
            {/* Le sélecteur natif reste, invisible : il porte le clavier et le
                calendrier du système sans imposer sa mise en forme. */}
            <input
              type="date"
              value={weekStart}
              dir="ltr"
              aria-label={t("selectWeek")}
              onChange={(event) => {
                const value = event.target.value;
                // Snap any picked day back to its Saturday: the grid is a week.
                if (value) setWeekStart(toISODate(startOfWeek(fromISODate(value))));
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>

          <button
            type="button"
            className={cn(control, "size-9 px-0")}
            aria-label={t("nextWeek")}
            onClick={() => shiftWeek(1)}
          >
            <ChevronRight className="size-4 rtl-flip" aria-hidden />
          </button>
        </div>
      </div>

      {/* One grid per resource — the car and the classroom are booked the same
          way, they just cannot be booked against each other. */}
      <TabsContent value="driving">
        <SessionGrid schoolId={schoolId} resource="driving" weekStart={weekStart} />
      </TabsContent>
      <TabsContent value="code">
        <SessionGrid schoolId={schoolId} resource="code" weekStart={weekStart} />
      </TabsContent>
    </Tabs>
  );
}
