import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { requireApprovedSchool } from "@/lib/auth";

import { StudentsTable } from "./students-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.students");
  return { title: t("title") };
}

export default async function EcoleStudentsPage() {
  const { school } = await requireApprovedSchool();
  const t = await getTranslations("ecole.students");

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <StudentsTable
        schoolId={school.id}
        status="active"
        emptyTitle={t("empty")}
      />
    </>
  );
}
