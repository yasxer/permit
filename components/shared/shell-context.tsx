"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { NavUser } from "@/components/shared/navbar";

export type ShellIdentity = { title: string; subtitle?: string };

export type ShellValue = {
  user: NavUser;
  home: string;
  identity?: ShellIdentity;
  badges?: Record<string, number>;
};

const ShellContext = createContext<ShellValue | null>(null);

/**
 * Ce que la mise en page sait et que la page ne sait pas : qui est connecté,
 * quelle auto-école, où est l'accueil.
 *
 * Sous `lg`, c'est la page qui dessine l'en-tête nuit — son titre y partage la
 * ligne de l'avatar — et elle lit le reste ici plutôt que de le recevoir de
 * chaque `page.tsx`.
 */
export function ShellProvider({
  value,
  children,
}: {
  value: ShellValue;
  children: ReactNode;
}) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellValue | null {
  return useContext(ShellContext);
}
