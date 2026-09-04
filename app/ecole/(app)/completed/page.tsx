import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { requireApprovedSchool } from "@/lib/auth";

import { StudentsTable } from "../students/students-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.completed");
  return { title: t("title") };
}

/**
 * Same table as /ecole/students, filtered to finished files. Their records
 * stay readable — the school still needs the history.
 */
export default async function EcoleCompletedPage() {
  const { school } = await requireApprovedSchool();
  const t = await getTranslations("ecole.completed");

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <StudentsTable
        schoolId={school.id}
        status="completed"
        emptyTitle={t("empty")}
      />
    </>
  );
}
