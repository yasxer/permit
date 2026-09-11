import type { ReactNode } from "react";

import { MobileHeader, type MobileHeaderVariant } from "@/components/shared/mobile-nav";
import { cn } from "@/lib/utils";

/**
 * L'en-tête de page et le contenu qu'il porte.
 *
 * À partir de `lg`, un bandeau prolonge la barre de navigation dans le même
 * bleu nuit ; le contenu remonte de 40 px dessus, si bien que la première
 * rangée de cartes chevauche le nuit. La hiérarchie vient de ce décalage,
 * jamais d'une ombre.
 *
 * Sous `lg`, la page dessine son propre en-tête nuit (`MobileHeader`) et le
 * contenu glisse dessous sur un coin arrondi de 20 px. Le kicker et les
 * `actions` du bandeau n'y figurent pas : la maquette mobile n'a pas la place
 * de répéter des boutons que la barre d'onglets et le contenu portent déjà.
 * Une page qui veut quand même un geste en tête de contenu le passe dans
 * `mobileActions`.
 */
export function PageShell({
  kicker,
  title,
  description,
  actions,
  mobile = "compact",
  mobileSubtitle,
  mobileActions,
  mobileFooter,
  back,
  children,
  className,
}: {
  /** Mono, ambre, en capitales espacées : « Auto-école El Amel · Alger ». */
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** `hero` pour le tableau de bord, `compact` partout ailleurs. */
  mobile?: MobileHeaderVariant;
  /** Le contexte sous le titre mobile, s'il diffère de `description`. */
  mobileSubtitle?: ReactNode;
  mobileActions?: ReactNode;
  /**
   * Gestes rendus en bas de contenu sous `lg` — la place d'une suppression :
   * un geste destructif ne doit pas être la première chose sous le pouce.
   */
  mobileFooter?: ReactNode;
  /** Lien de retour, pour les fiches : remplace le logo de l'en-tête mobile. */
  back?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <MobileHeader
        variant={mobile}
        title={title}
        subtitle={mobileSubtitle ?? description}
        back={back}
      />

      <div className="dark hidden bg-sidebar text-sidebar-foreground lg:block">
        <div className="mx-auto flex w-full max-w-[90rem] items-end justify-between gap-6 px-8 pt-2 pb-14">
          <div className="min-w-0 space-y-2">
            {kicker && (
              <p className="truncate font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-brand">
                {kicker}
              </p>
            )}
            <h1 className="font-heading text-[2.125rem] font-bold leading-[1.1] tracking-[-0.03em] text-sidebar-foreground">
              {title}
            </h1>
            {description && (
              <div className="text-sm text-sidebar-muted">{description}</div>
            )}
          </div>

          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
          )}
        </div>
      </div>

      <div className="-mt-2.5 rounded-t-[20px] bg-background lg:-mt-10 lg:rounded-none lg:bg-transparent">
        <div
          className={cn(
            "mx-auto flex w-full max-w-[90rem] flex-col gap-3.5 px-4 pt-4 pb-28 sm:px-6 lg:gap-5 lg:px-8 lg:pt-0 lg:pb-12",
            className,
          )}
        >
          {mobileActions && (
            <div className="flex flex-wrap items-center gap-2.5 lg:hidden">{mobileActions}</div>
          )}
          {children}
          {mobileFooter && (
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:hidden">{mobileFooter}</div>
          )}
        </div>
      </div>
    </>
  );
}
