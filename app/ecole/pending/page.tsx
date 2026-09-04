import { Clock, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LangSwitcher } from "@/components/shared/lang-switcher";
import { Logo } from "@/components/shared/logo";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOwnedSchool } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("pendingTitle") };
}

export default async function PendingPage() {
  const school = await getOwnedSchool();
  const t = await getTranslations("auth");

  // Approved schools have somewhere better to be.
  if (school?.status === "approved") redirect("/ecole/dashboard");

  const rejected = school?.status === "rejected";
  const Icon = rejected ? XCircle : Clock;

  return (
    <div className="relative flex min-h-svh flex-col bg-muted/40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/8 to-transparent"
      />

      <header className="relative flex items-center justify-between px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-0.5">
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-5 pb-16 pt-4 sm:px-8">
        <Card className="w-full max-w-[28rem] shadow-sm">
          <CardHeader className="items-center text-center">
            <span
              className={
                rejected
                  ? "mb-1 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive"
                  : "mb-1 grid size-12 place-items-center rounded-full bg-warning/15 text-warning"
              }
            >
              <Icon className="size-6" aria-hidden />
            </span>
            <CardTitle className="text-xl">
              {rejected ? t("rejectedTitle") : t("pendingTitle")}
            </CardTitle>
            <CardDescription className="text-balance">
              {rejected ? t("rejectedMessage") : t("pendingMessage")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {rejected && school?.rejection_reason && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-foreground">
                {school.rejection_reason}
              </p>
            )}
            <SignOutButton />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
