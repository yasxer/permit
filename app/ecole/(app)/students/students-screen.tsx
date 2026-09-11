"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PageShell } from "@/components/shared/page-shell";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useStudentFiles } from "@/hooks/use-enrollments";

import { AddCandidateButton } from "./add-candidate-button";
import { StudentsTable } from "./students-table";

/**
 * Sur desktop, la recherche et le CTA vivent dans le bandeau nuit (2e). Sur
 * mobile (2h), la recherche descend en tête de liste sur fond clair et le CTA
 * ferme la liste, pleine largeur, sous le pouce.
 *
 * D'où cet écran client : les deux champs et la table partagent un seul état,
 * et l'en-tête affiche le nombre de dossiers.
 */
export function StudentsScreen({
  schoolId,
  kicker,
}: {
  schoolId: string;
  kicker?: string;
}) {
  const t = useTranslations("ecole.students");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);

  // Même clé que la table : React Query ne fait qu'une lecture pour les deux.
  const { data, isPending } = useStudentFiles(schoolId, "active");
  const count = data?.length ?? 0;

  return (
    <PageShell
      kicker={kicker}
      title={t("title")}
      description={isPending ? t("subtitle") : t("filesInTraining", { count })}
      mobileSubtitle={isPending ? undefined : t("activeFilesCount", { count })}
      actions={
        <>
          <div className="relative w-64">
            <Search
              className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-sidebar-muted"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={tc("search")}
              // Le champ posé sur le nuit : bordure de la barre, fond
              // transparent — un cadre blanc y ferait une tache.
              className="border-sidebar-border bg-transparent ps-9 text-sidebar-foreground placeholder:text-sidebar-muted hover:border-white/30"
            />
          </div>
          <AddCandidateButton schoolId={schoolId} />
        </>
      }
      mobileActions={
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute inset-y-0 start-[13px] my-auto size-[0.9375rem] text-muted-foreground/80"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tc("searchPlaceholder")}
            aria-label={tc("search")}
            className="h-11 border-border bg-card ps-9"
          />
        </div>
      }
    >
      <StudentsTable
        schoolId={schoolId}
        status="active"
        emptyTitle={t("empty")}
        search={debounced}
      />
      <AddCandidateButton
        schoolId={schoolId}
        className="h-12 w-full text-[0.9375rem] lg:hidden"
      />
    </PageShell>
  );
}
