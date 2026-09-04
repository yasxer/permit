import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";

import { UsersTable } from "./users-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.users");
  return { title: t("title") };
}

export default async function AdminUsersPage() {
  const t = await getTranslations("admin.users");

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <UsersTable />
    </>
  );
}
