import type { ReactNode } from "react";

import { AppShell } from "@/components/shared/app-shell";
import { getSessionUser, requireApprovedSchool } from "@/lib/auth";

/**
 * The gated part of /ecole. `requireApprovedSchool` sends a school that is
 * still pending to /ecole/pending and one with a half-filled profile to
 * /ecole/complete-profile, both of which sit outside this group.
 */
export default async function EcoleAppLayout({ children }: { children: ReactNode }) {
  await requireApprovedSchool();
  const session = await getSessionUser();
  if (!session) return null;

  return (
    <AppShell
      user={{
        name: session.profile.full_name,
        email: session.profile.email ?? session.user.email ?? "",
        photoUrl: session.profile.photo_url,
        role: session.profile.role,
      }}
    >
      {children}
    </AppShell>
  );
}
