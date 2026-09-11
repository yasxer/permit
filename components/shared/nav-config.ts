import {
  Award,
  Building2,
  CalendarDays,
  ClipboardCheck,
  CircleHelp,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/types/database";

export type NavItem = {
  href: string;
  /** Key inside the `nav` message namespace. */
  labelKey: string;
  /** Shorter label for the mobile tab bar, where 10px type has no room. */
  shortKey?: string;
  icon: LucideIcon;
  /**
   * La barre d'onglets du bas ne tient que cinq colonnes. « Diplômés » passe
   * dans le menu utilisateur plutôt que de serrer les autres.
   */
  mobile?: boolean;
};

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", labelKey: "dashboard", shortKey: "dashboardShort", icon: LayoutDashboard, mobile: true },
  { href: "/admin/auto-ecoles", labelKey: "autoEcoles", icon: Building2, mobile: true },
  { href: "/admin/users", labelKey: "users", icon: Users, mobile: true },
  { href: "/admin/categories", labelKey: "categories", icon: Tags, mobile: true },
  { href: "/admin/questions", labelKey: "questions", icon: CircleHelp, mobile: true },
];

const ECOLE_NAV: NavItem[] = [
  { href: "/ecole/dashboard", labelKey: "dashboard", shortKey: "dashboardShort", icon: LayoutDashboard, mobile: true },
  { href: "/ecole/requests", labelKey: "requests", icon: Inbox, mobile: true },
  { href: "/ecole/students", labelKey: "students", icon: GraduationCap, mobile: true },
  { href: "/ecole/completed", labelKey: "completed", icon: Award },
  { href: "/ecole/planning", labelKey: "planning", icon: CalendarDays, mobile: true },
  { href: "/ecole/exams", labelKey: "exams", icon: ClipboardCheck, mobile: true },
];

export function navFor(role: UserRole): NavItem[] {
  if (role === "super_admin") return ADMIN_NAV;
  if (role === "auto_ecole") return ECOLE_NAV;
  return [];
}

/** The five tabs the bottom bar shows below `lg`. */
export function mobileNavFor(role: UserRole): NavItem[] {
  return navFor(role).filter((item) => item.mobile);
}

/** A nav item is active for its own page and anything nested under it. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
