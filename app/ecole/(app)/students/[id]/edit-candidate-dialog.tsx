"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateCandidate } from "@/hooks/use-candidates";
import type { BloodGroup, StudentFileRow } from "@/types";

/** Algerian numbers: 0X XX XX XX XX, optionally with a +213 prefix. */
const PHONE_RE = /^(?:\+213|0)\s?[1-9](?:[\s.-]?\d){8}$/;

const BLOOD_GROUPS: readonly [BloodGroup, ...BloodGroup[]] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

function schema(t: (key: string, values?: Record<string, number>) => string) {
  return z.object({
    full_name: z.string().trim().min(3, { message: t("min", { count: 3 }) }),
    full_name_fr: z.string().trim().max(120, { message: t("max", { count: 120 }) }),
    phone: z.string().trim().regex(PHONE_RE, { message: t("phone") }),
    birthdate: z.string().min(1, { message: t("required") }),
    birth_place: z.string().trim().min(2, { message: t("min", { count: 2 }) }),
    nationality: z.string().trim().min(2, { message: t("min", { count: 2 }) }),
    blood_group: z.enum(BLOOD_GROUPS, { message: t("selectOne") }),
    address: z
      .string()
      .trim()
      .min(2, { message: t("min", { count: 2 }) })
      .max(200, { message: t("max", { count: 200 }) }),
  });
}

type Values = z.infer<ReturnType<typeof schema>>;

/**
 * The candidate has no app to correct their own file from, so the school
 * holds it. Scoped by `school_update_candidate` to its own candidates.
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
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema(tv)),
    defaultValues: {
      full_name: file.candidate_name ?? "",
      full_name_fr: file.candidate_name_fr ?? "",
      phone: file.candidate_phone ?? "",
      birthdate: file.candidate_birthdate ?? "",
      birth_place: file.candidate_birth_place ?? "",
      nationality: file.candidate_nationality ?? t("nationalityDefault"),
      blood_group: file.candidate_blood_group ?? undefined,
      address: file.candidate_address ?? "",
    },
  });

  const bloodGroup = useWatch({ control, name: "blood_group" });

  async function onSubmit(values: Values) {
    try {
      await update.mutateAsync({
        candidate_id: file.candidate_id,
        full_name: values.full_name,
        full_name_fr: values.full_name_fr || undefined,
        phone: values.phone,
        birthdate: values.birthdate,
        birth_place: values.birth_place,
        nationality: values.nationality,
        blood_group: values.blood_group,
        address: values.address,
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.full_name}>
              <FieldLabel htmlFor="edit_full_name">{t("fullName")}</FieldLabel>
              <Input
                id="edit_full_name"
                autoFocus
                dir="rtl"
                aria-invalid={!!errors.full_name}
                {...register("full_name")}
              />
              <FieldError
                errors={errors.full_name ? [errors.full_name] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.full_name_fr}>
              <FieldLabel htmlFor="edit_full_name_fr">{t("fullNameFr")}</FieldLabel>
              <Input
                id="edit_full_name_fr"
                dir="ltr"
                aria-invalid={!!errors.full_name_fr}
                {...register("full_name_fr")}
              />
              <FieldDescription>{tc("optional")}</FieldDescription>
              <FieldError
                errors={errors.full_name_fr ? [errors.full_name_fr] : undefined}
              />
            </Field>
          </div>

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

            <Field data-invalid={!!errors.birthdate}>
              <FieldLabel htmlFor="edit_birthdate">{t("birthdate")}</FieldLabel>
              <Input
                id="edit_birthdate"
                type="date"
                dir="ltr"
                aria-invalid={!!errors.birthdate}
                {...register("birthdate")}
              />
              <FieldError
                errors={errors.birthdate ? [errors.birthdate] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.birth_place}>
              <FieldLabel htmlFor="edit_birth_place">{t("birthPlace")}</FieldLabel>
              <Input
                id="edit_birth_place"
                aria-invalid={!!errors.birth_place}
                {...register("birth_place")}
              />
              <FieldError
                errors={errors.birth_place ? [errors.birth_place] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.nationality}>
              <FieldLabel htmlFor="edit_nationality">{t("nationality")}</FieldLabel>
              <Input
                id="edit_nationality"
                aria-invalid={!!errors.nationality}
                {...register("nationality")}
              />
              <FieldError
                errors={errors.nationality ? [errors.nationality] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.blood_group}>
              <FieldLabel htmlFor="edit_blood_group">{t("bloodGroup")}</FieldLabel>
              <Select
                value={bloodGroup ?? ""}
                onValueChange={(value) =>
                  setValue("blood_group", value as BloodGroup, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  id="edit_blood_group"
                  aria-invalid={!!errors.blood_group}
                >
                  <SelectValue placeholder={tc("select")} />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      <span dir="ltr" className="font-mono font-semibold">
                        {group}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                errors={errors.blood_group ? [errors.blood_group] : undefined}
              />
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
