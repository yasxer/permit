import type { ReactNode } from "react";

import { MobileTabBar, MobileTopBar, type ShellIdentity } from "@/components/shared/mobile-nav";
import { Navbar, type NavUser } from "@/components/shared/navbar";
import { homePathFor } from "@/lib/auth";

/**
 * Le cadre de toute page connectée.
 *
 * Deux blocs bleu nuit contigus se lisent comme un seul en-tête : la barre de
 * navigation, puis le bandeau de page que `PageShell` pose juste dessous. Le
 * contenu remonte ensuite sur le bandeau, ce qui fait chevaucher la première
 * rangée de cartes — c'est ce chevauchement, et non une ombre, qui installe la
 * profondeur.
 *
 * Sous `lg`, la même logique : en-tête nuit sans navigation, et cinq onglets
 * collés en bas.
 */
export function AppShell({
  user,
  identity,
  badges,
  children,
}: {
  user: NavUser;
  /** Nom et lieu affichés dans l'en-tête mobile (l'auto-école, en pratique). */
  identity?: ShellIdentity;
  /** Compteur par href — la pastille ambre de « Demandes ». */
  badges?: Record<string, number>;
  children: ReactNode;
}) {
  const home = homePathFor(user.role);

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar user={user} home={home} badges={badges} />
      <MobileTopBar user={user} home={home} identity={identity} />

      <main className="flex-1">{children}</main>

      <MobileTabBar user={user} badges={badges} />
    </div>
  );
}
