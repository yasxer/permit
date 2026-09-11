import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { requireApprovedSchool } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getSchoolIdentity } from "@/lib/school";
import { startOfWeek } from "@/lib/week";

import { AddCandidateButton } from "../students/add-candidate-button";
import { EcoleDashboard } from "./ecole-dashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.dashboard");
  return { title: t("title") };
}

export default async function EcoleDashboardPage() {
  const { school } = await requireApprovedSchool();
  const t = await getTranslations("ecole.dashboard");
  const identity = await getSchoolIdentity();
  // La semaine ouvrée en cours, samedi en tête : c'est l'unité dans laquelle
  // une auto-école algérienne pense son planning et ses encaissements.
  const week = formatDate(startOfWeek(new Date()), await getLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PageShell
      mobile="hero"
      kicker={identity?.kicker}
      title={t("title")}
      description={t("weekActivity", { date: week })}
      mobileSubtitle={t("weekOf", { date: week })}
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/ecole/planning">
              <CalendarDays className="size-4" />
              {t("viewPlanning")}
            </Link>
          </Button>
          <AddCandidateButton schoolId={school.id} />
        </>
      }
    >
      <EcoleDashboard schoolId={school.id} />
    </PageShell>
  );
}
