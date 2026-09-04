import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { requireApprovedSchool } from "@/lib/auth";

import { RequestsList } from "./requests-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.requests");
  return { title: t("title") };
}

export default async function EcoleRequestsPage() {
  const { school } = await requireApprovedSchool();
  const t = await getTranslations("ecole.requests");

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <RequestsList schoolId={school.id} />
    </>
  );
}
