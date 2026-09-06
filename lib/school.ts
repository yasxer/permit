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
 * affiche. Mis en cache par requête : la mise en page et la page elle-même le
 * demandent toutes les deux, une seule lecture part.
 */
export const getSchoolIdentity = cache(async (): Promise<SchoolIdentity | null> => {
  const school = await getOwnedSchool();
  if (!school) return null;

  let wilaya: string | null = null;
  if (school.wilaya_code) {
    const locale = (await getLocale()) as Locale;
    const supabase = await createClient();
    const { data } = await supabase
      .from("wilayas")
      .select("name_ar, name_fr, name_en")
      .eq("code", school.wilaya_code)
      .single();
    wilaya = data ? (data[`name_${locale}`] ?? data.name_fr) : null;
  }

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
