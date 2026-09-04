import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireApprovedSchool } from "@/lib/auth";

import { StudentDetail } from "./student-detail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.students");
  return { title: t("title") };
}

export default async function EcoleStudentPage(
  props: PageProps<"/ecole/students/[id]">,
) {
  await requireApprovedSchool();
  const { id } = await props.params;
  return <StudentDetail enrollmentId={id} />;
}
