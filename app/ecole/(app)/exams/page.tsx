import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { requireApprovedSchool } from "@/lib/auth";

import { ExamsList } from "./exams-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.exams");
  return { title: t("title") };
}

export default async function EcoleExamsPage() {
  const { school } = await requireApprovedSchool();
  const t = await getTranslations("ecole.exams");

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <ExamsList schoolId={school.id} examDay={school.exam_day} />
    </>
  );
}
