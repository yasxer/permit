import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireApprovedSchool } from "@/lib/auth";

import { ExamDetail } from "./exam-detail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.exams");
  return { title: t("title") };
}

export default async function EcoleExamPage(props: PageProps<"/ecole/exams/[id]">) {
  const { school } = await requireApprovedSchool();
  const { id } = await props.params;
  return <ExamDetail examId={id} schoolId={school.id} />;
}
