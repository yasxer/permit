import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Le bandeau de page et le contenu qu'il porte.
 *
 * Le bandeau prolonge la barre de navigation dans le même bleu nuit ; le
 * contenu remonte de 40 px dessus, si bien que la première rangée de cartes
 * chevauche le nuit. La hiérarchie vient de ce décalage, jamais d'une ombre.
 *
 * Sous `lg`, le contenu se pose sur un coin arrondi de 20 px, comme une feuille
 * qui glisse sous l'en-tête — et garde de la place pour la barre d'onglets.
 */
export function PageShell({
  kicker,
  title,
  description,
  actions,
  children,
  className,
}: {
  /** Mono, ambre, en capitales espacées : « Auto-école El Amel · Alger ». */
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <div className="dark bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex w-full max-w-[90rem] flex-wrap items-end justify-between gap-x-6 gap-y-4 px-4 pt-2 pb-8 sm:px-6 lg:px-8 lg:pb-14">
          <div className="min-w-0 space-y-1.5 lg:space-y-2">
            {kicker && (
              <p className="truncate font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-brand">
                {kicker}
              </p>
            )}
            <h1 className="font-heading text-2xl font-bold leading-[1.1] tracking-[-0.03em] text-sidebar-foreground lg:text-[2.125rem]">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-sidebar-muted lg:text-sm">{description}</p>
            )}
          </div>

          {actions && (
            <div className="flex w-full shrink-0 flex-wrap items-center gap-2.5 sm:w-auto">
              {actions}
            </div>
          )}
        </div>
      </div>

      <div className="-mt-2.5 rounded-t-[20px] bg-background pt-4 lg:-mt-10 lg:rounded-none lg:bg-transparent lg:pt-0">
        <div
          className={cn(
            "mx-auto flex w-full max-w-[90rem] flex-col gap-5 px-4 pb-28 sm:px-6 lg:gap-5 lg:px-8 lg:pb-12",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}
