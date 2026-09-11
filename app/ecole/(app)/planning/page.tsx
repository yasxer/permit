import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireApprovedSchool } from "@/lib/auth";
import { getSchoolIdentity } from "@/lib/school";

import { PlanningTabs } from "./planning-tabs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.planning");
  return { title: t("title") };
}

export default async function EcolePlanningPage() {
  const { school } = await requireApprovedSchool();
  const identity = await getSchoolIdentity();

  return <PlanningTabs schoolId={school.id} kicker={identity?.kicker} />;
}
