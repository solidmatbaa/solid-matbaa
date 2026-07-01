"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { MotionLink } from "@/components/ui/MotionLink";
import { useAuth } from "@/context/AuthContext";
import { AddressForm } from "@/components/address/AddressForm";
import {
  addressFormToUserAddress,
  getDefaultAddressFormValues,
  isAddressFormComplete,
  type AddressFormValues,
} from "@/lib/address-data";
import type { Locale } from "@/types";

type Step = "form" | "otp";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { refresh } = useAuth();

  const [step, setStep] = useState<Step>("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredPassword, setRegisteredPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [addressForm, setAddressForm] = useState<AddressFormValues>(
    getDefaultAddressFormValues()
  );
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    if (!isAddressFormComplete(addressForm)) {
      setError(t("addressIncomplete"));
      return;
    }

    setLoading(true);
    setError("");
    setInfo("");

    const address = addressFormToUserAddress(addressForm);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          username: form.username,
          phone: form.phone,
          address,
          locale,
        }),
      });

      const raw = await res.text();
      let data: { success?: boolean; message?: string; error?: string; data?: { email?: string } } = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        setError(t("registerError"));
        return;
      }

      if (!res.ok || !data.success) {
        const apiError = data.error?.trim();
        setError(apiError && apiError !== "{}" ? apiError : t("registerError"));
        return;
      }

      const email = data.data?.email ?? form.email.toLowerCase().trim();
      setRegisteredEmail(email);
      setRegisteredPassword(form.password);
      setStep("otp");
      setInfo(t("otpSent"));
    } catch {
      setError(t("registerError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError(t("invalidCode"));
      return;
    }

    setLoading(true);
    setError("");
    setInfo("");

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        email: registeredEmail,
        otpCode,
        password: registeredPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setLoading(false);
      setError(data.error ?? t("invalidCode"));
      return;
    }

    await refresh();
    router.push("/");
    router.refresh();
    setLoading(false);
  }

  async function handleResendOtp() {
    setResending(true);
    setError("");
    await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: registeredEmail }),
    });
    setResending(false);
    setInfo(t("otpResent"));
  }

  const inputClass =
    "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (step === "otp") {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("otpTitle")}</h1>
          <p className="text-gray-600 text-sm mb-6">
            {t("otpSent")} <span className="font-medium">{registeredEmail}</span>
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
          )}
          {info && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{info}</div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className={labelClass}>{t("otpLabel")}</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t("otpPlaceholder")}
                className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={otpCode.length !== 6}
              fullWidth
              size="lg"
            >
              {t("verifyButton")}
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            loading={resending}
            onClick={handleResendOtp}
            fullWidth
            className="mt-3 text-brand-600"
          >
            {t("resendOtp")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("registerTitle")}</h1>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>{t("fullName")}</label>
            <input type="text" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t("username")}</label>
            <input type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t("email")}</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t("phone")}</label>
            <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t("password")}</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t("confirmPassword")}</label>
            <input type="password" required minLength={6} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={inputClass} />
          </div>

          <h2 className="font-semibold text-gray-900 pt-2">{t("address")}</h2>
          <AddressForm
            value={addressForm}
            onChange={setAddressForm}
            idPrefix="register"
          />

          <Button type="submit" loading={loading} fullWidth size="lg">
            {t("registerButton")}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {t("hasAccount")}{" "}
          <MotionLink href="/auth/login" className="text-brand-600 hover:underline inline">
            {t("login")}
          </MotionLink>
        </p>
      </div>
    </div>
  );
}
