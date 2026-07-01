"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { localeNames, type Locale } from "@/i18n/config";
import { Button } from "@/components/ui/Button";
import { MotionLink } from "@/components/ui/MotionLink";
import { MotionPressable } from "@/components/ui/MotionPressable";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useCart();

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/designs", label: t("designs") },
    { href: "/custom-printing", label: t("customPrinting") },
    { href: "/about", label: t("about") },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[4.5rem]">
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:scale-[1.02] duration-200"
          >
            <Image
              src="/BEST LOGO .png"
              alt="Solid Matbaa"
              width={1024}
              height={389}
              className="h-9 sm:h-10 w-auto max-w-[160px] sm:max-w-[180px] object-contain"
              style={{ width: "auto" }}
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  pathname === link.href
                    ? "bg-brand-50 text-brand-700 border border-brand-200 shadow-sm"
                    : "text-gray-600 hover:text-brand-700 hover:bg-brand-50/60"
                )}
              >
                {link.label}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-2 rounded-xl text-sm font-medium text-accent-600 hover:bg-amber-50 transition-all duration-200"
              >
                {t("adminDashboard")}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <MotionPressable>
              <Link
                href="/cart"
                className="relative p-2 text-gray-600 hover:text-brand-500 transition-colors duration-200 block"
                aria-label={t("cart")}
              >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-brand-500 text-gray-900 text-[10px] rounded-full flex items-center justify-center font-semibold">
                  {itemCount}
                </span>
              )}
              </Link>
            </MotionPressable>

            {user && (
              <Link
                href="/orders"
                className="hidden sm:block px-3 py-1.5 text-sm text-gray-600 hover:text-brand-500 transition-colors"
              >
                {t("orders")}
              </Link>
            )}

            {user && (
              <Link
                href="/profile"
                className="hidden sm:block px-3 py-1.5 text-sm text-gray-600 hover:text-brand-500 transition-colors"
              >
                {t("profile")}
              </Link>
            )}

            <div className="hidden sm:flex items-center gap-1">
              {(["en", "ar", "tr"] as Locale[]).map((l) => (
                <Link
                  key={l}
                  href={pathname}
                  locale={l}
                  className={cn(
                    "px-2 py-1 text-xs rounded-lg font-medium transition-all duration-200",
                    locale === l
                      ? "bg-brand-500 text-gray-900 shadow-sm"
                      : "text-gray-500 hover:bg-brand-50 hover:text-brand-700 hover:scale-105"
                  )}
                >
                  {l.toUpperCase()}
                </Link>
              ))}
            </div>

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:inline-flex text-gray-600 hover:text-red-600"
              >
                {t("logout")}
              </Button>
            ) : (
              <MotionLink href="/auth/login" className="hidden sm:block">
                <Button size="sm">{t("login")}</Button>
              </MotionLink>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden pb-4 border-t border-gray-100 pt-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block px-3 py-2.5 rounded-xl text-sm font-medium",
                  pathname === link.href
                    ? "bg-brand-50 text-brand-700 border border-brand-100"
                    : "text-gray-700 hover:bg-brand-50/60"
                )}
              >
                {link.label}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-accent-600">
                {t("adminDashboard")}
              </Link>
            )}
            {user ? (
              <>
                <Link href="/orders" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700">
                  {t("orders")}
                </Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700">
                  {t("profile")}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={handleLogout}
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {t("logout")}
                </Button>
              </>
            ) : (
              <MotionLink
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm text-brand-600 font-medium"
              >
                {t("login")}
              </MotionLink>
            )}
            <div className="flex gap-2 px-3 pt-2">
              {(["en", "ar", "tr"] as Locale[]).map((l) => (
                <Link key={l} href={pathname} locale={l} className="px-2 py-1 text-xs rounded-lg bg-gray-100">
                  {localeNames[l]}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
