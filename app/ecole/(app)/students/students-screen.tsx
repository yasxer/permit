"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PageShell } from "@/components/shared/page-shell";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { AddCandidateButton } from "./add-candidate-button";
import { StudentsTable } from "./students-table";

/**
 * La recherche et le CTA vivent dans le bandeau nuit, comme la maquette le
 * demande — d'où cet écran client : le champ et la table doivent partager le
 * même état, et le bandeau est rendu ici plutôt que par la page serveur.
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

  return (
    <PageShell
      kicker={kicker}
      title={t("title")}
      description={t("subtitle")}
      actions={
        <>
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
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
    >
      <StudentsTable
        schoolId={schoolId}
        status="active"
        emptyTitle={t("empty")}
        search={debounced}
      />
    </PageShell>
  );
}
