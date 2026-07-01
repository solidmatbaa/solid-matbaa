"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useCart } from "@/context/CartContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AddressForm } from "@/components/address/AddressForm";
import { Button } from "@/components/ui/Button";
import {
  addressFormToUserAddress,
  getDefaultAddressFormValues,
  isAddressFormComplete,
  userAddressToAddressForm,
  type AddressFormValues,
} from "@/lib/address-data";
import { apiFetch, fetchJson, formatCurrency, getLocalizedText, resolveProductImageUrl } from "@/lib/utils";
import { getSiteIban, stripPaymentIbanFromPayload } from "@/lib/payment-details";
import { BankAccountHolderDisplay } from "@/components/checkout/BankAccountHolderDisplay";
import type { Locale, Profile, Settings } from "@/types";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;
  const { items, total, clearCart } = useCart();
  const router = useRouter();

  const [iban, setIban] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormValues>(
    getDefaultAddressFormValues()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    apiFetch<Settings>("/api/settings").then(({ data }) => {
      setIban(getSiteIban(data?.iban));
    });
  }, []);

  useEffect(() => {
    apiFetch<Profile>("/api/profile").then(({ data }) => {
      if (data?.address) {
        setAddressForm(userAddressToAddressForm(data.address));
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receiptFile) {
      setError(t("receiptRequired"));
      return;
    }

    if (!isAddressFormComplete(addressForm)) {
      setError(t("addressIncomplete"));
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("receipt", receiptFile);
    formData.append("items", JSON.stringify(items));
    formData.append("total", String(total));
    formData.append(
      "address",
      JSON.stringify(stripPaymentIbanFromPayload(addressFormToUserAddress(addressForm)))
    );

    const { data, error: requestError, ok } = await fetchJson<{
      success: boolean;
      data?: { orderId: string };
      error?: string;
    }>("/api/checkout", { method: "POST", body: formData });

    setLoading(false);

    if (!ok || !data?.success) {
      setError(data?.error ?? requestError ?? t("orderError"));
      return;
    }

    setOrderId(data.data?.orderId ?? "");
    clearCart();
  }

  if (items.length === 0 && !orderId) {
    return (
      <AuthGuard>
        <div className="max-w-lg mx-auto px-4 py-16 text-center text-gray-500">
          {t("emptyCart")}
        </div>
      </AuthGuard>
    );
  }

  if (orderId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("orderSuccess")}</h1>
        <p className="text-gray-600 mb-1">{t("orderId")}</p>
        <p className="font-mono text-brand-700 text-lg font-bold mb-2">{orderId}</p>
        <p className="text-sm text-gray-500 mb-6">{t("orderPendingReview")}</p>
        <Button onClick={() => router.push("/orders")}>{t("viewOrders")}</Button>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="page-container max-w-3xl">
        <h1 className="section-title mb-8">{t("title")}</h1>

        <div className="card mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{t("cartSummary")}</h2>
          {items.map((item) => (
            <div key={`${item.productId}-${item.tierQuantity}`} className="flex gap-3 items-center">
              <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 shrink-0">
                <Image
                  src={resolveProductImageUrl(item.imageUrl)}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{getLocalizedText(item.productName, locale)}</p>
                <p className="text-gray-500">
                  {item.tierQuantity} {t("pieces")} × {item.quantity}
                </p>
              </div>
              <p className="font-medium text-brand-700">
                {formatCurrency(item.price * item.quantity, locale)}
              </p>
            </div>
          ))}
          <div className="border-t pt-3 flex justify-between font-semibold">
            <span>{t("total")}</span>
            <span className="text-brand-700">{formatCurrency(total, locale)}</span>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t("shippingAddress")}</h2>
          <AddressForm
            value={addressForm}
            onChange={setAddressForm}
            idPrefix="checkout"
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 mb-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-amber-900">{t("bankTransfer")}</h2>
          <p className="text-sm text-amber-800">{t("bankTransferDesc")}</p>
          <div>
            <p className="text-xs font-medium text-amber-900 mb-1">{t("iban")}</p>
            <p className="font-mono text-sm bg-white px-3 py-2 rounded border border-amber-200 break-all">
              {iban || "—"}
            </p>
          </div>
          <BankAccountHolderDisplay label={t("accountHolderName")} />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("uploadReceipt")} *
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              required
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-brand-50 file:text-brand-700"
            />
            <p className="text-xs text-gray-500 mt-1">{t("receiptHint")}</p>
          </div>

          <Button type="submit" loading={loading} fullWidth size="lg">
            {loading ? t("submitting") : t("submitOrder")}
          </Button>
        </form>
      </div>
    </AuthGuard>
  );
}
