import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SchoolDetail } from "./school-detail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.schools");
  return { title: t("detailsTitle") };
}

export default async function AdminSchoolPage(
  props: PageProps<"/admin/auto-ecoles/[id]">,
) {
  const { id } = await props.params;
  return <SchoolDetail schoolId={id} />;
}
