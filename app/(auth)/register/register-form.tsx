"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authErrorKey } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterValues } from "@/lib/validation/auth";

export function RegisterForm() {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const tError = useTranslations();
  const router = useRouter();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema(tv)),
    defaultValues: {
      schoolName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: RegisterValues) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // `handle_new_user` reads these; it only ever honours 'auto_ecole',
        // so this cannot be used to self-assign an admin role.
        data: { role: "auto_ecole", school_name: values.schoolName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      const [namespace, key] = authErrorKey(error);
      toast.error(tError(`${namespace}.${key}`));
      return;
    }

    toast.success(t("registerSuccess"));

    // With email confirmation off, Supabase signs the user in right away —
    // send them straight to the approval-pending screen.
    if (data.session) {
      router.replace("/ecole/pending");
      router.refresh();
      return;
    }

    setSentTo(values.email);
  }

  if (sentTo) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-1 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-5" aria-hidden />
          </span>
          <CardTitle className="text-xl">{t("checkEmailTitle")}</CardTitle>
          <CardDescription>
            {t("checkEmailMessage", { email: sentTo })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">{t("registerTitle")}</CardTitle>
        <CardDescription>{t("registerSubtitle")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.schoolName}>
              <FieldLabel htmlFor="schoolName">{t("schoolName")}</FieldLabel>
              <Input
                id="schoolName"
                autoComplete="organization"
                placeholder={t("schoolNamePlaceholder")}
                aria-invalid={!!errors.schoolName}
                {...register("schoolName")}
              />
              <FieldError
                errors={errors.schoolName ? [errors.schoolName] : undefined}
              />
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
                placeholder={t("emailPlaceholder")}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError errors={errors.email ? [errors.email] : undefined} />
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
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
              {isSubmitting ? (
                <>
                  <Spinner />
                  {t("registering")}
                </>
              ) : (
                <>
                  <UserPlus />
                  {t("register")}
                </>
              )}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
