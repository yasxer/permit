import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSessionUser } from "@/lib/auth";

import { ResetPasswordForm } from "./reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("resetTitle") };
}

export default async function ResetPasswordPage() {
  // Reaching this page without a session means the recovery link was never
  // exchanged — expired, already used, or opened directly.
  const session = await getSessionUser();
  if (!session) redirect("/forgot-password?expired=1");

  return <ResetPasswordForm />;
}
