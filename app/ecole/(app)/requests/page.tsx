import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/components/shared/page-shell";
import { requireApprovedSchool } from "@/lib/auth";
import { getSchoolIdentity } from "@/lib/school";

import { RequestsList } from "./requests-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.requests");
  return { title: t("title") };
}

export default async function EcoleRequestsPage() {
  const { school } = await requireApprovedSchool();
  const t = await getTranslations("ecole.requests");
  const identity = await getSchoolIdentity();

  return (
    <PageShell
      kicker={identity?.kicker}
      title={t("title")}
      description={t("subtitleHint")}
    >
      <RequestsList schoolId={school.id} />
    </PageShell>
  );
}
