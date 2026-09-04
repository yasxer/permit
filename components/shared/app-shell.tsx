import type { ReactNode } from "react";

import { Navbar, type NavUser } from "@/components/shared/navbar";
import { SidebarRail } from "@/components/shared/sidebar-rail";

/**
 * The frame every signed-in page renders inside: a top bar from lg up, an icon
 * rail below it. `ps-14` reserves the rail's width on small screens.
 */
export function AppShell({
  user,
  children,
}: {
  user: NavUser;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar user={user} />
      <SidebarRail user={user} />

      <main className="flex-1 ps-14 lg:ps-0">
        <div className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
