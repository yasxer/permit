import { redirect } from "next/navigation";

import { getSessionUser, homePathFor } from "@/lib/auth";

/**
 * La racine n'affiche rien : elle aiguille.
 *
 * Permix n'a pas de vitrine — on y arrive parce qu'on y a un espace. Un
 * visiteur sans session est déjà renvoyé sur `/login` par le proxy ; ce qui
 * reste ici, c'est le signé-en-session qui clique sur le logo ou revient d'une
 * page d'authentification, et qui doit retomber sur *son* tableau de bord.
 */
export default async function RootPage() {
  const session = await getSessionUser();
  redirect(session ? homePathFor(session.profile.role) : "/login");
}
