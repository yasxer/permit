"use client";

import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useCreateExam } from "@/hooks/use-exams";
import { DAY_KEYS, formatDate } from "@/lib/format";
import { nextDatesForDow, toISODate } from "@/lib/week";

export function CreateExamDialog({
  open,
  onOpenChange,
  schoolId,
  examDay,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  /** The school's weekly exam day (Postgres dow), used to suggest dates. */
  examDay: number | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Radix unmounts the content on close, so the form below re-initialises
            on every open — no effect needed to reset it. */}
        <ExamForm
          schoolId={schoolId}
          examDay={examDay}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ExamForm({
  schoolId,
  examDay,
  onDone,
}: {
  schoolId: string;
  examDay: number | null;
  onDone: () => void;
}) {
  const t = useTranslations("ecole.exams");
  const tc = useTranslations("common");
  const tDays = useTranslations("days");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const create = useCreateExam(schoolId);
  const suggestions = examDay === null ? [] : nextDatesForDow(examDay, 4);

  const [date, setDate] = useState(() => suggestions[0] ?? toISODate(new Date()));

  async function onSubmit() {
    if (!date) return;
    try {
      await create.mutateAsync({ date });
      toast.success(t("created"));
      onDone();
    } catch (error) {
      // 23505: the school already holds a session that day.
      const code = (error as { code?: string })?.code;
      toast.error(code === "23505" ? t("duplicate") : tErrors("generic"));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("createTitle")}</DialogTitle>
        <DialogDescription>
          {date ? t("createHint", { date: formatDate(date, locale) }) : t("subtitle")}
        </DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="exam-date">{t("examDate")}</FieldLabel>
          <Input
            id="exam-date"
            type="date"
            dir="ltr"
            value={date}
            min={toISODate(new Date())}
            onChange={(event) => setDate(event.target.value)}
          />
          {examDay !== null && (
            <FieldDescription>
              {t("examDayHint", { day: tDays(DAY_KEYS[examDay]) })}
            </FieldDescription>
          )}
        </Field>

        {suggestions.length > 0 && (
          <Field>
            <FieldLabel>{t("nextAvailableDates")}</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  size="sm"
                  variant={suggestion === date ? "default" : "outline"}
                  onClick={() => setDate(suggestion)}
                >
                  <CalendarDays className="size-4" />
                  {formatDate(suggestion, locale, { day: "2-digit", month: "short" })}
                </Button>
              ))}
            </div>
          </Field>
        )}
      </FieldGroup>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={create.isPending}
        >
          {tc("cancel")}
        </Button>
        <Button onClick={onSubmit} disabled={!date || create.isPending}>
          {create.isPending && <Spinner />}
          {t("createExam")}
        </Button>
      </DialogFooter>
    </>
  );
}
