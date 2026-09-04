import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LangSwitcher } from "@/components/shared/lang-switcher";
import { Logo } from "@/components/shared/logo";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { requireApprovedSchool } from "@/lib/auth";

import { CompleteProfileForm } from "./complete-profile-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.profile");
  return { title: t("title") };
}

export default async function CompleteProfilePage() {
  // `allowIncompleteProfile` — this is the page that fixes it, so the usual
  // redirect would send it to itself.
  const { school } = await requireApprovedSchool({ allowIncompleteProfile: true });
  const t = await getTranslations("ecole.profile");

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      {/* No app nav here on purpose: the profile gate is the whole point of
          the screen, and clickable links that bounce straight back are worse
          than no links. */}
      <header className="flex items-center justify-between border-b bg-background px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-0.5">
          <LangSwitcher />
          <ThemeToggle />
          <SignOutButton variant="ghost" className="ms-1" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <CompleteProfileForm school={school} />
      </main>
    </div>
  );
}
