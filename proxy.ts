import { NextResponse, type NextRequest } from "next/server";

import { createProxyClient } from "@/lib/supabase/proxy";

/** Routes reachable without a session. */
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

/**
 * Where a signed-in visitor has no business being. Deliberately excludes
 * /reset-password: the recovery link creates a session before landing there,
 * so bouncing signed-in users would make password resets impossible.
 */
const AUTH_ENTRY_PATHS = ["/login", "/register", "/forgot-password"];

function matches(paths: string[], pathname: string) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

const isPublic = (pathname: string) => matches(PUBLIC_PATHS, pathname);

/**
 * Next.js 16 renamed `middleware` to `proxy`. Two jobs here, and only two:
 *
 *   1. refresh the Supabase session so server components see a valid user
 *   2. bounce anonymous visitors off protected routes
 *
 * Role and approval gating lives in the `(admin)` / `(ecole)` layouts, which
 * can read `profiles` and `schools` in the same request instead of making the
 * proxy hit the database on every asset request.
 */
export async function proxy(request: NextRequest) {
  const { supabase, getResponse, withAuthCookies } = createProxyClient(request);

  // Must be getUser(), not getSession(): only getUser() revalidates the JWT
  // against the auth server, and it is what refreshes the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    // Send them where they were headed once they sign in.
    if (pathname !== "/") {
      redirect.searchParams.set("next", pathname);
    }
    return withAuthCookies(NextResponse.redirect(redirect));
  }

  if (user && matches(AUTH_ENTRY_PATHS, pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/";
    redirect.search = "";
    return withAuthCookies(NextResponse.redirect(redirect));
  }

  return getResponse();
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and static assets. Auth cookies still
     * need refreshing on API routes, so those are deliberately included.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
