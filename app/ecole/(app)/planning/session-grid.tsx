"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/hooks/use-mounted";
import {
  SESSION_TYPES,
  SLOT_TIMES,
  resourceOf,
  slotRowSpan,
  useSlots,
  type Resource,
  type SlotWithStudent,
} from "@/hooks/use-planning";
import { DAY_KEYS, formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  addDays,
  fromISODate,
  startOfWeek,
  toISODate,
  workWeekDates,
} from "@/lib/week";

import { SessionDialog } from "./session-dialog";

const TYPE_STYLE: Record<string, string> = {
  code: "bg-primary/15 text-primary hover:bg-primary/25",
  creneau: "bg-warning/20 text-warning hover:bg-warning/30",
  conduite: "bg-primary/15 text-primary hover:bg-primary/25",
  perfectionnement: "bg-success/20 text-success hover:bg-success/30",
};

const BLOCKED_STYLE =
  "bg-destructive/10 text-destructive hover:bg-destructive/20";

const cellKey = (date: string, time: string) => `${date}|${time}`;

/**
 * One week of one resource — the classroom or the car.
 *
 * Nothing is generated in advance and no availability is declared: every cell
 * is free until the school puts something on it, and the session is created at
 * that moment. A perfectionnement hour covers the half hour below it, so the
 * grid tracks what each row occupies rather than only where it starts.
 */
export function SessionGrid({
  schoolId,
  resource,
}: {
  schoolId: string;
  resource: Resource;
}) {
  const t = useTranslations("ecole.planning");
  const tDays = useTranslations("days");
  const locale = useLocale();

  const [weekStart, setWeekStart] = useState(() => toISODate(startOfWeek(new Date())));
  const [openCell, setOpenCell] = useState<{
    date: string;
    time: string;
    slot: SlotWithStudent | null;
  } | null>(null);

  const { data: slots = [], isPending } = useSlots(schoolId, weekStart);

  // Which week "today" falls in depends on the reader's clock and timezone, and
  // month names come out differently from Node's ICU and the browser's — so
  // the server has no way to render this grid the way the client will. It
  // renders the skeleton the pending query would have shown anyway, and the
  // week appears on the first client pass.
  const mounted = useMounted();
  if (!mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-[32rem]" />
      </div>
    );
  }

  const days = workWeekDates(weekStart);
  const types = SESSION_TYPES[resource];

  const rows = slots.filter((slot) => resourceOf(slot.lesson_type) === resource);

  const startsAt = new Map(
    rows.map((slot) => [cellKey(slot.slot_date, slot.start_time), slot]),
  );

  // The half hours a longer session swallows: they get no cell of their own,
  // the `rowSpan` above already covers them.
  const covered = new Set<string>();
  for (const slot of rows) {
    const index = SLOT_TIMES.indexOf(slot.start_time);
    if (index < 0) continue;
    for (let step = 1; step < slotRowSpan(slot.lesson_type); step += 1) {
      const time = SLOT_TIMES[index + step];
      if (time) covered.add(cellKey(slot.slot_date, time));
    }
  }

  function shiftWeek(weeks: number) {
    setWeekStart(toISODate(addDays(fromISODate(weekStart), weeks * 7)));
  }

  const weekLabel = `${formatDate(days[0], locale, {
    day: "2-digit",
    month: "short",
  })} — ${formatDate(days[days.length - 1], locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Booking a month ahead is four taps on the arrow, so the week is a
            page to turn rather than a date to type. */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("previousWeek")}
            onClick={() => shiftWeek(-1)}
          >
            <ChevronLeft className="size-4 rtl-flip" />
          </Button>
          <div className="min-w-44 text-center text-sm font-medium tabular-nums">
            {weekLabel}
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("nextWeek")}
            onClick={() => shiftWeek(1)}
          >
            <ChevronRight className="size-4 rtl-flip" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart(toISODate(startOfWeek(new Date())))}
          >
            <CalendarDays className="size-4" />
            {t("thisWeek")}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="sr-only">{t("legend")}</span>
          {types.map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              <span
                className={cn("size-3 rounded-sm", TYPE_STYLE[type])}
                aria-hidden
              />
              {t(type)}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded-sm", BLOCKED_STYLE)} aria-hidden />
            {t("closed")}
          </span>
          <Input
            type="date"
            value={weekStart}
            dir="ltr"
            aria-label={t("selectWeek")}
            // Snap any picked day back to its Saturday: the grid is a week.
            onChange={(event) => {
              const value = event.target.value;
              if (!value) return;
              setWeekStart(toISODate(startOfWeek(fromISODate(value))));
            }}
            className="w-40"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{t("gridHint")}</p>

      {isPending ? (
        <Skeleton className="h-[32rem]" />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              {t(resource === "code" ? "code" : "conduite")}
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky start-0 z-10 bg-background px-3 py-2 text-start text-xs font-medium text-muted-foreground"
                >
                  {t("hour")}
                </th>
                {days.map((date) => (
                  <th
                    key={date}
                    scope="col"
                    className="px-2 py-2 text-xs font-medium text-muted-foreground"
                  >
                    <span className="block">
                      {tDays(DAY_KEYS[fromISODate(date).getDay()])}
                    </span>
                    <span className="block font-normal tabular-nums">
                      {formatDate(date, locale, { day: "2-digit", month: "2-digit" })}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOT_TIMES.map((time) => (
                <tr key={time}>
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-background px-3 py-1 text-start text-xs font-normal tabular-nums text-muted-foreground"
                  >
                    {formatTime(time)}
                  </th>
                  {days.map((date) => {
                    if (covered.has(cellKey(date, time))) return null;
                    const slot = startsAt.get(cellKey(date, time));

                    if (!slot) {
                      return (
                        <td key={date} className="p-0.5">
                          <button
                            type="button"
                            onClick={() => setOpenCell({ date, time, slot: null })}
                            aria-label={`${tDays(DAY_KEYS[fromISODate(date).getDay()])} ${formatTime(time)} — ${t("newSession")}`}
                            className="group flex h-9 w-full min-w-24 items-center justify-center rounded-md border border-dashed border-transparent bg-muted/30 transition-colors hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Plus
                              className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                              aria-hidden
                            />
                          </button>
                        </td>
                      );
                    }

                    const blocked = slot.status !== "booked";
                    const span = slotRowSpan(slot.lesson_type);

                    return (
                      <td key={date} className="p-0.5 align-top" rowSpan={span}>
                        <button
                          type="button"
                          onClick={() => setOpenCell({ date, time, slot })}
                          title={
                            blocked
                              ? t("closed")
                              : `${t(slot.lesson_type)} — ${slot.enrollment?.candidate?.full_name ?? ""}`
                          }
                          className={cn(
                            "flex w-full min-w-24 flex-col justify-center gap-0.5 rounded-md px-1.5 py-1 text-[0.65rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            span === 2 ? "h-[4.75rem]" : "h-9",
                            blocked ? BLOCKED_STYLE : TYPE_STYLE[slot.lesson_type],
                          )}
                        >
                          {blocked ? (
                            <span className="truncate">{t("closed")}</span>
                          ) : (
                            <>
                              <span className="truncate">
                                {slot.enrollment?.candidate?.full_name ?? "—"}
                              </span>
                              <span className="truncate font-normal opacity-80">
                                {t(slot.lesson_type)}
                              </span>
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SessionDialog
        cell={openCell}
        schoolId={schoolId}
        resource={resource}
        onOpenChange={(open) => !open && setOpenCell(null)}
      />
    </div>
  );
}
