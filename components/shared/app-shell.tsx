import type { ReactNode } from "react";

import { MobileTabBar } from "@/components/shared/mobile-nav";
import { Navbar, type NavUser } from "@/components/shared/navbar";
import { ShellProvider, type ShellIdentity } from "@/components/shared/shell-context";
import { homePathFor } from "@/lib/auth";

/**
 * Le cadre de toute page connectée.
 *
 * À partir de `lg`, deux blocs bleu nuit contigus se lisent comme un seul
 * en-tête : la barre de navigation, puis le bandeau que `PageShell` pose
 * dessous. Sous `lg`, l'en-tête appartient à la page — son titre partage la
 * ligne de l'avatar — et la navigation descend dans cinq onglets en bas.
 *
 * Le contexte transmet à cet en-tête mobile ce que seule la mise en page
 * connaît : l'utilisateur, l'auto-école, l'accueil.
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
    <ShellProvider value={{ user, home, identity, badges }}>
      <div className="flex min-h-svh flex-col">
        <Navbar user={user} home={home} badges={badges} />
        <main className="flex-1">{children}</main>
        <MobileTabBar user={user} badges={badges} />
      </div>
    </ShellProvider>
  );
}
