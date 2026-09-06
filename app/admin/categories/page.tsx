import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/components/shared/page-shell";

import { CategoriesTable } from "./categories-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.categories");
  return { title: t("title") };
}

export default async function AdminCategoriesPage() {
  const t = await getTranslations("admin.categories");

  return (
    <PageShell title={t("title")} description={t("subtitle")}>
      <CategoriesTable />
    </PageShell>
  );
}
