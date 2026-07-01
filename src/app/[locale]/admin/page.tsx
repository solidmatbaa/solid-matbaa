"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { MotionSection } from "@/components/ui/MotionSection";
import { OrderTable } from "@/components/orders/OrderTable";
import { ReturnsTable } from "@/components/orders/ReturnsTable";
import { ProductManager } from "@/components/admin/ProductManager";
import { AdminOrderItems } from "@/components/admin/AdminOrderItems";
import {
  AdminPaymentVerification,
  type AdminPaymentDetailsPayload,
} from "@/components/admin/AdminPaymentVerification";
import { apiFetch, formatCurrency, getLocalizedText } from "@/lib/utils";
import { getNextStatuses } from "@/lib/orders";
import { getOrderTracking } from "@/lib/shipping";
import { formatAdminOrderAddress } from "@/lib/address-data";
import { getOrderDesignFileUrl } from "@/lib/order-files";
import { paymentReceiptAccessUrl } from "@/lib/storage-access";
import type { Order, Return, OrderStatus, Settings, Product, Locale, ShippingInfo, UserAddress } from "@/types";

type AdminTab =
  | "newOrders"
  | "approvedOrders"
  | "products"
  | "content"
  | "returns"
  | "approvedReturns"
  | "archive";

export default function AdminPage() {
  const t = useTranslations("admin");
  const tOrders = useTranslations("orders");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>("newOrders");
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [approvedOrders, setApprovedOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [approvedReturns, setApprovedReturns] = useState<Return[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveResult, setArchiveResult] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  const [actionError, setActionError] = useState("");
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [paymentAction, setPaymentAction] = useState<{
    orderId: string;
    type: "accept" | "reject";
  } | null>(null);
  const [returnActionId, setReturnActionId] = useState<string | null>(null);
  const [shippingModal, setShippingModal] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState<Order | null>(null);
  const [approveForm, setApproveForm] = useState({ price: "", adminNotes: "" });
  const [shippingForm, setShippingForm] = useState<ShippingInfo>({
    tracking_number: "",
    shipping_carrier: "",
    shipping_url: "",
  });

  const tabs = [
    { id: "newOrders", label: t("newOrders") },
    { id: "approvedOrders", label: t("approvedOrders") },
    { id: "products", label: t("products") },
    { id: "content", label: t("websiteContent") },
    { id: "returns", label: t("returns") },
    { id: "approvedReturns", label: t("approvedReturns") },
    { id: "archive", label: t("archiveSearch") },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(options?: { silent?: boolean }) {
    if (!options?.silent) setLoading(true);
    setActionError("");

    const endpoints = {
      newOrders: "/api/admin/orders?section=new",
      approvedOrders: "/api/admin/orders?section=approved",
      products: "/api/products",
      pendingReturns: "/api/returns?section=returns",
      approvedReturns: "/api/returns?section=approvedReturns",
      settings: "/api/settings",
    } as const;

    const settled = await Promise.allSettled([
      apiFetch<Order[]>(endpoints.newOrders),
      apiFetch<Order[]>(endpoints.approvedOrders),
      apiFetch<Product[]>(endpoints.products),
      apiFetch<Return[]>(endpoints.pendingReturns),
      apiFetch<Return[]>(endpoints.approvedReturns),
      apiFetch<Settings>(endpoints.settings),
    ]);

    const unwrap = <T,>(result: PromiseSettledResult<Awaited<ReturnType<typeof apiFetch<T>>>>, key: string) => {
      if (result.status === "fulfilled") return result.value;
      console.error("[admin] loadData request threw", { key, reason: result.reason });
      return { ok: false as const, data: null, error: "Unexpected request failure" };
    };

    const newRes = unwrap<Order[]>(settled[0], "newOrders");
    const approvedRes = unwrap<Order[]>(settled[1], "approvedOrders");
    const productsRes = unwrap<Product[]>(settled[2], "products");
    const pendingReturnsRes = unwrap<Return[]>(settled[3], "pendingReturns");
    const approvedReturnsRes = unwrap<Return[]>(settled[4], "approvedReturns");
    const settingsRes = unwrap<Settings>(settled[5], "settings");

    if (newRes.error?.includes("Forbidden") || newRes.error?.includes("Unauthorized")) {
      router.push("/auth/login");
      if (!options?.silent) setLoading(false);
      return;
    }

    const failures = Object.entries({
      newOrders: newRes,
      approvedOrders: approvedRes,
      products: productsRes,
      pendingReturns: pendingReturnsRes,
      approvedReturns: approvedReturnsRes,
      settings: settingsRes,
    }).filter(([, res]) => !res.ok);

    if (failures.length > 0) {
      const summary = failures
        .map(([name, res]) => `${name}: ${res.error ?? "unknown error"}`)
        .join(" · ");
      console.error("[admin] loadData partial failure", summary);
      setActionError(t("loadDataFailed", { details: summary }));
    }

    if (newRes.data) setNewOrders(newRes.data);
    if (approvedRes.data) setApprovedOrders(approvedRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    if (pendingReturnsRes.data) setReturns(pendingReturnsRes.data);
    if (approvedReturnsRes.data) setApprovedReturns(approvedReturnsRes.data);
    if (settingsRes.data) {
      const defaults = {
        hero_title: { en: "", ar: "", tr: "" },
        hero_subtitle: { en: "", ar: "", tr: "" },
        hero_button_designs: { en: "", ar: "", tr: "" },
        hero_button_custom: { en: "", ar: "", tr: "" },
        instagram_url: "",
        facebook_url: "",
      };
      setSettings({
        ...settingsRes.data,
        site_content: { ...defaults, ...(settingsRes.data.site_content ?? {}) },
      });
    }
    if (!options?.silent) setLoading(false);
  }

  async function updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    shippingInfo?: ShippingInfo,
    rejectionReason?: string
  ) {
    setActionError("");
    const { ok, error } = await apiFetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status, shippingInfo, rejectionReason }),
    });

    if (ok) {
      setShippingModal(null);
      setShippingForm({ tracking_number: "", shipping_carrier: "", shipping_url: "" });
      if (status === "rejected") {
        setNewOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else if (status === "processing") {
        const moved = newOrders.find((o) => o.id === orderId);
        setNewOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (moved) {
          setApprovedOrders((prev) => [{ ...moved, status }, ...prev.filter((o) => o.id !== orderId)]);
        }
      } else if (status === "waiting_for_payment") {
        setNewOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status, receipt_url: null, payment_iban: null, admin_notes: rejectionReason ?? o.admin_notes }
              : o
          )
        );
      } else {
        setApprovedOrders((prev) =>
          prev.map((o) => {
            if (o.id !== orderId) return o;
            const tracking = shippingInfo
              ? {
                  tracking_number: shippingInfo.tracking_number,
                  shipping_carrier: shippingInfo.shipping_carrier,
                  shipping_url: shippingInfo.shipping_url,
                }
              : null;
            return {
              ...o,
              status,
              shipping_info: shippingInfo ?? o.shipping_info,
              ...(tracking ?? {}),
            };
          })
        );
      }
      router.refresh();
      await loadData({ silent: true });
      return;
    }

    setActionError(error ?? t("actionFailed"));
  }

  async function submitApprove(
    order: Order,
    payload?: { price?: number; adminNotes?: string }
  ) {
    setActionError("");
    setApprovingOrderId(order.id);

    try {
      const { ok, error, data } = await apiFetch<{
        orderId: string;
        status: OrderStatus;
        total_amount?: number;
      }>(`/api/admin/orders/${encodeURIComponent(order.id)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload ?? {}),
      });

      if (ok) {
        const newStatus = data?.status ?? (order.order_type === "custom" ? "waiting_for_payment" : "approved");
        if (order.order_type === "custom" && newStatus === "waiting_for_payment") {
          setNewOrders((prev) =>
            prev.map((o) =>
              o.id === order.id
                ? {
                    ...o,
                    status: newStatus,
                    total_amount: data?.total_amount ?? order.total_amount,
                    admin_notes: payload?.adminNotes?.trim() || order.admin_notes,
                  }
                : o
            )
          );
        } else if (newStatus === "approved") {
          setNewOrders((prev) => prev.filter((o) => o.id !== order.id));
          const approvedOrder: Order = {
            ...order,
            status: newStatus,
            total_amount: data?.total_amount ?? order.total_amount,
            admin_notes: payload?.adminNotes?.trim() || order.admin_notes,
          };
          setApprovedOrders((prev) => [approvedOrder, ...prev.filter((o) => o.id !== order.id)]);
        } else {
          setNewOrders((prev) => prev.filter((o) => o.id !== order.id));
        }
        setApproveModal(null);
        setApproveForm({ price: "", adminNotes: "" });
        router.refresh();
        await loadData({ silent: true });
        return;
      }

      setActionError(error ?? t("actionFailed"));
    } catch (err) {
      console.error("[admin] approveOrder failed:", err);
      setActionError(t("actionFailed"));
    } finally {
      setApprovingOrderId(null);
    }
  }

  function startApprove(order: Order) {
    if (order.order_type === "custom") {
      setApproveModal(order);
      setApproveForm({ price: "", adminNotes: "" });
      return;
    }
    void submitApprove(order);
  }

  async function approveOrder(order: Order) {
    startApprove(order);
  }

  function handleStatusChange(orderId: string, status: OrderStatus) {
    if (status === "shipping") {
      setShippingModal(orderId);
      return;
    }
    updateOrderStatus(orderId, status);
  }

  async function acceptPayment(orderId: string) {
    setPaymentAction({ orderId, type: "accept" });
    try {
      await updateOrderStatus(orderId, "processing");
    } finally {
      setPaymentAction(null);
    }
  }

  async function rejectPayment(orderId: string) {
    const reason = window.prompt(t("paymentRejectionPrompt"));
    if (reason === null) return;
    setPaymentAction({ orderId, type: "reject" });
    try {
      await updateOrderStatus(orderId, "waiting_for_payment", undefined, reason.trim() || undefined);
    } finally {
      setPaymentAction(null);
    }
  }

  async function updateReturnStatus(
    returnId: string,
    status: "approved" | "rejected" | "shipping" | "inspecting" | "refunded"
  ) {
    setActionError("");
    setReturnActionId(returnId);
    const { ok, error } = await apiFetch("/api/returns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnId, status }),
    });
    setReturnActionId(null);
    if (ok) {
      await loadData({ silent: true });
      return;
    }
    setActionError(error ?? t("actionFailed"));
  }

  async function searchArchive() {
    if (!archiveSearch.trim()) return;
    const { data } = await apiFetch<Order>(
      `/api/orders?orderId=${encodeURIComponent(archiveSearch.trim())}`
    );
    setArchiveResult(data);
  }

  async function saveSettings() {
    if (!settings) return;
    const { ok } = await apiFetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hero_images: settings.hero_images,
        sizes: settings.sizes,
        iban: settings.iban,
        contact_info: settings.contact_info,
        site_content: settings.site_content,
      }),
    });
    if (ok) {
      setSaveMsg(t("settingsSaved"));
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  function patchOrderInLists(orderId: string, patch: Partial<Order>) {
    setNewOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
    setApprovedOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
    setArchiveResult((prev) => (prev?.id === orderId ? { ...prev, ...patch } : prev));
  }

  async function savePaymentDetails(orderId: string, payload: AdminPaymentDetailsPayload) {
    setActionError("");
    const { ok, error, data } = await apiFetch<{
      orderId: string;
      payment_iban?: string;
    }>(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIban: payload.paymentIban,
      }),
    });

    if (!ok) {
      setActionError(error ?? t("actionFailed"));
      return false;
    }

    patchOrderInLists(orderId, {
      payment_iban: data?.payment_iban ?? payload.paymentIban,
    });
    return true;
  }

  function renderOrderCard(order: Order, showActions = false) {
    const customer = order.profiles as {
      full_name?: string;
      email?: string;
      phone?: string;
      address?: UserAddress | null;
    } | null;
    const tracking = getOrderTracking(order);
    const customItem = order.order_type === "custom" ? (order.order_items?.[0] ?? null) : null;
    const customerAddress = formatAdminOrderAddress(customer?.address);
    const designUrl = getOrderDesignFileUrl(order);
    const receiptAccessUrl = paymentReceiptAccessUrl(order.receipt_url);

    return (
      <div key={order.id} className="card-soft hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <p className="font-mono font-bold text-brand-700">{order.id}</p>
            <p className="text-sm text-gray-500">
              {customer?.full_name ?? t("customer")} · {customer?.email}
            </p>
            <p className="text-sm text-gray-500">{customer?.phone}</p>
            {customerAddress && (
              <p className="text-sm text-gray-500 mt-1">{customerAddress}</p>
            )}
            {order.order_type === "custom" && (
              <div className="mt-2 text-sm text-gray-600 space-y-0.5">
                <p>
                  <span className="font-medium">{t("orderType")}:</span> {t("customOrder")}
                </p>
                {customItem && (
                  <>
                    <p>
                      <span className="font-medium">{t("designSize")}:</span>{" "}
                      {customItem.size ?? customItem.specs?.design_size ?? "—"}
                    </p>
                    <p>
                      <span className="font-medium">{t("quantity")}:</span> {customItem.quantity}
                    </p>
                  </>
                )}
              </div>
            )}
            {order.admin_notes && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">{t("adminNotes")}:</span> {order.admin_notes}
              </p>
            )}
            <p className="text-sm font-medium text-brand-700 mt-1">
              {formatCurrency(order.total_amount, locale)}
            </p>
            {(order.receipt_url ||
              order.account_holder_name ||
              order.payment_iban ||
              order.status === "payment_submitted") && (
              <AdminPaymentVerification
                order={order}
                defaultIban={settings?.iban ?? null}
                labels={{
                  title: t("paymentVerification"),
                  iban: t("iban"),
                  accountHolderName: t("accountHolderName"),
                  edit: t("editPaymentDetails"),
                  save: t("savePaymentDetails"),
                  cancel: t("cancelEdit"),
                  viewReceipt: t("viewReceipt"),
                }}
                onSave={savePaymentDetails}
              />
            )}
            {designUrl && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  {t("customerDesign")}
                </p>
                <a
                  href={designUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 group"
                >
                  <div className="relative w-16 h-20 rounded-lg border border-gray-200 bg-red-50 flex flex-col items-center justify-center shrink-0 group-hover:border-brand-400 transition-colors">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-[10px] font-semibold text-red-700 mt-1">PDF</span>
                  </div>
                  <span className="text-sm font-medium text-brand-600 group-hover:underline">
                    {t("viewDesign")}
                  </span>
                </a>
              </div>
            )}
            {tracking && (
              <div className="mt-2 text-sm text-gray-600 space-y-0.5">
                <p>{t("tracking")}: {tracking.tracking_number}</p>
                <p>{t("shippingCarrier")}: {tracking.shipping_carrier}</p>
                <a
                  href={tracking.shipping_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  {t("trackOrder")}
                </a>
              </div>
            )}
          </div>

          {showActions ? (
            order.status === "pending" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => startApprove(order)}
                  loading={approvingOrderId === order.id}
                >
                  {approvingOrderId === order.id ? t("approving") : t("approveOrder")}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={rejectingOrderId === order.id}
                  onClick={async () => {
                    const reason = window.prompt(t("rejectionReasonPrompt"));
                    if (!reason?.trim()) return;
                    setRejectingOrderId(order.id);
                    try {
                      await updateOrderStatus(order.id, "rejected", undefined, reason.trim());
                    } finally {
                      setRejectingOrderId(null);
                    }
                  }}
                >
                  {t("rejectOrder")}
                </Button>
              </div>
            ) : order.status === "waiting_for_payment" ? (
              <div className="text-sm text-sky-700 bg-sky-50 px-3 py-2 rounded-lg border border-sky-100">
                {t("waitingForCustomer")}
              </div>
            ) : order.status === "payment_submitted" ? (
              <div className="flex flex-col items-end gap-2">
                {receiptAccessUrl && (
                  <a
                    href={receiptAccessUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-600 hover:underline"
                  >
                    {t("viewReceipt")}
                  </a>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptPayment(order.id)}
                    loading={paymentAction?.orderId === order.id && paymentAction.type === "accept"}
                  >
                    {t("acceptPayment")}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => rejectPayment(order.id)}
                    loading={paymentAction?.orderId === order.id && paymentAction.type === "reject"}
                  >
                    {t("rejectPayment")}
                  </Button>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-500">{tOrders(`statuses.${order.status}`)}</span>
            )
          ) : (
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {[order.status, ...getNextStatuses(order.status)].map((s) => (
                <option key={s} value={s}>
                  {tOrders(`statuses.${s}`)}
                </option>
              ))}
            </select>
          )}
        </div>

        <AdminOrderItems
          order={order}
          locale={locale}
          labels={{
            sectionTitle: t("orderItems"),
            product: t("product"),
            quantity: t("quantity"),
            unitPrice: t("unitPrice"),
            price: t("price"),
            size: t("designSize"),
            specifications: t("specifications"),
            noLineItems: t("noLineItems"),
            customOrder: t("customOrder"),
            viewProduct: t("viewProduct"),
            externalLink: t("externalLink"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container max-w-7xl">
      <MotionSection className="mb-8">
        <h1 className="section-title">{t("dashboard")}</h1>
      </MotionSection>

      {actionError && (
        <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm">{actionError}</div>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as AdminTab)} />

      <MotionSection delay={0.05} className="mt-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">{t("loading")}</div>
        ) : activeTab === "newOrders" ? (
          <div className="space-y-6">
            <h2 className="font-semibold text-gray-900 text-lg">{t("newOrders")}</h2>
            {newOrders.length === 0 ? (
              <p className="text-gray-500 py-12 text-center card-soft">{t("noNewOrders")}</p>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {newOrders.map((order) => renderOrderCard(order, true))}
              </div>
            )}
          </div>
        ) : activeTab === "approvedOrders" ? (
          <div className="space-y-6">
            <h2 className="font-semibold text-gray-900 text-lg">{t("approvedOrders")}</h2>
            {approvedOrders.length === 0 ? (
              <p className="text-gray-500 py-12 text-center card-soft">{t("noApprovedOrders")}</p>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {approvedOrders.map((order) => renderOrderCard(order))}
              </div>
            )}
          </div>
        ) : activeTab === "products" ? (
          <ProductManager products={products} onRefresh={loadData} />
        ) : activeTab === "content" && settings?.site_content ? (
          <div className="card max-w-2xl space-y-6">
            <h2 className="font-semibold text-gray-900">{t("websiteContent")}</h2>
            {saveMsg && (
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm">{saveMsg}</div>
            )}

            {(["hero_title", "hero_subtitle", "hero_button_designs", "hero_button_custom"] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t(field)}</label>
                {(["ar", "en", "tr"] as Locale[]).map((l) => (
                  <input
                    key={l}
                    value={settings.site_content![field][l]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        site_content: {
                          ...settings.site_content!,
                          [field]: { ...settings.site_content![field], [l]: e.target.value },
                        },
                      })
                    }
                    placeholder={`${field} (${l})`}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-2"
                  />
                ))}
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("iban")}</label>
              <input
                value={settings.iban ?? ""}
                onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("heroImages")}</label>
              <input
                value={settings.hero_images.join(", ")}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hero_images: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>

            <Button onClick={saveSettings}>{t("saveSettings")}</Button>
          </div>
        ) : activeTab === "returns" ? (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4 text-lg">{t("pendingReturns")}</h2>
            <ReturnsTable
              returns={returns}
              isAdmin
              onUpdateStatus={updateReturnStatus}
              loadingReturnId={returnActionId}
            />
          </div>
        ) : activeTab === "approvedReturns" ? (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4 text-lg">{t("approvedReturns")}</h2>
            {approvedReturns.length === 0 ? (
              <p className="text-gray-500 py-12 text-center card-soft">{t("noApprovedReturns")}</p>
            ) : (
              <ReturnsTable
                returns={approvedReturns}
                isAdmin
                onUpdateStatus={updateReturnStatus}
                loadingReturnId={returnActionId}
              />
            )}
          </div>
        ) : activeTab === "archive" ? (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">{t("searchByOrderId")}</h2>
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <input
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                placeholder="SM-20250630-1001"
                className="input-field font-mono flex-1"
              />
              <Button onClick={searchArchive}>{t("search")}</Button>
            </div>
            {archiveResult && (
              <div className="card-soft">
                <p className="font-mono font-bold text-brand-700 mb-2">{archiveResult.id}</p>
                <p className="text-sm text-gray-500 mb-2">
                  Status: {tOrders(`statuses.${archiveResult.status}`)}
                </p>
                {(() => {
                  const customer = archiveResult.profiles as {
                    full_name?: string;
                    email?: string;
                    phone?: string;
                    address?: UserAddress | null;
                  } | null;
                  const customerAddress = formatAdminOrderAddress(customer?.address);
                  return customerAddress ? (
                    <p className="text-sm text-gray-500 mb-2">{customerAddress}</p>
                  ) : null;
                })()}
                <OrderTable orders={[archiveResult]} />
              </div>
            )}
          </div>
        ) : null}
      </MotionSection>

      {shippingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">{t("shippingDetails")}</h3>
            <div className="space-y-3 mb-4">
              <input
                placeholder={t("trackingNumber")}
                value={shippingForm.tracking_number}
                onChange={(e) => setShippingForm({ ...shippingForm, tracking_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
              <input
                placeholder={t("shippingCarrier")}
                value={shippingForm.shipping_carrier}
                onChange={(e) =>
                  setShippingForm({ ...shippingForm, shipping_carrier: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
              <input
                placeholder={t("trackingUrl")}
                value={shippingForm.shipping_url}
                onChange={(e) =>
                  setShippingForm({ ...shippingForm, shipping_url: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => updateOrderStatus(shippingModal, "shipping", shippingForm)}
                disabled={
                  !shippingForm.tracking_number ||
                  !shippingForm.shipping_carrier ||
                  !shippingForm.shipping_url
                }
                fullWidth
              >
                {t("saveShipping")}
              </Button>
              <Button variant="secondary" onClick={() => setShippingModal(null)}>
                {t("cancelEdit")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {approveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-1">{t("approveCustomOrder")}</h3>
            <p className="text-sm text-gray-500 font-mono mb-4">{approveModal.id}</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("quotedPrice")} (EUR)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={approveForm.price}
                  onChange={(e) => setApproveForm({ ...approveForm, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("adminNotes")}
                </label>
                <textarea
                  value={approveForm.adminNotes}
                  onChange={(e) =>
                    setApproveForm({ ...approveForm, adminNotes: e.target.value })
                  }
                  rows={3}
                  placeholder={t("adminNotesPlaceholder")}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                fullWidth
                loading={approvingOrderId === approveModal.id}
                onClick={() => {
                  const price = parseFloat(approveForm.price);
                  if (!price || price <= 0) {
                    setActionError(t("priceRequired"));
                    return;
                  }
                  void submitApprove(approveModal, {
                    price,
                    adminNotes: approveForm.adminNotes.trim() || undefined,
                  });
                }}
              >
                {approvingOrderId === approveModal.id ? t("approving") : t("approveOrder")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setApproveModal(null);
                  setApproveForm({ price: "", adminNotes: "" });
                }}
              >
                {t("cancelEdit")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
