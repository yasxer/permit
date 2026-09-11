import type { ReactNode } from "react";

import { AppShell } from "@/components/shared/app-shell";
import { requireApprovedSchool } from "@/lib/auth";
import { getPendingRequestCount, getSchoolIdentity } from "@/lib/school";

/**
 * The gated part of /ecole. `requireApprovedSchool` sends a school that is
 * still pending to /ecole/pending and one with a half-filled profile to
 * /ecole/complete-profile, both of which sit outside this group.
 */
export default async function EcoleAppLayout({ children }: { children: ReactNode }) {
  const { session, school } = await requireApprovedSchool();

  const [identity, pending] = await Promise.all([
    getSchoolIdentity(),
    getPendingRequestCount(),
  ]);

  return (
    <AppShell
      user={{
        name: session.profile.full_name,
        email: session.profile.email ?? session.user.email ?? "",
        photoUrl: session.profile.photo_url,
        role: session.profile.role,
      }}
      identity={{
        title: identity?.name ?? school.name ?? "—",
        subtitle: identity?.wilaya ?? undefined,
      }}
      badges={{ "/ecole/requests": pending }}
    >
      {children}
    </AppShell>
  );
}
