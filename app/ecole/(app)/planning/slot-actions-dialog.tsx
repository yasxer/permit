"use client";

import {
  Ban,
  CalendarCheck,
  Check,
  CircleSlash,
  RotateCcw,
  User,
} from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { useStudentFiles } from "@/hooks/use-enrollments";
import {
  useBookSlot,
  useCancelSlot,
  useReleaseSlot,
  type SlotWithStudent,
} from "@/hooks/use-planning";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Everything a school can do to one slot: put a candidate on it, take them
 * off, close it, or reopen it.
 *
 * The candidate app will let candidates book their own slots; this is the
 * counter-side of the same operation, and the one that carries the whole flow
 * while the app does not exist.
 */
export function SlotActionsDialog({
  slot,
  schoolId,
  onOpenChange,
}: {
  slot: SlotWithStudent | null;
  schoolId: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={slot !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {slot && (
          <SlotActions
            slot={slot}
            schoolId={schoolId}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SlotActions({
  slot,
  schoolId,
  onDone,
}: {
  slot: SlotWithStudent;
  schoolId: string;
  onDone: () => void;
}) {
  const t = useTranslations("ecole.planning");
  const tc = useTranslations("common");
  const tStatus = useTranslations("status");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const book = useBookSlot();
  const release = useReleaseSlot();
  const cancel = useCancelSlot();

  const [selected, setSelected] = useState<string | null>(null);

  // Only active files can take a slot; a finished or rejected one cannot.
  const { data: students = [], isPending } = useStudentFiles(schoolId, "active");
  const busy = book.isPending || release.isPending || cancel.isPending;

  const title = t("slotOn", {
    date: formatDate(slot.slot_date, locale),
    time: formatTime(slot.start_time),
  });

  async function onBook() {
    if (!selected) return;
    try {
      await book.mutateAsync({ slotId: slot.id, enrollmentId: selected });
      toast.success(t("slotBooked"));
      onDone();
    } catch (error) {
      // 23505 is `slots_one_booking_per_candidate_time`.
      const code = (error as { code?: string })?.code;
      toast.error(code === "23505" ? t("candidateBusy") : tErrors("generic"));
    }
  }

  async function run(
    action: () => Promise<unknown>,
    message: string,
  ): Promise<void> {
    try {
      await action();
      toast.success(message);
      onDone();
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {t(slot.lesson_type === "code" ? "code" : "conduite")} ·{" "}
          {tStatus(slot.status)}
        </DialogDescription>
      </DialogHeader>

      {slot.status === "booked" ? (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4">
          <User className="size-4 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t("bookedBy")}</p>
            <p className="truncate text-sm font-medium">
              {slot.enrollment?.candidate?.full_name ?? "—"}
            </p>
          </div>
        </div>
      ) : slot.status === "available" ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("selectStudent")}</p>
          <Command className="rounded-xl border">
            <CommandInput placeholder={t("searchStudent")} />
            <CommandList className="max-h-56">
              <CommandEmpty>
                {isPending ? tc("loading") : t("noActiveStudents")}
              </CommandEmpty>
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  // The id keeps the value unique — cmdk collapses two items
                  // that share one, and two candidates can share a name.
                  value={`${student.candidate_name ?? ""} ${student.candidate_phone ?? ""} ${student.id}`}
                  onSelect={() => setSelected(student.id)}
                  // Not `data-selected`: cmdk owns that one for the keyboard
                  // cursor, which is a different thing from the school's pick.
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
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("reopenSlot")}</p>
      )}

      <DialogFooter className="mt-6 gap-2 sm:flex-col sm:items-stretch">
        {slot.status === "available" && (
          <Button disabled={!selected || busy} onClick={onBook}>
            {book.isPending ? <Spinner /> : <CalendarCheck className="size-4" />}
            {t("bookSlot")}
          </Button>
        )}

        {slot.status === "booked" && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              run(() => release.mutateAsync({ id: slot.id }), t("slotReleased"))
            }
          >
            {release.isPending ? <Spinner /> : <CircleSlash className="size-4" />}
            {t("releaseSlot")}
          </Button>
        )}

        {slot.status === "cancelled" ? (
          <Button
            disabled={busy}
            onClick={() =>
              run(() => release.mutateAsync({ id: slot.id }), t("slotReleased"))
            }
          >
            {release.isPending ? <Spinner /> : <RotateCcw className="size-4" />}
            {t("reopenSlot")}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={busy}
            onClick={() =>
              run(() => cancel.mutateAsync({ id: slot.id }), t("slotCancelled"))
            }
          >
            {cancel.isPending ? <Spinner /> : <Ban className="size-4" />}
            {t("markCancelled")}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
