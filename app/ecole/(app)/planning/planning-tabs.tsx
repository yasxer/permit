"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { PageShell } from "@/components/shared/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMounted } from "@/hooks/use-mounted";
import type { Resource } from "@/hooks/use-planning";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addDays, fromISODate, startOfWeek, toISODate, workWeekDates } from "@/lib/week";

import { SessionGrid } from "./session-grid";

/**
 * Le planning : deux ressources, une semaine à la fois.
 *
 * L'écran rend lui-même son en-tête, parce que l'en-tête mobile dit ce qu'on
 * regarde — « Conduite · semaine du 5 sept. » — et que la ressource et la
 * semaine vivent ici.
 *
 * Sur desktop, la barre de contrôle porte les deux gestes dans une carte à
 * part. Sur mobile, les onglets passent pleine largeur sur le fond de page,
 * et la semaine se tourne depuis les bouts de la rangée des jours.
 */
export function PlanningTabs({ schoolId, kicker }: { schoolId: string; kicker?: string }) {
  const t = useTranslations("ecole.planning");
  const locale = useLocale();

  const [resource, setResource] = useState<Resource>("driving");
  const [weekStart, setWeekStart] = useState(() => toISODate(startOfWeek(new Date())));

  // Which week "today" falls in depends on the reader's clock and timezone, and
  // month names come out differently from Node's ICU and the browser's — so the
  // server cannot render the week the way the client will.
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

  const resourceLabel = t(resource === "code" ? "code" : "conduite");
  const mobileSubtitle = mounted
    ? `${resourceLabel} · ${t("weekOf", {
        date: formatDate(days[0], locale, { day: "numeric", month: "short" }),
      })}`
    : resourceLabel;

  const control =
    "grid h-9 place-items-center rounded-[10px] border border-input px-2.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35";

  return (
    <PageShell
      kicker={kicker}
      title={t("title")}
      description={t("planningHint")}
      mobileSubtitle={mobileSubtitle}
    >
      <Tabs
        value={resource}
        onValueChange={(value) => setResource(value as Resource)}
        className="gap-3 md:gap-5"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6 md:rounded-xl md:border md:border-border md:bg-card md:px-5 md:py-4">
          <TabsList aria-label={t("resource")} className="w-full md:w-fit">
            <TabsTrigger value="driving" className="text-[0.8125rem] md:flex-none md:px-[18px] md:text-sm">
              {t("conduite")}
            </TabsTrigger>
            <TabsTrigger value="code" className="text-[0.8125rem] md:flex-none md:px-[18px] md:text-sm">
              {t("code")}
            </TabsTrigger>
          </TabsList>

          <div className="hidden items-center gap-2.5 md:flex">
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

            <label className={cn(control, "relative flex items-center gap-2 tabular-nums")}>
              <CalendarDays className="size-[0.9375rem] text-muted-foreground" aria-hidden />
              <span className="truncate">
                {mounted ? weekLabel : <Skeleton className="h-4 w-36" />}
              </span>
              {/* Le sélecteur natif reste, invisible : il porte le clavier et
                  le calendrier du système sans imposer sa mise en forme. */}
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

        {/* One grid per resource — the car and the classroom are booked the
            same way, they just cannot be booked against each other. */}
        <TabsContent value="driving">
          <SessionGrid schoolId={schoolId} resource="driving" weekStart={weekStart} onShiftWeek={shiftWeek} />
        </TabsContent>
        <TabsContent value="code">
          <SessionGrid schoolId={schoolId} resource="code" weekStart={weekStart} onShiftWeek={shiftWeek} />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
