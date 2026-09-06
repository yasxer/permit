import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/components/shared/page-shell";

import { QuestionsManager } from "./questions-manager";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.questions");
  return { title: t("title") };
}

export default async function AdminQuestionsPage() {
  const t = await getTranslations("admin.questions");

  return (
    <PageShell title={t("title")} description={t("subtitle")}>
      <QuestionsManager />
    </PageShell>
  );
}
