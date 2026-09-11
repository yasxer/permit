"use client";

import { CalendarPlus, Check, Lock, LockOpen, Trash2, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { CategoryBadge } from "@/components/shared/category-badge";
import { Notice } from "@/components/shared/notice";
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
import { stageOf } from "@/lib/stages";
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
  if (type === "perfectionnement") return true;
  return stageOf(file) === type;
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
      <DialogContent className="sm:max-w-[32.5rem]">
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
            {/* Des tuiles plutôt que des onglets : la durée se lit sur chacune,
                et c'est elle qui décide de la place prise dans la grille. */}
            <div className="grid grid-cols-2 gap-2">
              {types.map((option) => {
                const chosen = option === type;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => {
                      setType(option);
                      // The next type offers a different set of candidates;
                      // keeping the old pick would submit someone no longer in
                      // the list.
                      setSelected(null);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-[10px] border px-3 py-2.5 text-start text-[0.8125rem] transition-colors",
                      "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
                      chosen
                        ? "border-brand bg-brand/10 font-semibold text-foreground"
                        : "border-border font-medium text-secondary-foreground hover:bg-muted",
                    )}
                  >
                    {t(option)}
                    <span
                      className={cn(
                        "shrink-0 text-[0.6875rem] tabular-nums",
                        chosen ? "text-warning" : "text-muted-foreground/70",
                      )}
                    >
                      {t("minutes", { count: sessionMinutes(option) })}
                    </span>
                  </button>
                );
              })}
            </div>
            {type === "perfectionnement" && perfRate !== null && (
              <FieldDescription>
                {t("sessionPrice", { amount: formatCurrency(perfRate, locale) })}
              </FieldDescription>
            )}
          </Field>
        )}

        {rateMissing ? (
          <Notice>{t("perfRateMissing")}</Notice>
        ) : (
          <div className="space-y-2">
            <p className="text-[0.8125rem] font-semibold text-secondary-foreground">
              {t("selectStudent")}
            </p>
            <Command className="rounded-[10px] border border-border">
              <CommandInput placeholder={t("searchStudent")} />
              {/* L'en-tête dit *pourquoi* la liste est courte : elle ne
                  propose que les dossiers arrivés à cette étape. */}
              <p className="border-b border-border bg-background px-3 py-2.5 text-xs text-muted-foreground">
                {t(ELIGIBLE_HINT[type])}
              </p>
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
                        "size-4 shrink-0 text-brand-ink",
                        student.id === selected ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold">
                        {student.candidate_name_fr ?? student.candidate_name ?? "—"}
                      </span>
                      {student.candidate_name &&
                        student.candidate_name !== student.candidate_name_fr && (
                          <span
                            lang="ar"
                            dir="rtl"
                            className="truncate text-xs text-muted-foreground"
                          >
                            {student.candidate_name}
                          </span>
                        )}
                    </span>
                    <CategoryBadge code={student.category_code} />
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </div>
        )}
      </div>

      <DialogFooter className="mt-2 sm:justify-between">
        {/* A half hour with no lesson in it: a repair, a break, a day off. Il
            se range à l'opposé des deux autres — ce n'est pas une variante de
            « créer », c'est le contraire. */}
        <Button variant="outline" size="sm" onClick={onBlock} disabled={busy}>
          {block.isPending ? <Spinner /> : <Lock className="size-4" />}
          {t("closeSlot")}
        </Button>
        <div className="flex gap-2.5">
          <Button type="button" variant="outline" onClick={onDone} disabled={busy}>
            {tc("cancel")}
          </Button>
          <Button onClick={onCreate} disabled={!selected || rateMissing || busy}>
            {create.isPending ? <Spinner /> : <CalendarPlus className="size-4" />}
            {t("createSession")}
          </Button>
        </div>
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
        <div className="space-y-4">
          <div className="flex items-center gap-3.5 rounded-xl bg-background p-3.5">
            <User className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t("bookedBy")}</p>
              <p className="truncate text-[0.9375rem] font-semibold">
                {slot.enrollment?.candidate?.full_name ?? "—"}
              </p>
            </div>
          </div>

          <dl className="space-y-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[0.8125rem] text-muted-foreground">{tc("status")}</dt>
              <dd className="font-semibold">{t(slot.lesson_type)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[0.8125rem] text-muted-foreground">{t("duration")}</dt>
              <dd className="tabular-nums" dir="ltr">
                {formatTime(slot.start_time)} → {formatTime(slot.end_time)}
              </dd>
            </div>
            {slot.price !== null && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[0.8125rem] text-muted-foreground">
                  {t("perfectionnement")}
                </dt>
                <dd className="font-semibold tabular-nums">
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
