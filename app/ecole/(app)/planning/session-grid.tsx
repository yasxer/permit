"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/hooks/use-mounted";
import {
  SLOT_TIMES,
  resourceOf,
  slotRowSpan,
  useSlots,
  type Resource,
  type SlotWithStudent,
} from "@/hooks/use-planning";
import { DAY_KEYS, formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { fromISODate, workWeekDates } from "@/lib/week";

import { SessionDialog } from "./session-dialog";

/**
 * Les pastilles de la charte. Le code et la conduite partagent l'encre, le
 * créneau prend l'ambre, le perfectionnement le vert : trois teintes pour
 * quatre types, parce que c'est la durée et le prix qui séparent réellement
 * les deux premiers, et qu'on les distingue de toute façon par la ressource.
 */
const TYPE_STYLE: Record<string, string> = {
  code: "bg-primary/15 text-primary",
  conduite: "bg-primary/15 text-primary",
  creneau: "bg-brand/20 text-[color-mix(in_oklch,var(--brand-ink),black_18%)] dark:text-brand",
  perfectionnement:
    "bg-success/20 text-[color-mix(in_oklch,var(--success),black_25%)] dark:text-success",
};

const cellKey = (date: string, time: string) => `${date}|${time}`;

export function SessionGrid({
  schoolId,
  resource,
  weekStart,
}: {
  schoolId: string;
  resource: Resource;
  weekStart: string;
}) {
  const t = useTranslations("ecole.planning");
  const tDays = useTranslations("days");
  const locale = useLocale();

  const [openCell, setOpenCell] = useState<{
    date: string;
    time: string;
    slot: SlotWithStudent | null;
  } | null>(null);

  const days = workWeekDates(weekStart);
  const [activeDay, setActiveDay] = useState(0);

  const { data: slots = [], isPending } = useSlots(schoolId, weekStart);

  // The week the browser lands on depends on its clock, so the grid only
  // settles on the first client pass; it renders the pending skeleton until
  // then rather than a week the server guessed.
  const mounted = useMounted();
  if (!mounted || isPending) {
    return <Skeleton className="h-[36rem] rounded-xl" />;
  }

  const rows = slots.filter((slot) => resourceOf(slot.lesson_type) === resource);
  const startsAt = new Map(
    rows.map((slot) => [cellKey(slot.slot_date, slot.start_time), slot]),
  );

  // The half hours a longer session swallows: they get no cell of their own,
  // the span above already covers them.
  const covered = new Set<string>();
  for (const slot of rows) {
    const index = SLOT_TIMES.indexOf(slot.start_time);
    if (index < 0) continue;
    for (let step = 1; step < slotRowSpan(slot.lesson_type); step += 1) {
      const time = SLOT_TIMES[index + step];
      if (time) covered.add(cellKey(slot.slot_date, time));
    }
  }

  const dayName = (date: string) => tDays(DAY_KEYS[fromISODate(date).getDay()]);

  function renderDay(date: string) {
    return SLOT_TIMES.map((time, index) => {
      if (covered.has(cellKey(date, time))) return null;

      const slot = startsAt.get(cellKey(date, time));
      const row = index + 1;

      if (!slot) {
        return (
          <button
            key={time}
            type="button"
            style={{ gridRow: row, gridColumn: 1 }}
            onClick={() => setOpenCell({ date, time, slot: null })}
            aria-label={`${dayName(date)} ${formatTime(time)} — ${t("newSession")}`}
            className="group border-t border-separator transition-colors hover:bg-brand/10 focus-visible:bg-brand/10 focus-visible:outline-none"
          >
            <Plus
              className="mx-auto size-3.5 text-brand-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden
            />
          </button>
        );
      }

      const blocked = slot.status !== "booked";
      const span = slotRowSpan(slot.lesson_type);

      if (blocked) {
        return (
          <button
            key={time}
            type="button"
            style={{ gridRow: `${row} / span ${span}`, gridColumn: 1 }}
            onClick={() => setOpenCell({ date, time, slot })}
            className="slot-closed flex items-center border-t border-separator ps-2 text-start text-[0.625rem] font-semibold text-destructive focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
          >
            {t("closed")}
          </button>
        );
      }

      return (
        <button
          key={time}
          type="button"
          style={{ gridRow: `${row} / span ${span}`, gridColumn: 1 }}
          onClick={() => setOpenCell({ date, time, slot })}
          className={cn(
            "my-[2px] mx-[3px] flex flex-col justify-center gap-px overflow-hidden rounded-[9px] px-2 py-1 text-start transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
            TYPE_STYLE[slot.lesson_type],
          )}
        >
          <span className="truncate text-[0.6875rem] font-bold leading-tight">
            {t(slot.lesson_type)}
          </span>
          <span className="truncate text-[0.6875rem] leading-tight text-secondary-foreground">
            {slot.enrollment?.candidate?.full_name ?? "—"}
          </span>
        </button>
      );
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Sous md : un jour à la fois. Six colonnes sur 390 px ne se cliquent
          pas — le sélecteur de jour remplace la largeur manquante. */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {days.map((date, index) => (
          <button
            key={date}
            type="button"
            onClick={() => setActiveDay(index)}
            aria-current={index === activeDay ? "true" : undefined}
            className={cn(
              "flex min-w-14 shrink-0 flex-col items-center gap-0.5 rounded-xl border px-3 py-2 transition-colors",
              index === activeDay
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card",
            )}
          >
            <span
              className={cn(
                "text-[0.6875rem] font-semibold capitalize",
                index === activeDay ? "text-brand" : "text-muted-foreground",
              )}
            >
              {dayName(date)}
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {formatDate(date, locale, { day: "2-digit" })}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* En-tête des jours — desktop seulement : sur mobile le jour actif est
            déjà nommé par le sélecteur. */}
        <div className="hidden grid-cols-[76px_repeat(6,1fr)] border-b border-border md:grid">
          <span className="p-3 text-center font-mono text-[0.6875rem] text-muted-foreground/80">
            {t("hour")}
          </span>
          {days.map((date) => (
            <div
              key={date}
              className="flex flex-col items-center gap-0.5 border-s border-border p-3"
            >
              <span className="text-[0.8125rem] font-semibold capitalize">
                {dayName(date)}
              </span>
              <span dir="ltr" className="text-xs tabular-nums text-muted-foreground/80">
                {formatDate(date, locale, { day: "2-digit", month: "2-digit" })}
              </span>
            </div>
          ))}
        </div>

        <div className="planning-grid grid grid-cols-[58px_1fr] md:grid-cols-[76px_repeat(6,1fr)]">
          {/* La colonne des heures, en mono : ce sont des repères, pas du texte. */}
          <div
            className="grid"
            style={{ gridTemplateRows: `repeat(20, var(--planning-row))` }}
          >
            {SLOT_TIMES.map((time) => (
              <span
                key={time}
                dir="ltr"
                className="flex justify-center border-t border-separator pt-1 font-mono text-[0.6875rem] tabular-nums text-muted-foreground/80"
              >
                {formatTime(time)}
              </span>
            ))}
          </div>

          {days.map((date, index) => (
            <div
              key={date}
              className={cn(
                "grid border-s border-border",
                index === activeDay ? "grid" : "hidden md:grid",
              )}
              style={{ gridTemplateRows: `repeat(20, var(--planning-row))` }}
            >
              {renderDay(date)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <ul className="flex flex-wrap items-center gap-x-[18px] gap-y-2">
          <span className="sr-only">{t("legend")}</span>
          <LegendItem swatch="bg-primary/15" label={t("legendCodeConduite")} />
          <LegendItem swatch="bg-brand/20" label={t("legendCreneau")} />
          <LegendItem swatch="bg-success/20" label={t("legendPerf")} />
          <LegendItem swatch="slot-closed" label={t("legendClosed")} />
        </ul>
        <p className="text-[0.8125rem] text-muted-foreground">{t("gridLegendHint")}</p>
      </div>

      <SessionDialog
        cell={openCell}
        schoolId={schoolId}
        resource={resource}
        onOpenChange={(open) => !open && setOpenCell(null)}
      />
    </div>
  );
}

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <li className="flex items-center gap-2 text-[0.8125rem] text-secondary-foreground">
      <span className={cn("size-3.5 shrink-0 rounded-[5px]", swatch)} aria-hidden />
      {label}
    </li>
  );
}
