"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAddPayment } from "@/hooks/use-payments";
import { formatCurrency } from "@/lib/format";

function schema(t: (key: string) => string) {
  return z.object({
    amount: z
      .string()
      .trim()
      .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
        message: t("positiveNumber"),
      }),
    note: z.string().trim().max(200),
  });
}

type Values = z.infer<ReturnType<typeof schema>>;

export function AddPaymentDialog({
  open,
  onOpenChange,
  enrollmentId,
  remaining,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentId: string;
  remaining: number;
}) {
  const t = useTranslations("ecole.students");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const addPayment = useAddPayment();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema(tv)),
    defaultValues: { amount: "", note: "" },
  });

  useEffect(() => {
    if (open) reset({ amount: "", note: "" });
  }, [open, reset]);

  async function onSubmit(values: Values) {
    const amount = Number(values.amount);

    // A warning, not a hard block: a school may legitimately record an
    // overpayment, but it is almost always a typo.
    if (amount > remaining && remaining > 0) {
      setError("amount", { message: t("overpaid") });
      return;
    }

    try {
      await addPayment.mutateAsync({ enrollmentId, amount, note: values.note });
      toast.success(t("paymentAdded"));
      onOpenChange(false);
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addPayment")}</DialogTitle>
          <DialogDescription>
            {t("amountRemaining")}: {formatCurrency(remaining, locale)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.amount}>
              <FieldLabel htmlFor="amount">{t("amount")}</FieldLabel>
              <Input
                id="amount"
                type="number"
                min={0}
                step={100}
                dir="ltr"
                inputMode="numeric"
                autoFocus
                className="tabular-nums"
                aria-invalid={!!errors.amount}
                {...register("amount")}
              />
              <FieldError errors={errors.amount ? [errors.amount] : undefined} />
            </Field>

            <Field data-invalid={!!errors.note}>
              <FieldLabel htmlFor="note">{t("note")}</FieldLabel>
              <Textarea
                id="note"
                rows={2}
                placeholder={t("notePlaceholder")}
                {...register("note")}
              />
              <FieldDescription>{tc("optional")}</FieldDescription>
              <FieldError errors={errors.note ? [errors.note] : undefined} />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
