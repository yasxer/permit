import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { requireApprovedSchool } from "@/lib/auth";
import { getSchoolIdentity } from "@/lib/school";

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

  return (
    <PageShell
      kicker={identity?.kicker}
      title={t("title")}
      description={t("subtitle")}
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
