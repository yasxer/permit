"use client";

import { CalendarPlus, Check, Lock, LockOpen, Trash2, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudentFiles } from "@/hooks/use-enrollments";
import {
  SESSION_TYPES,
  sessionMinutes,
  useBlockSlot,
  useCreateSession,
  useDeleteSlot,
  type Resource,
  type SlotWithStudent,
} from "@/hooks/use-planning";
import { useMySchool } from "@/hooks/use-school-profile";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LessonType, StudentFileRow } from "@/types";

/**
 * Which candidates a session type is for.
 *
 * The stages run code → créneau → conduite, so each type offers the candidates
 * standing on that step. Perfectionnement is not a step: it is extra paid
 * hours, open to anyone with an open file.
 */
function eligibleFor(type: LessonType, file: StudentFileRow): boolean {
  if (type === "code") return !file.creneau_unlocked;
  if (type === "creneau") return file.creneau_unlocked && !file.conduite_unlocked;
  if (type === "conduite") return file.conduite_unlocked;
  return true;
}

const ELIGIBLE_HINT: Record<LessonType, string> = {
  code: "eligibleCode",
  creneau: "eligibleCreneau",
  conduite: "eligibleConduite",
  perfectionnement: "eligiblePerf",
};

export function SessionDialog({
  cell,
  schoolId,
  resource,
  onOpenChange,
}: {
  /** An empty half hour to fill, or whatever is already sitting on it. */
  cell: { date: string; time: string; slot: SlotWithStudent | null } | null;
  schoolId: string;
  resource: Resource;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={cell !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {cell &&
          (cell.slot ? (
            <ExistingSlot slot={cell.slot} onDone={() => onOpenChange(false)} />
          ) : (
            <NewSession
              date={cell.date}
              time={cell.time}
              schoolId={schoolId}
              resource={resource}
              onDone={() => onOpenChange(false)}
            />
          ))}
      </DialogContent>
    </Dialog>
  );
}

function NewSession({
  date,
  time,
  schoolId,
  resource,
  onDone,
}: {
  date: string;
  time: string;
  schoolId: string;
  resource: Resource;
  onDone: () => void;
}) {
  const t = useTranslations("ecole.planning");
  const tc = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const types = SESSION_TYPES[resource];
  const [type, setType] = useState<LessonType>(types[0]);
  const [selected, setSelected] = useState<string | null>(null);

  const { data: school } = useMySchool();
  const { data: students = [], isPending } = useStudentFiles(schoolId, "active");
  const create = useCreateSession();
  const block = useBlockSlot();

  const eligible = students.filter((student) => eligibleFor(type, student));
  const perfRate = school?.perf_price_per_hour ?? null;
  const rateMissing = type === "perfectionnement" && perfRate === null;
  const busy = create.isPending || block.isPending;

  function failure(error: unknown): string {
    const code = (error as { code?: string })?.code;
    if (code === "23P01") return t("overlap");
    if (code === "23505") return t("candidateBusy");
    return tErrors("generic");
  }

  async function onCreate() {
    if (!selected) return;
    try {
      await create.mutateAsync({ date, time, type, enrollmentId: selected });
      toast.success(t("sessionCreated"));
      onDone();
    } catch (error) {
      toast.error(failure(error));
    }
  }

  async function onBlock() {
    try {
      await block.mutateAsync({ date, time, type: types[0] });
      toast.success(t("slotClosed"));
      onDone();
    } catch (error) {
      toast.error(failure(error));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("newSession")}</DialogTitle>
        <DialogDescription>
          {t("slotOn", { date: formatDate(date, locale), time: formatTime(time) })}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {types.length > 1 && (
          <Field>
            <FieldLabel>{t("sessionType")}</FieldLabel>
            <Tabs
              value={type}
              onValueChange={(value) => {
                setType(value as LessonType);
                // The next type offers a different set of candidates; keeping
                // the old pick would submit someone no longer in the list.
                setSelected(null);
              }}
            >
              <TabsList className="w-full">
                {types.map((option) => (
                  <TabsTrigger key={option} value={option} className="flex-1">
                    {t(option)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <FieldDescription>
              {t("duration")}: {t("minutes", { count: sessionMinutes(type) })}
              {type === "perfectionnement" && perfRate !== null && (
                <>
                  {" · "}
                  {t("sessionPrice", { amount: formatCurrency(perfRate, locale) })}
                </>
              )}
            </FieldDescription>
          </Field>
        )}

        {rateMissing ? (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {t("perfRateMissing")}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("selectStudent")}</p>
            <Command className="rounded-xl border">
              <CommandInput placeholder={t("searchStudent")} />
              <CommandList className="max-h-52">
                <CommandEmpty>
                  {isPending ? tc("loading") : t("noEligible")}
                </CommandEmpty>
                {eligible.map((student) => (
                  <CommandItem
                    key={student.id}
                    // The id keeps the value unique — cmdk collapses two items
                    // that share one, and two candidates can share a name.
                    value={`${student.candidate_name ?? ""} ${student.candidate_phone ?? ""} ${student.id}`}
                    onSelect={() => setSelected(student.id)}
                    // Not `data-selected`: cmdk owns that one for the keyboard
                    // cursor, a different thing from the school's pick.
                    data-chosen={student.id === selected}
                    className="gap-2 data-[chosen=true]:bg-primary/10 data-[chosen=true]:font-medium"
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0 text-primary",
                        student.id === selected ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {student.candidate_name ?? "—"}
                    </span>
                    <Badge variant="secondary" className="font-mono font-semibold">
                      {student.category_code}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
            <p className="text-xs text-muted-foreground">{t(ELIGIBLE_HINT[type])}</p>
          </div>
        )}
      </div>

      <DialogFooter className="mt-6 gap-2 sm:flex-col sm:items-stretch">
        <Button
          onClick={onCreate}
          disabled={!selected || rateMissing || busy}
        >
          {create.isPending ? <Spinner /> : <CalendarPlus className="size-4" />}
          {t("createSession")}
        </Button>
        {/* A half hour with no lesson in it: a repair, a break, a day off. */}
        <Button variant="outline" onClick={onBlock} disabled={busy}>
          {block.isPending ? <Spinner /> : <Lock className="size-4" />}
          {t("closeSlot")}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} disabled={busy}>
          {tc("cancel")}
        </Button>
      </DialogFooter>
    </>
  );
}

function ExistingSlot({
  slot,
  onDone,
}: {
  slot: SlotWithStudent;
  onDone: () => void;
}) {
  const t = useTranslations("ecole.planning");
  const tc = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const remove = useDeleteSlot();
  const blocked = slot.status !== "booked";

  async function onDelete() {
    try {
      await remove.mutateAsync({ id: slot.id });
      toast.success(blocked ? t("slotReopened") : t("sessionDeleted"));
      onDone();
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{blocked ? t("closed") : t(slot.lesson_type)}</DialogTitle>
        <DialogDescription>
          {t("slotOn", {
            date: formatDate(slot.slot_date, locale),
            time: formatTime(slot.start_time),
          })}
        </DialogDescription>
      </DialogHeader>

      {blocked ? (
        <p className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          {t("closedHint")}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4">
            <User className="size-4 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("bookedBy")}</p>
              <p className="truncate text-sm font-medium">
                {slot.enrollment?.candidate?.full_name ?? "—"}
              </p>
            </div>
          </div>

          <dl className="space-y-2 px-1 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">{t("duration")}</dt>
              <dd className="tabular-nums">
                {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
              </dd>
            </div>
            {slot.price !== null && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{t("perfectionnement")}</dt>
                <dd className="font-medium tabular-nums">
                  {formatCurrency(slot.price, locale)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={remove.isPending}
        >
          {tc("close")}
        </Button>
        <Button
          variant={blocked ? "default" : "destructive"}
          onClick={onDelete}
          disabled={remove.isPending}
        >
          {remove.isPending ? (
            <Spinner />
          ) : blocked ? (
            <LockOpen className="size-4" />
          ) : (
            <Trash2 className="size-4" />
          )}
          {blocked ? t("reopenSlot") : t("deleteSession")}
        </Button>
      </DialogFooter>
    </>
  );
}
