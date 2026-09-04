"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { authErrorKey } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validation/auth";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const tError = useTranslations();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema(tv)),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    const supabase = createClient();
    // The recovery link already exchanged its code for a session in
    // /auth/callback, so this updates the signed-in user.
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      const [namespace, key] = authErrorKey(error);
      toast.error(tError(`${namespace}.${key}`));
      return;
    }

    toast.success(t("passwordUpdated"));
    router.replace("/");
    router.refresh();
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">{t("resetTitle")}</CardTitle>
        <CardDescription>{t("resetSubtitle")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">{t("newPassword")}</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                dir="ltr"
                placeholder={t("passwordPlaceholder")}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldError
                errors={errors.password ? [errors.password] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword">
                {t("confirmPassword")}
              </FieldLabel>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                dir="ltr"
                placeholder={t("passwordPlaceholder")}
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              <FieldError
                errors={
                  errors.confirmPassword ? [errors.confirmPassword] : undefined
                }
              />
            </Field>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Spinner /> : <KeyRound />}
              {t("updatePassword")}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
