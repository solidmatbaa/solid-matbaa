"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { MotionLink } from "@/components/ui/MotionLink";
import { createClient } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: ReactNode }) {
  const t = useTranslations("auth");
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? "authenticated" : "unauthenticated");
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{t("loginRequired")}</h1>
        <p className="text-gray-600 mb-6">{t("loginRequiredDesc")}</p>
        <div className="flex gap-3 justify-center">
          <MotionLink
            href="/auth/login"
            className="px-6 py-2.5 bg-brand-500 text-gray-900 rounded-lg hover:bg-brand-600 font-semibold"
          >
            {t("loginButton")}
          </MotionLink>
          <MotionLink
            href="/auth/register"
            className="px-6 py-2.5 border border-brand-500 text-brand-700 rounded-lg hover:bg-brand-50 font-semibold"
          >
            {t("registerButton")}
          </MotionLink>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
