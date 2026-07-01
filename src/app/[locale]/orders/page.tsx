"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { OrderTable } from "@/components/orders/OrderTable";
import { ReturnsTable } from "@/components/orders/ReturnsTable";
import { apiFetch } from "@/lib/utils";
import { filterOrdersByTab, filterReturnsByTab } from "@/lib/orders";
import type { Order, Return, OrderTab } from "@/types";

export default function OrdersPage() {
  const t = useTranslations("orders");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderTab>("active");
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnModal, setReturnModal] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [submitError, setSubmitError] = useState("");

  const tabs = [
    { id: "custom" as OrderTab, label: t("tabs.custom") },
    { id: "active" as OrderTab, label: t("tabs.active") },
    { id: "history" as OrderTab, label: t("tabs.history") },
    { id: "returns" as OrderTab, label: t("tabs.returns") },
  ];

  async function loadData() {
    const [ordersRes, returnsRes] = await Promise.all([
      apiFetch<Order[]>("/api/orders"),
      apiFetch<Return[]>("/api/returns"),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (returnsRes.data) setReturns(returnsRes.data);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      await loadData();
      setLoading(false);
    }
    load();
  }, []);

  async function handleRequestReturn() {
    if (!returnModal || returnReason.length < 5) return;
    setSubmitError("");

    const { ok, error } = await apiFetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: returnModal, reason: returnReason }),
    });

    if (ok) {
      setReturnModal(null);
      setReturnReason("");
      await loadData();
      router.refresh();
      setActiveTab("history");
      return;
    }

    setSubmitError(error ?? t("returnSubmitError"));
  }

  const filteredOrders = filterOrdersByTab(orders, activeTab, returns);
  const filteredReturns = filterReturnsByTab(returns, activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("title")}</h1>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as OrderTab)}
      />

      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">{t("loading")}</div>
        ) : activeTab === "returns" ? (
          <ReturnsTable returns={filteredReturns} />
        ) : (
          <OrderTable
            orders={filteredOrders}
            returns={returns}
            showCustomPayment={activeTab === "custom"}
            showReturnButton={activeTab === "history"}
            onRequestReturn={(id) => {
              setSubmitError("");
              setReturnModal(id);
            }}
          />
        )}
      </div>

      {returnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">{t("requestReturn")}</h3>
            <p className="text-sm text-gray-500 mb-2 font-mono">{returnModal}</p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder={t("returnReason")}
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {submitError && (
              <p className="text-sm text-red-600 mb-3">{submitError}</p>
            )}
            <div className="flex gap-3">
              <Button
                onClick={handleRequestReturn}
                disabled={returnReason.length < 5}
                className="flex-1"
              >
                {t("submitReturn")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setReturnModal(null);
                  setSubmitError("");
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
