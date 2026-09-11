import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireApprovedSchool } from "@/lib/auth";
import { getSchoolIdentity } from "@/lib/school";

import { StudentsScreen } from "./students-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.students");
  return { title: t("title") };
}

export default async function EcoleStudentsPage() {
  const { school } = await requireApprovedSchool();
  const identity = await getSchoolIdentity();

  return <StudentsScreen schoolId={school.id} kicker={identity?.kicker} />;
}
