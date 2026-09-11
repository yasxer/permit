import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/components/shared/page-shell";

import { UsersTable } from "./users-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.users");
  return { title: t("title") };
}

export default async function AdminUsersPage() {
  const t = await getTranslations("admin.users");

  return (
    <PageShell title={t("title")} description={t("subtitle")}>
      <UsersTable />
    </PageShell>
  );
}
