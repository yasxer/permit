import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { requireApprovedSchool } from "@/lib/auth";

import { EcoleDashboard } from "./ecole-dashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.dashboard");
  return { title: t("title") };
}

export default async function EcoleDashboardPage() {
  const { school } = await requireApprovedSchool();
  const t = await getTranslations("ecole.dashboard");

  return (
    <>
      <PageHeader
        title={t("title")}
        description={school.name ?? t("subtitle")}
      />
      <EcoleDashboard schoolId={school.id} />
    </>
  );
}
