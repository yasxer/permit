import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { requireApprovedSchool } from "@/lib/auth";

import { PlanningTabs } from "./planning-tabs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.planning");
  return { title: t("title") };
}

export default async function EcolePlanningPage() {
  const { school } = await requireApprovedSchool();
  const t = await getTranslations("ecole.planning");

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <PlanningTabs schoolId={school.id} />
    </>
  );
}
