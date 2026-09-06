"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { UploadInput } from "@/components/shared/upload-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useCategories } from "@/hooks/use-categories";
import {
  useMySchoolPrices,
  useSaveSchoolProfile,
  useWilayas,
} from "@/hooks/use-school-profile";
import type { Locale } from "@/i18n/config";
import { DAY_KEYS, WORK_WEEK_DOW } from "@/lib/format";
import type { CategoryRow, SchoolRow, WilayaRow } from "@/types";

/** Algerian numbers: 0X XX XX XX XX, optionally with a +213 prefix. */
const PHONE_RE = /^(?:\+213|0)\s?[1-9](?:[\s.-]?\d){8}$/;

/** Empty string means "not offered"; anything else must parse as >= 0. */
const priceField = (message: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
      { message },
    );

function schema(t: (key: string, values?: Record<string, string | number>) => string) {
  return z.object({
    name: z.string().trim().min(2, { message: t("min", { count: 2 }) }),
    director_name: z.string().trim().min(2, { message: t("min", { count: 2 }) }),
    phone: z.string().trim().regex(PHONE_RE, { message: t("phone") }),
    address: z.string().trim().min(4, { message: t("min", { count: 4 }) }),
    wilaya_code: z.string().min(1, { message: t("selectOne") }),
    teaching_car: z.string().trim().min(2, { message: t("min", { count: 2 }) }),
    exam_day: z.string().min(1, { message: t("selectOne") }),
    photo_url: z.string().nullable(),
    perf_price_per_hour: priceField(t("positiveNumber")).refine(
      (value) => value !== "",
      { message: t("required") },
    ),
    success_passed: priceField(t("positiveNumber")),
    success_failed: priceField(t("positiveNumber")),
    prices: z.record(z.string(), priceField(t("positiveNumber"))),
  });
}

type Values = z.infer<ReturnType<typeof schema>>;

function categoryLabel(category: CategoryRow, locale: string): string {
  const byLocale: Record<Locale, string> = {
    ar: category.label_ar,
    fr: category.label_fr,
    en: category.label_en,
  };
  return byLocale[locale as Locale] ?? category.label_fr;
}

function wilayaLabel(wilaya: WilayaRow, locale: string): string {
  const byLocale: Record<Locale, string> = {
    ar: wilaya.name_ar,
    fr: wilaya.name_fr,
    en: wilaya.name_en,
  };
  return byLocale[locale as Locale] ?? wilaya.name_fr;
}

export function CompleteProfileForm({ school }: { school: SchoolRow }) {
  const t = useTranslations("ecole.profile");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tDays = useTranslations("days");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();

  const { data: categories = [] } = useCategories();
  const { data: wilayas = [] } = useWilayas();
  const { data: existingPrices } = useMySchoolPrices(school.id);
  const save = useSaveSchoolProfile(school.id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema(tv)),
    defaultValues: {
      name: school.name ?? "",
      director_name: school.director_name ?? "",
      phone: school.phone ?? "",
      address: school.address ?? "",
      wilaya_code: school.wilaya_code ? String(school.wilaya_code) : "",
      teaching_car: school.teaching_car ?? "",
      exam_day: school.exam_day !== null ? String(school.exam_day) : "",
      photo_url: school.photo_url,
      perf_price_per_hour:
        school.perf_price_per_hour !== null ? String(school.perf_price_per_hour) : "",
      success_passed: String(school.success_passed),
      success_failed: String(school.success_failed),
      prices: {},
    },
  });

  const photoUrl = useWatch({ control, name: "photo_url" });
  const wilayaCode = useWatch({ control, name: "wilaya_code" });
  const examDay = useWatch({ control, name: "exam_day" });

  const priceDefaults = useMemo(() => {
    const map: Record<string, string> = {};
    for (const category of categories) map[category.id] = "";
    for (const row of existingPrices ?? []) {
      map[row.category_id] = String(row.price);
    }
    return map;
  }, [categories, existingPrices]);

  // Prices arrive after the form mounts (two queries), so seed them once the
  // catalogue and the saved rows are both in.
  useEffect(() => {
    if (categories.length === 0) return;
    setValue("prices", priceDefaults);
  }, [categories.length, priceDefaults, setValue]);

  async function onSubmit(values: Values) {
    const prices: Record<string, number | null> = {};
    for (const [categoryId, raw] of Object.entries(values.prices)) {
      prices[categoryId] = raw === "" ? null : Number(raw);
    }

    if (Object.values(prices).every((price) => price === null)) {
      setError("prices", { message: t("atLeastOnePrice") });
      return;
    }

    try {
      await save.mutateAsync({
        name: values.name,
        director_name: values.director_name,
        phone: values.phone,
        address: values.address,
        wilaya_code: Number(values.wilaya_code),
        teaching_car: values.teaching_car,
        exam_day: Number(values.exam_day),
        photo_url: values.photo_url,
        perf_price_per_hour: Number(values.perf_price_per_hour),
        success_passed: Number(values.success_passed || 0),
        success_failed: Number(values.success_failed || 0),
        prices,
      });
      toast.success(t("saved"));
      reset(values);
      // The layout gate reads `profile_completed`, which the trigger has just
      // flipped — a server round trip is what unlocks the rest of the app.
      router.replace("/ecole/dashboard");
      router.refresh();
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">{t("schoolName")}</FieldLabel>
                <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>

              <Field data-invalid={!!errors.director_name}>
                <FieldLabel htmlFor="director_name">{t("directorName")}</FieldLabel>
                <Input
                  id="director_name"
                  aria-invalid={!!errors.director_name}
                  {...register("director_name")}
                />
                <FieldError
                  errors={errors.director_name ? [errors.director_name] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="phone">{t("phone")}</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  inputMode="tel"
                  placeholder="0555 12 34 56"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                <FieldError errors={errors.phone ? [errors.phone] : undefined} />
              </Field>

              <Field data-invalid={!!errors.wilaya_code}>
                <FieldLabel htmlFor="wilaya_code">{t("wilaya")}</FieldLabel>
                <Select
                  value={wilayaCode}
                  onValueChange={(value) =>
                    setValue("wilaya_code", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="wilaya_code" aria-invalid={!!errors.wilaya_code}>
                    <SelectValue placeholder={tc("select")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {wilayas.map((wilaya) => (
                      <SelectItem key={wilaya.code} value={String(wilaya.code)}>
                        <span className="tabular-nums text-muted-foreground">
                          {String(wilaya.code).padStart(2, "0")}
                        </span>
                        {" · "}
                        {wilayaLabel(wilaya, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError
                  errors={errors.wilaya_code ? [errors.wilaya_code] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.address} className="sm:col-span-2">
                <FieldLabel htmlFor="address">{t("address")}</FieldLabel>
                <Input
                  id="address"
                  aria-invalid={!!errors.address}
                  {...register("address")}
                />
                <FieldError errors={errors.address ? [errors.address] : undefined} />
              </Field>

              <Field data-invalid={!!errors.teaching_car}>
                <FieldLabel htmlFor="teaching_car">{t("teachingCar")}</FieldLabel>
                <Input
                  id="teaching_car"
                  placeholder="Renault Symbol"
                  aria-invalid={!!errors.teaching_car}
                  {...register("teaching_car")}
                />
                <FieldError
                  errors={errors.teaching_car ? [errors.teaching_car] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.exam_day}>
                <FieldLabel htmlFor="exam_day">{t("examDay")}</FieldLabel>
                <Select
                  value={examDay}
                  onValueChange={(value) =>
                    setValue("exam_day", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="exam_day" aria-invalid={!!errors.exam_day}>
                    <SelectValue placeholder={tc("select")} />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_WEEK_DOW.map((dow) => (
                      <SelectItem key={dow} value={String(dow)}>
                        {tDays(DAY_KEYS[dow])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={errors.exam_day ? [errors.exam_day] : undefined} />
              </Field>
            </div>

            <Field>
              <FieldLabel>{t("photo")}</FieldLabel>
              <FieldDescription>{t("photoHint")}</FieldDescription>
              <div className="max-w-sm">
                <UploadInput
                  kind="schools"
                  value={photoUrl}
                  onChange={(url) =>
                    setValue("photo_url", url, { shouldDirty: true })
                  }
                />
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("prices")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.prices}>
              <FieldDescription>{t("priceOptionalHint")}</FieldDescription>
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-3">
                    <label
                      htmlFor={`price-${category.id}`}
                      className="min-w-0 flex-1 text-sm"
                    >
                      <span className="font-mono font-semibold">{category.code}</span>
                      <span className="ms-2 text-muted-foreground">
                        {categoryLabel(category, locale)}
                      </span>
                    </label>
                    <Input
                      id={`price-${category.id}`}
                      type="number"
                      min={0}
                      step={100}
                      dir="ltr"
                      inputMode="numeric"
                      placeholder={t("pricePlaceholder")}
                      className="w-36 shrink-0 tabular-nums"
                      {...register(`prices.${category.id}` as const)}
                    />
                  </div>
                ))}
              </div>
              <FieldError errors={errors.prices ? [errors.prices] : undefined} />
            </Field>

            <Field data-invalid={!!errors.perf_price_per_hour} className="max-w-xs">
              <FieldLabel htmlFor="perf_price_per_hour">
                {t("perfPricePerHour")}
              </FieldLabel>
              <Input
                id="perf_price_per_hour"
                type="number"
                min={0}
                step={100}
                dir="ltr"
                inputMode="numeric"
                className="tabular-nums"
                aria-invalid={!!errors.perf_price_per_hour}
                {...register("perf_price_per_hour")}
              />
              <FieldError
                errors={
                  errors.perf_price_per_hour ? [errors.perf_price_per_hour] : undefined
                }
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("successStats")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FieldDescription>{t("successHint")}</FieldDescription>
            <div className="grid max-w-md gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.success_passed}>
                <FieldLabel htmlFor="success_passed">{t("passedCount")}</FieldLabel>
                <Input
                  id="success_passed"
                  type="number"
                  min={0}
                  dir="ltr"
                  inputMode="numeric"
                  className="tabular-nums"
                  {...register("success_passed")}
                />
                <FieldError
                  errors={errors.success_passed ? [errors.success_passed] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.success_failed}>
                <FieldLabel htmlFor="success_failed">{t("failedCount")}</FieldLabel>
                <Input
                  id="success_failed"
                  type="number"
                  min={0}
                  dir="ltr"
                  inputMode="numeric"
                  className="tabular-nums"
                  {...register("success_failed")}
                />
                <FieldError
                  errors={errors.success_failed ? [errors.success_failed] : undefined}
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? tc("saving") : tc("save")}
        </Button>
      </div>
    </form>
  );
}
