"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";
import { authErrorKey } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const tError = useTranslations();
  const router = useRouter();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema(tv)),
    defaultValues: { email: "", password: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: LoginValues) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      const [namespace, key] = authErrorKey(error);
      toast.error(tError(`${namespace}.${key}`));
      return;
    }

    toast.success(t("loginSuccess"));
    // `next` is validated server-side; refresh so the proxy and layouts see
    // the new session before the navigation resolves.
    router.replace(next ?? "/");
    router.refresh();
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">{t("loginTitle")}</CardTitle>
        <CardDescription>{t("loginSubtitle")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
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
              <div className="flex items-baseline justify-between gap-3">
                <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-brand-ink hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                dir="ltr"
                placeholder={t("passwordPlaceholder")}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldError
                errors={errors.password ? [errors.password] : undefined}
              />
            </Field>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Spinner />
                  {t("loggingIn")}
                </>
              ) : (
                <>
                  <LogIn className="rtl-flip" />
                  {t("login")}
                </>
              )}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-brand-ink underline-offset-4 hover:underline"
          >
            {t("signUp")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
