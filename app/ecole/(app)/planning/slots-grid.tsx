"use client";

import { CalendarDays, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SLOT_TIMES,
  useCancelSlot,
  useGenerateSlots,
  useSlots,
  type SlotWithStudent,
} from "@/hooks/use-planning";
import { DAY_KEYS, formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { fromISODate, startOfWeek, toISODate, workWeekDates } from "@/lib/week";
import type { LessonType } from "@/types";

const SLOT_STYLE: Record<string, string> = {
  available: "bg-success/20 text-success hover:bg-success/30",
  booked: "bg-primary/15 text-primary hover:bg-primary/25",
  cancelled: "bg-destructive/15 text-destructive",
};

export function SlotsGrid({ schoolId }: { schoolId: string }) {
  const t = useTranslations("ecole.planning");
  const tc = useTranslations("common");
  const tStatus = useTranslations("status");
  const tDays = useTranslations("days");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const [weekStart, setWeekStart] = useState(() => toISODate(startOfWeek(new Date())));
  const [lessonType, setLessonType] = useState<LessonType>("code");
  const [cancelling, setCancelling] = useState<SlotWithStudent | null>(null);

  const { data: slots = [], isPending } = useSlots(schoolId, weekStart);
  const generate = useGenerateSlots();
  const cancel = useCancelSlot();

  const days = workWeekDates(weekStart);
  const visible = slots.filter((slot) => slot.lesson_type === lessonType);

  // Keyed by `${date}|${time}` for O(1) cell lookup.
  const byCell = new Map(
    visible.map((slot) => [`${slot.slot_date}|${slot.start_time}`, slot]),
  );

  async function onGenerate() {
    try {
      const count = await generate.mutateAsync({ weekStart });
      toast.success(t("slotsGenerated", { count }));
    } catch {
      toast.error(t("noTemplate"));
    }
  }

  async function onCancel() {
    if (!cancelling) return;
    try {
      await cancel.mutateAsync({ id: cancelling.id });
      toast.success(t("slotCancelled"));
      setCancelling(null);
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="week">{t("selectWeek")}</Label>
            <Input
              id="week"
              type="date"
              value={weekStart}
              dir="ltr"
              // Snap any picked day back to its Saturday: the grid is a week.
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                setWeekStart(toISODate(startOfWeek(fromISODate(value))));
              }}
              className="w-44"
            />
          </div>

          <Tabs
            value={lessonType}
            onValueChange={(value) => setLessonType(value as LessonType)}
          >
            <TabsList>
              <TabsTrigger value="code">{t("code")}</TabsTrigger>
              <TabsTrigger value="conduite">{t("conduite")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Button onClick={onGenerate} disabled={generate.isPending}>
          {generate.isPending ? <Spinner /> : <Sparkles className="size-4" />}
          {generate.isPending ? t("generating") : t("generateSlots")}
        </Button>
      </div>

      {isPending ? (
        <Skeleton className="h-[32rem]" />
      ) : visible.length === 0 ? (
        <div className="rounded-xl border">
          <EmptyState
            icon={CalendarDays}
            title={t("noSlots")}
            description={t("noTemplate")}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{t("tabSlots")}</caption>
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
                    const slot = byCell.get(`${date}|${time}`);
                    if (!slot) {
                      return (
                        <td key={date} className="p-0.5">
                          <div className="h-9 w-full min-w-24 rounded-md bg-muted/30" />
                        </td>
                      );
                    }

                    const studentName =
                      slot.enrollment?.candidate?.full_name ?? null;

                    return (
                      <td key={date} className="p-0.5">
                        <button
                          type="button"
                          disabled={slot.status === "cancelled"}
                          onClick={() => setCancelling(slot)}
                          title={
                            studentName
                              ? `${t("bookedBy")}: ${studentName}`
                              : tStatus(slot.status)
                          }
                          className={cn(
                            "h-9 w-full min-w-24 truncate rounded-md px-1.5 text-[0.65rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
                            SLOT_STYLE[slot.status],
                          )}
                        >
                          {studentName ?? tStatus(slot.status)}
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

      <ConfirmModal
        open={cancelling !== null}
        onOpenChange={(open) => !open && setCancelling(null)}
        title={t("markCancelled")}
        message={
          cancelling?.enrollment?.candidate?.full_name
            ? `${t("bookedBy")}: ${cancelling.enrollment.candidate.full_name}`
            : tc("confirm")
        }
        confirmLabel={t("markCancelled")}
        destructive
        pending={cancel.isPending}
        onConfirm={onCancel}
      />
    </div>
  );
}
