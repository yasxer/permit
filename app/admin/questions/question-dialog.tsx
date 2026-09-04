"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useSaveQuestion, type QuestionWithOptions } from "@/hooks/use-questions";
import { locales, localeLabels } from "@/i18n/config";
import type { ContentLang, QuestionType } from "@/types";

const QUESTION_TYPES: QuestionType[] = ["question", "plaque", "carrefour"];

function schema(t: (key: string, values?: Record<string, string | number>) => string) {
  return z.object({
    type: z.enum(["question", "plaque", "carrefour"]),
    lang: z.enum(["ar", "fr", "en"]),
    body: z.string().trim().min(3, { message: t("min", { count: 3 }) }),
    image_url: z.string().nullable(),
    // The radio group stores the winning index as a string.
    correctIndex: z.string().min(1, { message: t("markCorrectOption") }),
    options: z
      .array(z.object({ label: z.string().trim().min(1, { message: t("required") }) }))
      .min(2, { message: t("atLeastOneOption") }),
  });
}

type Values = z.infer<ReturnType<typeof schema>>;

const EMPTY: Values = {
  type: "question",
  lang: "fr",
  body: "",
  image_url: null,
  correctIndex: "0",
  options: [{ label: "" }, { label: "" }],
};

export function QuestionDialog({
  open,
  onOpenChange,
  question,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: QuestionWithOptions | null;
  defaultType: QuestionType;
}) {
  const t = useTranslations("admin.questions");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tErrors = useTranslations("errors");

  const save = useSaveQuestion();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema(tv)),
    defaultValues: { ...EMPTY, type: defaultType },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  // `useWatch` subscribes through `control`; the `watch()` closure returned by
  // useForm cannot be memoized and trips the React Compiler.
  const imageUrl = useWatch({ control, name: "image_url" });
  const correctIndex = useWatch({ control, name: "correctIndex" });
  const questionType = useWatch({ control, name: "type" });
  const questionLang = useWatch({ control, name: "lang" });

  useEffect(() => {
    if (!open) return;
    if (question) {
      const correct = question.options.findIndex((option) => option.is_correct);
      reset({
        type: question.type,
        lang: question.lang,
        body: question.body,
        image_url: question.image_url,
        correctIndex: String(correct >= 0 ? correct : 0),
        options: question.options.map((option) => ({ label: option.label })),
      });
    } else {
      reset({ ...EMPTY, type: defaultType });
    }
  }, [open, question, defaultType, reset]);

  async function onSubmit(values: Values) {
    const correct = Number(values.correctIndex);
    try {
      await save.mutateAsync({
        id: question?.id,
        type: values.type,
        lang: values.lang,
        body: values.body,
        image_url: values.image_url,
        options: values.options.map((option, index) => ({
          label: option.label,
          is_correct: index === correct,
        })),
      });
      toast.success(question ? t("updated") : t("created"));
      onOpenChange(false);
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{question ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="type">{t("type")}</FieldLabel>
                <Select
                  value={questionType}
                  onValueChange={(value) =>
                    setValue("type", value as QuestionType, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(
                          value === "question"
                            ? "tabQuestions"
                            : value === "plaque"
                              ? "tabPlaques"
                              : "tabCarrefours",
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="lang">{t("language")}</FieldLabel>
                <Select
                  value={questionLang}
                  onValueChange={(value) =>
                    setValue("lang", value as ContentLang, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="lang">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locales.map((value) => (
                      <SelectItem key={value} value={value}>
                        {localeLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field data-invalid={!!errors.body}>
              <FieldLabel htmlFor="body">{t("question")}</FieldLabel>
              <Textarea
                id="body"
                rows={3}
                aria-invalid={!!errors.body}
                {...register("body")}
              />
              <FieldError errors={errors.body ? [errors.body] : undefined} />
            </Field>

            <Field>
              <FieldLabel>{t("image")}</FieldLabel>
              <UploadInput
                kind="questions"
                value={imageUrl}
                onChange={(url) => setValue("image_url", url, { shouldDirty: true })}
              />
            </Field>

            <Field data-invalid={!!errors.options || !!errors.correctIndex}>
              <FieldLabel>{t("options")}</FieldLabel>
              <FieldDescription>{t("correctAnswer")}</FieldDescription>

              <RadioGroup
                value={correctIndex}
                onValueChange={(value) =>
                  setValue("correctIndex", value, { shouldDirty: true })
                }
                className="gap-2"
              >
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={String(index)}
                      id={`correct-${index}`}
                      aria-label={t("correctAnswer")}
                    />
                    <Input
                      aria-label={`${t("options")} ${index + 1}`}
                      aria-invalid={!!errors.options?.[index]?.label}
                      {...register(`options.${index}.label` as const)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={tc("delete")}
                      disabled={fields.length <= 2}
                      onClick={() => remove(index)}
                      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ label: "" })}
                className="mt-1 w-fit"
              >
                <Plus className="size-4" />
                {t("addOption")}
              </Button>

              <FieldError
                errors={[
                  errors.options?.root ?? errors.options,
                  errors.correctIndex,
                  ...fields.map((_, index) => errors.options?.[index]?.label),
                ].filter(Boolean)}
              />
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
