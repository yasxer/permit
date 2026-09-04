"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { UploadInput } from "@/components/shared/upload-input";
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
import { useUpdateCandidate } from "@/hooks/use-candidates";
import type { StudentFileRow } from "@/types";

/** Algerian numbers: 0X XX XX XX XX, optionally with a +213 prefix. */
const PHONE_RE = /^(?:\+213|0)\s?[1-9](?:[\s.-]?\d){8}$/;

function schema(t: (key: string, values?: Record<string, number>) => string) {
  return z.object({
    full_name: z.string().trim().min(3, { message: t("min", { count: 3 }) }),
    phone: z.string().trim().regex(PHONE_RE, { message: t("phone") }),
    birthdate: z.string(),
    address: z.string().trim().max(200, { message: t("max", { count: 200 }) }),
  });
}

type Values = z.infer<ReturnType<typeof schema>>;

/**
 * The candidate has no app to correct their own details from, so the school
 * holds them. Scoped by `school_update_candidate` to its own candidates.
 */
export function EditCandidateDialog({
  open,
  onOpenChange,
  file,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: StudentFileRow;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <EditForm file={file} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  file,
  onDone,
}: {
  file: StudentFileRow;
  onDone: () => void;
}) {
  const t = useTranslations("ecole.students");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tErrors = useTranslations("errors");

  const update = useUpdateCandidate();
  const [photoUrl, setPhotoUrl] = useState(file.candidate_photo_url);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema(tv)),
    defaultValues: {
      full_name: file.candidate_name ?? "",
      phone: file.candidate_phone ?? "",
      birthdate: file.candidate_birthdate ?? "",
      address: file.candidate_address ?? "",
    },
  });

  async function onSubmit(values: Values) {
    try {
      await update.mutateAsync({
        candidate_id: file.candidate_id,
        full_name: values.full_name,
        phone: values.phone,
        address: values.address,
        birthdate: values.birthdate,
        photo_url: photoUrl,
      });
      toast.success(t("candidateUpdated"));
      onDone();
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("editCandidate")}</DialogTitle>
        <DialogDescription>{t("personalInfo")}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.full_name}>
            <FieldLabel htmlFor="edit_full_name">{t("fullName")}</FieldLabel>
            <Input
              id="edit_full_name"
              autoFocus
              aria-invalid={!!errors.full_name}
              {...register("full_name")}
            />
            <FieldError errors={errors.full_name ? [errors.full_name] : undefined} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="edit_phone">{t("phone")}</FieldLabel>
              <Input
                id="edit_phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              <FieldError errors={errors.phone ? [errors.phone] : undefined} />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit_birthdate">{t("birthdate")}</FieldLabel>
              <Input
                id="edit_birthdate"
                type="date"
                dir="ltr"
                {...register("birthdate")}
              />
              <FieldDescription>{tc("optional")}</FieldDescription>
            </Field>
          </div>

          <Field data-invalid={!!errors.address}>
            <FieldLabel htmlFor="edit_address">{t("address")}</FieldLabel>
            <Input
              id="edit_address"
              aria-invalid={!!errors.address}
              {...register("address")}
            />
            <FieldError errors={errors.address ? [errors.address] : undefined} />
          </Field>

          <Field>
            <FieldLabel>{t("photo")}</FieldLabel>
            <UploadInput
              value={photoUrl}
              onChange={setPhotoUrl}
              kind="candidates"
              disabled={isSubmitting}
            />
          </Field>
        </FieldGroup>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
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
    </>
  );
}
