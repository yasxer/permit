import type { ReactNode } from "react";

import { AppShell } from "@/components/shared/app-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireRole("super_admin");

  return (
    <AppShell
      user={{
        name: profile.full_name,
        email: profile.email ?? user.email ?? "",
        photoUrl: profile.photo_url,
        role: profile.role,
      }}
    >
      {children}
    </AppShell>
  );
}
