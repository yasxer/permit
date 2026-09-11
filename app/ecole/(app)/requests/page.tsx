import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/components/shared/page-shell";
import { requireApprovedSchool } from "@/lib/auth";
import { getPendingRequestCount, getSchoolIdentity } from "@/lib/school";

import { RequestsList } from "./requests-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ecole.requests");
  return { title: t("title") };
}

export default async function EcoleRequestsPage() {
  const { school } = await requireApprovedSchool();
  const t = await getTranslations("ecole.requests");
  // Déjà lus par la mise en page pour la pastille de l'onglet : le cache de
  // requête sert la même valeur, sans second aller-retour.
  const [identity, pending] = await Promise.all([
    getSchoolIdentity(),
    getPendingRequestCount(),
  ]);

  return (
    <PageShell
      kicker={identity?.kicker}
      title={t("title")}
      description={t("subtitleHint")}
      mobileSubtitle={t("pendingCount", { count: pending })}
    >
      <RequestsList schoolId={school.id} />
    </PageShell>
  );
}
