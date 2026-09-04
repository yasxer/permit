import { redirect } from "next/navigation";

import { getSessionUser, homePathFor } from "@/lib/auth";

/**
 * The root is only ever a signpost: the proxy has already bounced anonymous
 * visitors to /login, so anyone here has a role to route by.
 */
export default async function RootPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  redirect(homePathFor(session.profile.role));
}
