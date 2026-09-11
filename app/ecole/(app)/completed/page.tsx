import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/components/shared/page-shell";
import { requireApprovedSchool } from "@/lib/auth";
import { getSchoolIdentity } from "@/lib/school";

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
  const identity = await getSchoolIdentity();

  return (
    <PageShell
      kicker={identity?.kicker}
      title={t("title")}
      description={t("subtitle")}
    >
      <StudentsTable
        schoolId={school.id}
        status="completed"
        emptyTitle={t("empty")}
      />
    </PageShell>
  );
}
