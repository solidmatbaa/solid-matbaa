"use client";

import { useState, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { MotionLink } from "@/components/ui/MotionLink";

function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setInfo(t("emailVerified"));
    }
    if (searchParams.get("info") === "use_otp") {
      setInfo(t("useOtpOnLogin"));
    }
  }, [searchParams, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? t("loginError"));
        return;
      }

      await refresh();
      router.push(searchParams.get("next") ?? "/");
      router.refresh();
    } catch {
      setError(t("loginError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError(t("enterEmailFirst"));
      return;
    }
    setResending(true);
    await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResending(false);
    setInfo(t("verificationResent"));
  }

  return (
    <div className="page-container max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("loginTitle")}</h1>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
            {error === t("emailNotVerified") && (
              <Button
                type="button"
                variant="ghost"
                loading={resending}
                onClick={handleResend}
                className="mt-2 text-brand-600 underline font-medium px-0 h-auto"
              >
                {t("resendOtp")}
              </Button>
            )}
          </div>
        )}

        {info && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("email")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("password")}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>
          <Button type="submit" loading={loading} fullWidth size="lg">
            {t("loginButton")}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {t("noAccount")}{" "}
          <MotionLink href="/auth/register" className="text-brand-600 hover:underline inline">
            {t("register")}
          </MotionLink>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
