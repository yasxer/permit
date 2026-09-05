import type { ReactNode } from "react";

/**
 * Le haut de chaque page : le titre, ce qu'on y fait, et les actions.
 *
 * Le filet du bas n'est pas décoratif — il sépare l'en-tête du contenu, si
 * bien que le titre ne flotte pas au-dessus d'un tableau qui commence, lui
 * aussi, par une ligne de texte.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b pb-5">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
