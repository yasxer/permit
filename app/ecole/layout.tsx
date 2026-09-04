import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth";

/**
 * Guards the role only. Approval and profile-completion gating lives one level
 * down, so /ecole/pending and /ecole/complete-profile stay reachable while a
 * school is still waiting or half set up.
 */
export default async function EcoleLayout({ children }: { children: ReactNode }) {
  await requireRole("auto_ecole");
  return <>{children}</>;
}
