import "server-only";

import { getLocale } from "next-intl/server";
import { cache } from "react";

import { getOwnedSchool } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/config";

export type SchoolIdentity = {
  name: string | null;
  wilaya: string | null;
  /** « Auto-école El Amel · Alger » — le kicker mono ambre du bandeau. */
  kicker: string;
};

/**
 * Le nom de l'auto-école et sa wilaya, tels que le bandeau de chaque page les
 * affiche. La wilaya arrive jointe à la ligne de l'école : aucune lecture de
 * plus, et le cache de requête sert la mise en page comme la page.
 */
export const getSchoolIdentity = cache(async (): Promise<SchoolIdentity | null> => {
  const school = await getOwnedSchool();
  if (!school) return null;

  const locale = (await getLocale()) as Locale;
  const wilaya = school.wilaya
    ? (school.wilaya[`name_${locale}`] ?? school.wilaya.name_fr)
    : null;

  return {
    name: school.name,
    wilaya,
    kicker: [school.name, wilaya].filter(Boolean).join(" · "),
  };
});

/** Combien de demandes attendent une décision — la pastille de l'onglet. */
export const getPendingRequestCount = cache(async (): Promise<number> => {
  const school = await getOwnedSchool();
  if (!school) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("school_id", school.id)
    .eq("status", "pending");

  return count ?? 0;
});
