import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/components/shared/page-shell";

import { SchoolsTable } from "./schools-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.schools");
  return { title: t("title") };
}

export default async function AdminSchoolsPage() {
  const t = await getTranslations("admin.schools");

  return (
    <PageShell title={t("title")} description={t("subtitle")}>
      <SchoolsTable />
    </PageShell>
  );
}
