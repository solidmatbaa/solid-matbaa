import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { isAdmin } from "@/lib/auth";

const intlMiddleware = createIntlMiddleware(routing);

const ADMIN_PATH = /^\/(en|ar|tr)\/admin(\/.*)?$/;

function getLocaleFromPath(pathname: string): string {
  const match = pathname.match(/^\/(en|ar|tr)(\/|$)/);
  return match?.[1] ?? routing.defaultLocale;
}

function mergeAuthCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, response: supabaseResponse } = createMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let response: NextResponse;

  if (ADMIN_PATH.test(pathname)) {
    const locale = getLocaleFromPath(pathname);
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set("next", pathname);

    if (!user) {
      response = NextResponse.redirect(loginUrl);
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!isAdmin(profile)) {
        const homeUrl = new URL(`/${locale}`, request.url);
        homeUrl.searchParams.set("error", "admin_forbidden");
        response = NextResponse.redirect(homeUrl);
      } else {
        response = intlMiddleware(request);
      }
    }
  } else {
    response = intlMiddleware(request);
  }

  mergeAuthCookies(supabaseResponse, response);
  return response;
}

export const config = {
  matcher: ["/", "/(en|ar|tr)/:path*"],
};
