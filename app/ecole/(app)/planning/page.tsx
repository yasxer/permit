import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/components/shared/page-shell";
import { requireApprovedSchool } from "@/lib/auth";
import { getSchoolIdentity } from "@/lib/school";

import { PlanningTabs } from "./planning-tabs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.planning");
  return { title: t("title") };
}

export default async function EcolePlanningPage() {
  const { school } = await requireApprovedSchool();
  const t = await getTranslations("ecole.planning");
  const identity = await getSchoolIdentity();

  return (
    <PageShell
      kicker={identity?.kicker}
      title={t("title")}
      description={t("planningHint")}
    >
      <PlanningTabs schoolId={school.id} />
    </PageShell>
  );
}
