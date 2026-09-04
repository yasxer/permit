"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  useCreateCategory,
  useUpdateCategory,
  type CategoryInput,
} from "@/hooks/use-categories";
import type { CategoryRow } from "@/types";

function schema(t: (key: string, values?: Record<string, string | number>) => string) {
  return z.object({
    code: z
      .string()
      .trim()
      .min(1, { message: t("required") })
      .max(8, { message: t("max", { count: 8 }) }),
    label_ar: z.string().trim().min(1, { message: t("required") }),
    label_fr: z.string().trim().min(1, { message: t("required") }),
    label_en: z.string().trim().min(1, { message: t("required") }),
  });
}

type Values = z.infer<ReturnType<typeof schema>>;

const EMPTY: Values = { code: "", label_ar: "", label_fr: "", label_en: "" };

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null means "create". */
  category: CategoryRow | null;
}) {
  const t = useTranslations("admin.categories");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tErrors = useTranslations("errors");

  const create = useCreateCategory();
  const update = useUpdateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema(tv)), defaultValues: EMPTY });

  // Reopening the dialog on a different row must not keep the previous values.
  useEffect(() => {
    if (!open) return;
    reset(
      category
        ? {
            code: category.code,
            label_ar: category.label_ar,
            label_fr: category.label_fr,
            label_en: category.label_en,
          }
        : EMPTY,
    );
  }, [open, category, reset]);

  async function onSubmit(values: Values) {
    try {
      if (category) {
        await update.mutateAsync({ id: category.id, ...(values as CategoryInput) });
        toast.success(t("updated"));
      } else {
        await create.mutateAsync(values as CategoryInput);
        toast.success(t("created"));
      }
      onOpenChange(false);
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.code}>
              <FieldLabel htmlFor="code">{t("code")}</FieldLabel>
              <Input
                id="code"
                placeholder="B"
                autoCapitalize="characters"
                aria-invalid={!!errors.code}
                {...register("code")}
              />
              <FieldError errors={errors.code ? [errors.code] : undefined} />
            </Field>

            <Field data-invalid={!!errors.label_fr}>
              <FieldLabel htmlFor="label_fr">{t("labelFr")}</FieldLabel>
              <Input id="label_fr" lang="fr" dir="ltr" {...register("label_fr")} />
              <FieldError errors={errors.label_fr ? [errors.label_fr] : undefined} />
            </Field>

            <Field data-invalid={!!errors.label_ar}>
              <FieldLabel htmlFor="label_ar">{t("labelAr")}</FieldLabel>
              <Input id="label_ar" lang="ar" dir="rtl" {...register("label_ar")} />
              <FieldError errors={errors.label_ar ? [errors.label_ar] : undefined} />
            </Field>

            <Field data-invalid={!!errors.label_en}>
              <FieldLabel htmlFor="label_en">{t("labelEn")}</FieldLabel>
              <Input id="label_en" lang="en" dir="ltr" {...register("label_en")} />
              <FieldError errors={errors.label_en ? [errors.label_en] : undefined} />
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
