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
  icon: LucideIcon;
};

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/auto-ecoles", labelKey: "autoEcoles", icon: Building2 },
  { href: "/admin/users", labelKey: "users", icon: Users },
  { href: "/admin/categories", labelKey: "categories", icon: Tags },
  { href: "/admin/questions", labelKey: "questions", icon: CircleHelp },
];

const ECOLE_NAV: NavItem[] = [
  { href: "/ecole/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/ecole/requests", labelKey: "requests", icon: Inbox },
  { href: "/ecole/students", labelKey: "students", icon: GraduationCap },
  { href: "/ecole/completed", labelKey: "completed", icon: Award },
  { href: "/ecole/planning", labelKey: "planning", icon: CalendarDays },
  { href: "/ecole/exams", labelKey: "exams", icon: ClipboardCheck },
];

export function navFor(role: UserRole): NavItem[] {
  if (role === "super_admin") return ADMIN_NAV;
  if (role === "auto_ecole") return ECOLE_NAV;
  return [];
}

/** A nav item is active for its own page and anything nested under it. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
