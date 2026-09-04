"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  SLOT_TIMES,
  usePlanningTemplate,
  useSaveTemplate,
  type TemplateCell,
} from "@/hooks/use-planning";
import { DAY_KEYS, WORK_WEEK_DOW, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LessonType } from "@/types";

type CellState = boolean | null;

/** `${dow}|${time}` — the grid coordinate for one lesson type. */
const cellKey = (dow: number, time: string) => `${dow}|${time}`;

const CELL_STYLE: Record<string, string> = {
  true: "bg-success/20 text-success hover:bg-success/30",
  false: "bg-destructive/15 text-destructive hover:bg-destructive/25",
  null: "bg-muted/60 text-muted-foreground hover:bg-muted",
};

export function TemplateGrid({ schoolId }: { schoolId: string }) {
  const t = useTranslations("ecole.planning");
  const tStatus = useTranslations("status");
  const tDays = useTranslations("days");
  const tErrors = useTranslations("errors");

  const [lessonType, setLessonType] = useState<LessonType>("code");
  // Only the cells the user actually touched, so a save never rewrites rows
  // that did not change.
  const [edits, setEdits] = useState<Record<string, CellState>>({});

  const { data: rows = [], isPending } = usePlanningTemplate(schoolId);
  const save = useSaveTemplate(schoolId);

  const saved = useMemo(() => {
    const map: Record<string, CellState> = {};
    for (const row of rows) {
      if (row.lesson_type !== lessonType) continue;
      map[cellKey(row.day_of_week, row.start_time)] = row.is_available;
    }
    return map;
  }, [rows, lessonType]);

  function stateOf(dow: number, time: string): CellState {
    const key = `${lessonType}|${cellKey(dow, time)}`;
    return key in edits ? edits[key] : (saved[cellKey(dow, time)] ?? null);
  }

  function cycle(dow: number, time: string) {
    const current = stateOf(dow, time);
    // not set → available → unavailable → not set
    const next: CellState = current === null ? true : current ? false : null;
    setEdits((previous) => ({
      ...previous,
      [`${lessonType}|${cellKey(dow, time)}`]: next,
    }));
  }

  const dirtyCount = Object.keys(edits).length;

  async function onSave() {
    const cells: TemplateCell[] = Object.entries(edits).map(([key, value]) => {
      // Key is `${lessonType}|${dow}|${HH:MM:SS}` — the time has colons, never
      // pipes, so splitting on every pipe is safe.
      const [type, dow, time] = key.split("|");
      return {
        lesson_type: type as LessonType,
        day_of_week: Number(dow),
        start_time: time,
        is_available: value,
      };
    });

    try {
      await save.mutateAsync(cells);
      toast.success(t("templateSaved"));
      setEdits({});
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  if (isPending) return <Skeleton className="h-[32rem]" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={lessonType}
          onValueChange={(value) => setLessonType(value as LessonType)}
        >
          <TabsList>
            <TabsTrigger value="code">{t("code")}</TabsTrigger>
            <TabsTrigger value="conduite">{t("conduite")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          {dirtyCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {t("unsavedChanges")}
            </span>
          )}
          <Button onClick={onSave} disabled={dirtyCount === 0 || save.isPending}>
            {save.isPending && <Spinner />}
            {t("saveTemplate")}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{t("cycleHint")}</p>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="sr-only">{t("legend")}</span>
        {(
          [
            ["true", "available"],
            ["false", "unavailable"],
            ["null", "notSet"],
          ] as const
        ).map(([state, label]) => (
          <span key={state} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded-sm", CELL_STYLE[state])} aria-hidden />
            {tStatus(label)}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{t("tabTemplate")}</caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky start-0 z-10 bg-background px-3 py-2 text-start text-xs font-medium text-muted-foreground"
              >
                {t("hour")}
              </th>
              {WORK_WEEK_DOW.map((dow) => (
                <th
                  key={dow}
                  scope="col"
                  className="px-2 py-2 text-xs font-medium text-muted-foreground"
                >
                  {tDays(DAY_KEYS[dow])}
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
                {WORK_WEEK_DOW.map((dow) => {
                  const state = stateOf(dow, time);
                  const label = state === null ? "notSet" : state ? "available" : "unavailable";
                  return (
                    <td key={dow} className="p-0.5">
                      <button
                        type="button"
                        onClick={() => cycle(dow, time)}
                        aria-label={`${tDays(DAY_KEYS[dow])} ${formatTime(time)} — ${tStatus(label)}`}
                        aria-pressed={state === true}
                        className={cn(
                          "h-7 w-full min-w-14 rounded-md text-[0.65rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          CELL_STYLE[String(state)],
                        )}
                      >
                        <span className="sr-only">{tStatus(label)}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">{t("templateHint")}</p>
    </div>
  );
}
