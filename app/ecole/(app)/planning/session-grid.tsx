"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
import { fromISODate, toISODate, workWeekDates } from "@/lib/week";

import { SessionDialog } from "./session-dialog";

/**
 * Les pastilles de la charte. Le code et la conduite partagent l'encre, le
 * créneau prend l'ambre, le perfectionnement le vert : trois teintes pour
 * quatre types, parce que c'est la ressource qui sépare les deux premiers, et
 * qu'on ne les voit jamais sur la même grille.
 */
const TYPE_STYLE: Record<string, string> = {
  code: "bg-primary/15 text-primary",
  conduite: "bg-primary/15 text-primary",
  creneau: "bg-brand/20 text-[color-mix(in_oklch,var(--brand-ink),black_18%)] dark:text-brand",
  perfectionnement:
    "bg-success/20 text-[color-mix(in_oklch,var(--success),black_25%)] dark:text-success",
};

const cellKey = (date: string, time: string) => `${date}|${time}`;

/**
 * Une demi-heure fait 42 px sur desktop — la hauteur qu'il faut pour que la
 * pastille de 30 min affiche ses deux lignes sans rognage — et 40 px sur
 * mobile, où la colonne unique rend la place en largeur.
 */
const ROWS = "[--planning-row:40px] md:[--planning-row:42px]";
const ROW_TEMPLATE = { gridTemplateRows: `repeat(${SLOT_TIMES.length}, var(--planning-row))` };

export function SessionGrid({
  schoolId,
  resource,
  weekStart,
  onShiftWeek,
}: {
  schoolId: string;
  resource: Resource;
  weekStart: string;
  /** Tourne la semaine depuis la rangée des jours, sur mobile. */
  onShiftWeek: (weeks: number) => void;
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
  // Sur mobile, la grille s'ouvre sur aujourd'hui quand il tombe dans la
  // semaine affichée — c'est le jour qu'on vient remplir. Vendredi, samedi.
  const [activeDay, setActiveDay] = useState(() =>
    Math.max(0, days.indexOf(toISODate(new Date()))),
  );
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
  // « sam », pas « sam. » : la puce fait 42 px de large.
  const shortDay = (date: string) =>
    formatDate(date, locale, { weekday: "short" }).replace(/\.$/, "");

  function renderDay(date: string) {
    return SLOT_TIMES.map((time, index) => {
      if (covered.has(cellKey(date, time))) return null;

      const slot = startsAt.get(cellKey(date, time));
      const row = index + 1;
      const rule = index > 0 && "border-t border-separator";

      if (!slot) {
        return (
          <button
            key={time}
            type="button"
            style={{ gridRow: row, gridColumn: 1 }}
            onClick={() => setOpenCell({ date, time, slot: null })}
            aria-label={`${dayName(date)} ${formatTime(time)} — ${t("newSession")}`}
            className={cn(
              "group transition-colors hover:bg-brand/10 focus-visible:bg-brand/10 focus-visible:outline-none",
              rule,
            )}
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
            className={cn(
              "slot-closed flex items-center ps-2 text-start text-[0.625rem] font-semibold text-destructive focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
              rule,
            )}
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
            // La pastille s'étire sur sa ou ses demi-heures : la hauteur vient
            // de la grille, jamais d'un calcul en pixels qui s'en écarterait.
            "mx-1.5 my-[2px] flex flex-col justify-center gap-px self-stretch overflow-hidden rounded-[9px] px-2 py-1 text-start transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 md:mx-[3px]",
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

  const chevron =
    "grid w-7 shrink-0 place-items-center rounded-[11px] border border-border bg-card text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35";

  return (
    <div className="flex flex-col gap-3 md:gap-5">
      {/* Sous md : un jour à la fois (2g). Six colonnes sur 390 px ne se
          cliquent pas — la rangée des jours remplace la largeur manquante, et
          ses deux bouts tournent la semaine. */}
      <div className="flex items-stretch gap-[7px] md:hidden">
        <button
          type="button"
          className={chevron}
          aria-label={t("previousWeek")}
          onClick={() => onShiftWeek(-1)}
        >
          <ChevronLeft className="size-4 rtl-flip" aria-hidden />
        </button>

        {days.map((date, index) => {
          const active = index === activeDay;
          return (
            <button
              key={date}
              type="button"
              onClick={() => setActiveDay(index)}
              aria-pressed={active}
              aria-label={dayName(date)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[11px] py-2 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
                // Le jour actif reste bleu nuit dans les deux thèmes, comme la
                // barre : c'est un repère, pas une surface. En sombre, le nuit
                // se confond avec les cartes — un filet ambre le détache.
                active
                  ? "bg-sidebar text-white dark:ring-1 dark:ring-inset dark:ring-brand/60"
                  : "border border-border bg-card",
              )}
            >
              <span
                className={cn(
                  "text-[0.625rem] leading-none",
                  active ? "text-brand" : "text-muted-foreground/80",
                )}
              >
                {shortDay(date)}
              </span>
              <span
                className={cn(
                  "text-sm leading-tight tabular-nums",
                  active ? "font-bold" : "font-semibold",
                )}
              >
                {formatDate(date, locale, { day: "numeric" })}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          className={chevron}
          aria-label={t("nextWeek")}
          onClick={() => onShiftWeek(1)}
        >
          <ChevronRight className="size-4 rtl-flip" aria-hidden />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* En-tête des jours — desktop seulement : sur mobile, la rangée de
            puces nomme déjà le jour affiché. */}
        <div className="hidden grid-cols-[76px_repeat(6,1fr)] border-b border-border md:grid">
          <span className="p-3 text-center font-mono text-[0.6875rem] text-muted-foreground/80">
            {t("hour")}
          </span>
          {days.map((date) => (
            <div
              key={date}
              className="flex flex-col items-center gap-0.5 border-s border-border p-3"
            >
              <span className="text-[0.8125rem] font-semibold capitalize">{dayName(date)}</span>
              <span className="text-xs tabular-nums text-muted-foreground/80">
                {formatDate(date, locale, { day: "2-digit", month: "2-digit" })}
              </span>
            </div>
          ))}
        </div>

        <div className={cn("grid grid-cols-[58px_1fr] md:grid-cols-[76px_repeat(6,1fr)]", ROWS)}>
          {/* La colonne des heures, en mono : ce sont des repères, pas du
              texte. Calée au début sur mobile, centrée sur desktop. */}
          <div className="grid" style={ROW_TEMPLATE}>
            {SLOT_TIMES.map((time, index) => (
              <span
                key={time}
                className={cn(
                  "flex justify-start ps-2 pt-[9px] font-mono text-[0.6875rem] tabular-nums text-muted-foreground/80 md:justify-center md:ps-0 md:pt-1",
                  index > 0 && "border-t border-separator",
                )}
              >
                {formatTime(time)}
              </span>
            ))}
          </div>

          {days.map((date, index) => (
            <div
              key={date}
              className={cn(
                "border-s border-separator md:border-border",
                index === activeDay ? "grid" : "hidden md:grid",
              )}
              style={ROW_TEMPLATE}
            >
              {renderDay(date)}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground md:hidden">{t("gridLegendHintTouch")}</p>

      <div className="hidden flex-wrap items-center justify-between gap-x-6 gap-y-3 md:flex">
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
