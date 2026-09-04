import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";

import { AdminDashboard } from "./admin-dashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.dashboard");
  return { title: t("title") };
}

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <AdminDashboard />
    </>
  );
}
