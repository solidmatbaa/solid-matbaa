"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { PhoneNumberInput, isPhoneNumberValid } from "@/components/ui/PhoneNumberInput";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/utils";
import { formatAddressPath } from "@/lib/address-data";
import type { Profile, Locale, UserAddress } from "@/types";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const locale = useLocale() as Locale;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<Profile>("/api/profile").then(({ data }) => {
      if (data) {
        setProfile(data);
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
      }
    });
  }, []);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!isPhoneNumberValid(phone)) {
      setError(t("phoneInvalid"));
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { ok, error: err } = await apiFetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, phone, locale }),
    });

    setLoading(false);
    if (ok) setMessage(t("profileUpdated"));
    else setError(err ?? t("updateError"));
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile?.email ?? "",
      password: currentPassword,
    });

    if (signInError) {
      setLoading(false);
      setError(t("wrongPassword"));
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) setError(updateError.message);
    else {
      setMessage(t("passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  const address = profile?.address as UserAddress | null;

  return (
    <AuthGuard>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

        {message && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">{message}</div>}
        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t("editProfile")}</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")}</label>
              <input type="email" value={profile?.email ?? ""} disabled className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("fullName")}</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("phone")}</label>
              <PhoneNumberInput
                id="profile-phone"
                required
                value={phone}
                onChange={setPhone}
              />
            </div>
            {address && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg space-y-1">
                <p>{address.street} {address.building_number}, {address.apartment_number}</p>
                <p>{formatAddressPath(address)}</p>
              </div>
            )}
            <Button type="submit" loading={loading}>
              {t("saveProfile")}
            </Button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t("changePassword")}</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("currentPassword")}</label>
              <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("newPassword")}</label>
              <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("confirmPassword")}</label>
              <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
            </div>
            <Button type="submit" loading={loading}>
              {t("updatePassword")}
            </Button>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
