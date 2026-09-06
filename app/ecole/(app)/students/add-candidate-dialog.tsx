"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, KeyRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import {
  CandidateError,
  useCreateCandidate,
  type NewCandidateResult,
} from "@/hooks/use-candidates";
import { useCategories } from "@/hooks/use-categories";
import { useMySchoolPrices } from "@/hooks/use-school-profile";
import type { Locale } from "@/i18n/config";
import { formatCurrency } from "@/lib/format";
import type { BloodGroup, CategoryRow } from "@/types";

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

/** Algerian numbers: 0X XX XX XX XX, optionally with a +213 prefix. */
const PHONE_RE = /^(?:\+213|0)\s?[1-9](?:[\s.-]?\d){8}$/;

function categoryLabel(category: CategoryRow, locale: string): string {
  const byLocale: Record<Locale, string> = {
    ar: category.label_ar,
    fr: category.label_fr,
    en: category.label_en,
  };
  return byLocale[locale as Locale] ?? category.label_fr;
}

function schema(t: (key: string, values?: Record<string, number>) => string) {
  return z.object({
    full_name: z.string().trim().min(3, { message: t("min", { count: 3 }) }),
    phone: z.string().trim().regex(PHONE_RE, { message: t("phone") }),
    category_id: z.string().min(1, { message: t("selectOne") }),
    birthdate: z.string().min(1, { message: t("required") }),
    birth_place: z.string().trim().min(2, { message: t("min", { count: 2 }) }),
    nationality: z.string().trim().min(2, { message: t("min", { count: 2 }) }),
    blood_group: z.enum(BLOOD_GROUPS, { message: t("selectOne") }),
    address: z
      .string()
      .trim()
      .min(2, { message: t("min", { count: 2 }) })
      .max(200, { message: t("max", { count: 200 }) }),
    // The four the counter can do without: the Latin spelling is for printed
    // forms, and a walk-in candidate rarely has an e-mail address of their own.
    full_name_fr: z.string().trim().max(120, { message: t("max", { count: 120 }) }),
    email: z.union([z.email({ message: t("email") }), z.literal("")]),
    password: z.union([
      z.string().min(6, { message: t("passwordMin") }),
      z.literal(""),
    ]),
  });
}

type Values = z.infer<ReturnType<typeof schema>>;

export function AddCandidateDialog({
  open,
  onOpenChange,
  schoolId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[47.5rem]">
        {/* Radix unmounts the content on close, so the form re-initialises on
            every open — no effect needed to reset it. */}
        <CandidateForm schoolId={schoolId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CandidateForm({
  schoolId,
  onDone,
}: {
  schoolId: string;
  onDone: () => void;
}) {
  const t = useTranslations("ecole.students");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const { data: categories = [] } = useCategories();
  const { data: prices = [] } = useMySchoolPrices(schoolId);
  const create = useCreateCandidate();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [result, setResult] = useState<NewCandidateResult | null>(null);

  // A category the school does not price cannot be enrolled into: the file
  // would carry a zero total and show nothing owed.
  const offered = categories.filter((category) =>
    prices.some((price) => price.category_id === category.id),
  );
  const priceOf = (categoryId: string) =>
    prices.find((price) => price.category_id === categoryId)?.price ?? 0;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema(tv)),
    defaultValues: {
      full_name: "",
      phone: "",
      category_id: "",
      email: "",
      password: "",
      birthdate: "",
      address: "",
    },
  });

  // `useWatch` subscribes through `control`; the `watch()` closure returned by
  // `useForm` cannot be memoized, and the React Compiler refuses the component.
  const categoryId = useWatch({ control, name: "category_id" });
  const bloodGroup = useWatch({ control, name: "blood_group" });

  async function onSubmit(values: Values) {
    try {
      const created = await create.mutateAsync({
        full_name: values.full_name,
        full_name_fr: values.full_name_fr || undefined,
        phone: values.phone,
        category_id: values.category_id,
        birthdate: values.birthdate,
        birth_place: values.birth_place,
        nationality: values.nationality,
        blood_group: values.blood_group,
        address: values.address,
        email: values.email || undefined,
        password: values.password || undefined,
        photo_url: photoUrl,
      });
      toast.success(t("candidateAdded"));
      setResult(created);
    } catch (error) {
      const reason = error instanceof CandidateError ? error.reason : "generic";
      if (reason === "duplicate_file") {
        setError("category_id", { message: t("duplicateFile") });
      } else if (reason === "email_taken") {
        setError("email", { message: t("emailTaken") });
      } else {
        toast.error(tErrors("generic"));
      }
    }
  }

  if (result) {
    return <Credentials result={result} onDone={onDone} />;
  }

  if (offered.length === 0) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t("addCandidate")}</DialogTitle>
          <DialogDescription>{t("noPricedCategory")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onDone}>
            {tc("close")}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("addCandidate")}</DialogTitle>
        <DialogDescription>{t("addCandidateHint")}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.full_name}>
              <FieldLabel htmlFor="full_name">{t("fullName")}</FieldLabel>
              <Input
                id="full_name"
                autoFocus
                dir="rtl"
                autoComplete="off"
                aria-invalid={!!errors.full_name}
                {...register("full_name")}
              />
              <FieldError
                errors={errors.full_name ? [errors.full_name] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.full_name_fr}>
              <FieldLabel htmlFor="full_name_fr">{t("fullNameFr")}</FieldLabel>
              <Input
                id="full_name_fr"
                dir="ltr"
                autoComplete="off"
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
              <FieldLabel htmlFor="phone">{t("phone")}</FieldLabel>
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                placeholder="05 55 55 55 55"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              <FieldError errors={errors.phone ? [errors.phone] : undefined} />
            </Field>

            <Field data-invalid={!!errors.birthdate}>
              <FieldLabel htmlFor="birthdate">{t("birthdate")}</FieldLabel>
              <Input
                id="birthdate"
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
              <FieldLabel htmlFor="birth_place">{t("birthPlace")}</FieldLabel>
              <Input
                id="birth_place"
                aria-invalid={!!errors.birth_place}
                {...register("birth_place")}
              />
              <FieldError
                errors={errors.birth_place ? [errors.birth_place] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.nationality}>
              <FieldLabel htmlFor="nationality">{t("nationality")}</FieldLabel>
              <Input
                id="nationality"
                aria-invalid={!!errors.nationality}
                {...register("nationality")}
              />
              <FieldError
                errors={errors.nationality ? [errors.nationality] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.blood_group}>
              <FieldLabel htmlFor="blood_group">{t("bloodGroup")}</FieldLabel>
              <Select
                value={bloodGroup ?? ""}
                onValueChange={(value) =>
                  setValue("blood_group", value as BloodGroup, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="blood_group" aria-invalid={!!errors.blood_group}>
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

          <Field data-invalid={!!errors.category_id}>
            <FieldLabel htmlFor="category_id">{t("category")}</FieldLabel>
            <Select
              value={categoryId}
              onValueChange={(value) =>
                setValue("category_id", value, { shouldValidate: true })
              }
            >
              <SelectTrigger id="category_id" aria-invalid={!!errors.category_id}>
                <SelectValue placeholder={tc("select")} />
              </SelectTrigger>
              <SelectContent>
                {offered.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="font-mono font-semibold">{category.code}</span>
                    {" · "}
                    {categoryLabel(category, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryId && !errors.category_id && (
              <FieldDescription>
                {t("totalPrice")}: {formatCurrency(priceOf(categoryId), locale)}
              </FieldDescription>
            )}
            <FieldError
              errors={errors.category_id ? [errors.category_id] : undefined}
            />
          </Field>

          <Field data-invalid={!!errors.address}>
            <FieldLabel htmlFor="address">{t("address")}</FieldLabel>
            <Input id="address" aria-invalid={!!errors.address} {...register("address")} />
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

          <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <Field data-invalid={!!errors.email} className="sm:col-span-2">
              <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
              <Input
                id="email"
                type="email"
                dir="ltr"
                autoComplete="off"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldDescription>{t("emailHint")}</FieldDescription>
              <FieldError errors={errors.email ? [errors.email] : undefined} />
            </Field>

            <Field data-invalid={!!errors.password} className="sm:col-span-2">
              <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
              <Input
                id="password"
                type="text"
                dir="ltr"
                autoComplete="off"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldDescription>{t("passwordHint")}</FieldDescription>
              <FieldError errors={errors.password ? [errors.password] : undefined} />
            </Field>
          </div>
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
            {t("addCandidate")}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/**
 * The password is generated server-side and never stored in readable form, so
 * this screen is the only chance the school has to write it down.
 */
function Credentials({
  result,
  onDone,
}: {
  result: NewCandidateResult;
  onDone: () => void;
}) {
  const t = useTranslations("ecole.students");
  const tc = useTranslations("common");
  const [copied, setCopied] = useState(false);

  const text = result.password
    ? `${result.login} / ${result.password}`
    : result.login;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t("copied"));
    } catch {
      // Clipboard access can be denied; the values stay readable on screen.
    }
  }

  return (
    <>
      <DialogHeader className="items-start gap-3">
        {/* Le rond vert dit d'abord que c'est fait ; le texte dit ensuite quoi
            en faire. Un dossier créé ne se relit pas deux fois. */}
        <span className="grid size-11 place-items-center rounded-full bg-success/13 text-success">
          <KeyRound className="size-5" aria-hidden />
        </span>
        <DialogTitle>{t("candidateAdded")}</DialogTitle>
        <DialogDescription>
          {/* La consigne complète est dans le bandeau ambre plus bas : la
              répéter ici la ferait lire deux fois, donc zéro. */}
          {result.created ? t("credentialsTitle") : t("accountReused")}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="divide-y divide-separator rounded-xl border border-border">
          <div className="flex items-baseline justify-between gap-3 px-3.5 py-3">
            <span className="text-[0.8125rem] text-muted-foreground">{t("login")}</span>
            <span dir="ltr" className="truncate font-mono text-sm">
              {result.login}
            </span>
          </div>
          {result.password && (
            <div className="flex items-baseline justify-between gap-3 px-3.5 py-3">
              <span className="text-[0.8125rem] text-muted-foreground">
                {t("password")}
              </span>
              <span dir="ltr" className="font-mono text-sm font-semibold">
                {result.password}
              </span>
            </div>
          )}
        </div>

        <Button variant="outline" className="w-full" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? t("copied") : t("copy")}
        </Button>

        {result.password && (
          <p className="rounded-xl border border-brand/40 bg-brand/12 px-3.5 py-3 text-[0.8125rem] text-warning">
            {t("credentialsHint")}
          </p>
        )}
      </div>

      <DialogFooter className="mt-6">
        <Button onClick={onDone}>{tc("close")}</Button>
      </DialogFooter>
    </>
  );
}
