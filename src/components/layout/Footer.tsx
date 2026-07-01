"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="bg-gray-900 text-white mt-auto border-t-4 border-brand-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center" aria-label="Solid Matbaa">
            <Image
              src="/images/footer-logo.png"
              alt="Solid Matbaa"
              width={1024}
              height={413}
              className="h-11 sm:h-14 w-auto max-w-[220px] sm:max-w-[260px] object-contain"
              style={{ width: "auto" }}
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="text-center sm:text-start">
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
              {t("tagline")}
            </p>
          </div>

          <div className="text-center sm:text-start">
            <h3 className="font-semibold mb-3 text-brand-500">{tNav("designs")}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/designs" className="hover:text-brand-500 transition-colors">
                  {tNav("designs")}
                </Link>
              </li>
              <li>
                <Link href="/custom-printing" className="hover:text-brand-500 transition-colors">
                  {tNav("customPrinting")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-500 transition-colors">
                  {tNav("about")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center sm:text-start">
            <h3 className="font-semibold mb-3 text-brand-500">{t("contact")}</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a
                  href="mailto:info@solidmatbaa.com"
                  className="hover:text-brand-500 transition-colors inline-flex items-center gap-2 justify-center sm:justify-start"
                >
                  <svg className="w-4 h-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  info@solidmatbaa.com
                </a>
              </li>
              <li className="flex items-center gap-4 pt-1 justify-center sm:justify-start">
                <a
                  href="https://instagram.com/solidmatbaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 bg-brand-500/15 rounded-full flex items-center justify-center hover:bg-brand-500 hover:text-gray-900 text-brand-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://facebook.com/solidmatbaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 bg-brand-500/15 rounded-full flex items-center justify-center hover:bg-brand-500 hover:text-gray-900 text-brand-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Solid Matbaa. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
