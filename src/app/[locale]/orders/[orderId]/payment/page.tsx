"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { apiFetch, formatCurrency, getLocalizedText } from "@/lib/utils";
import { BankAccountHolderDisplay } from "@/components/checkout/BankAccountHolderDisplay";
import { canPayCustomOrder } from "@/lib/order-files";
import type { Locale, Order, Settings } from "@/types";

export default function CustomOrderPaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const t = useTranslations("customPayment");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [iban, setIban] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    params.then(({ orderId: id }) => setOrderId(id));
  }, [params]);

  useEffect(() => {
    if (!orderId) return;

    async function load() {
      setLoading(true);
      setError("");

      const [ordersRes, settingsRes] = await Promise.all([
        apiFetch<Order[]>("/api/orders"),
        apiFetch<Settings>("/api/settings"),
      ]);

      if (settingsRes.data?.iban) setIban(settingsRes.data.iban);

      const match = ordersRes.data?.find((o) => o.id === orderId) ?? null;
      if (!match) {
        setError(t("orderNotFound"));
        setOrder(null);
      } else if (!canPayCustomOrder(match)) {
        setError(t("notPayable"));
        setOrder(match);
      } else {
        setOrder(match);
        if (match.payment_iban) setIban(match.payment_iban);
      }

      setLoading(false);
    }

    void load();
  }, [orderId, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receiptFile || !orderId) {
      setError(t("receiptRequired"));
      return;
    }

    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("receipt", receiptFile);

    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/payment`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    setSubmitting(false);

    if (!res.ok || !data.success) {
      setError(data.error ?? t("submitError"));
      return;
    }

    setSuccess(true);
  }

  const item = order?.order_items?.[0];

  return (
    <AuthGuard>
      <div className="page-container max-w-3xl">
        <h1 className="section-title mb-2">{t("title")}</h1>
        {orderId && (
          <p className="text-sm text-gray-500 font-mono mb-6">{orderId}</p>
        )}

        {loading ? (
          <p className="text-gray-500">{t("loading")}</p>
        ) : success ? (
          <div className="card text-center">
            <h2 className="text-lg font-semibold text-green-800 mb-2">{t("successTitle")}</h2>
            <p className="text-green-700 mb-4">{t("successMessage")}</p>
            <Button onClick={() => router.push("/orders")}>{t("backToOrders")}</Button>
          </div>
        ) : error && !order ? (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        ) : order ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card space-y-3">
              <h2 className="font-semibold text-gray-900">{t("orderSummary")}</h2>
              {item && (
                <p className="text-sm text-gray-600">
                  {getLocalizedText(item.product_name, locale)} · {item.quantity} {t("pieces")}
                </p>
              )}
              <p className="text-2xl font-bold text-brand-700">
                {formatCurrency(order.total_amount, locale)}
              </p>
              {order.admin_notes && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t("adminNotes")}:</span> {order.admin_notes}
                </p>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              <h2 className="font-semibold text-amber-900">{t("bankTransfer")}</h2>
              <p className="text-sm text-amber-800">{t("bankTransferDesc")}</p>
              {iban && (
                <div>
                  <p className="text-xs font-medium text-amber-900 mb-1">{t("iban")}</p>
                  <p className="font-mono text-sm bg-white px-3 py-2 rounded border border-amber-200 break-all">
                    {iban}
                  </p>
                </div>
              )}
              <BankAccountHolderDisplay label={t("accountHolderName")} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("uploadReceipt")} *
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
              <p className="text-xs text-gray-500 mt-1">{t("receiptHint")}</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <Button
              type="submit"
              loading={submitting}
              disabled={!receiptFile}
              fullWidth
              size="lg"
            >
              {submitting ? t("submitting") : t("submitPayment")}
            </Button>
          </form>
        ) : null}
      </div>
    </AuthGuard>
  );
}
