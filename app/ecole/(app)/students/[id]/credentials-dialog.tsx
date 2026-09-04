"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
import { CandidateError, useUpdateCredentials } from "@/hooks/use-candidates";

function schema(t: (key: string, values?: Record<string, number>) => string) {
  return z.object({
    email: z.union([z.email({ message: t("email") }), z.literal("")]),
    password: z.union([
      z.string().min(6, { message: t("passwordMin") }),
      z.literal(""),
    ]),
  });
}

type Values = z.infer<ReturnType<typeof schema>>;

/**
 * Gives the candidate an e-mail it actually reads, or a new password after the
 * slip of paper from the counter got lost. The app's reset-by-mail flow is no
 * help when the login is a number the school made up.
 */
export function CredentialsDialog({
  open,
  onOpenChange,
  candidateId,
  currentLogin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  currentLogin: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <CredentialsForm
          candidateId={candidateId}
          currentLogin={currentLogin}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CredentialsForm({
  candidateId,
  currentLogin,
  onDone,
}: {
  candidateId: string;
  currentLogin: string | null;
  onDone: () => void;
}) {
  const t = useTranslations("ecole.students");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tErrors = useTranslations("errors");

  const update = useUpdateCredentials();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema(tv)),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: Values) {
    if (!values.email && !values.password) {
      setError("email", { message: t("nothingToChange") });
      return;
    }
    try {
      await update.mutateAsync({
        candidateId,
        email: values.email || undefined,
        password: values.password || undefined,
      });
      toast.success(t("credentialsUpdated"));
      onDone();
    } catch (error) {
      const reason = error instanceof CandidateError ? error.reason : "generic";
      if (reason === "email_taken") {
        setError("email", { message: t("emailTaken") });
      } else {
        toast.error(tErrors("generic"));
      }
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("editCredentials")}</DialogTitle>
        <DialogDescription>{t("credentialsEditHint")}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel>{t("login")}</FieldLabel>
            <p dir="ltr" className="truncate font-mono text-sm text-muted-foreground">
              {currentLogin ?? "—"}
            </p>
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="new_email">{t("email")}</FieldLabel>
            <Input
              id="new_email"
              type="email"
              dir="ltr"
              autoComplete="off"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldDescription>{tc("optional")}</FieldDescription>
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="new_password">{t("newPassword")}</FieldLabel>
            <Input
              id="new_password"
              type="text"
              dir="ltr"
              autoComplete="off"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldDescription>{tc("optional")}</FieldDescription>
            <FieldError errors={errors.password ? [errors.password] : undefined} />
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
