"use client";

import { useTranslations, useLocale } from "next-intl";
import { MotionLink } from "@/components/ui/MotionLink";
import { Button } from "@/components/ui/Button";
import type { Order, OrderStatus, Locale, Return } from "@/types";
import { formatCurrency, formatDate, getLocalizedText, cn } from "@/lib/utils";
import { getOrderTracking } from "@/lib/shipping";
import { getPendingReturnForOrder, orderHasActiveReturn, isCustomAwaitingApproval } from "@/lib/orders";
import { canPayCustomOrder } from "@/lib/order-files";

interface OrderTableProps {
  orders: Order[];
  returns?: Return[];
  onRequestReturn?: (orderId: string) => void;
  showReturnButton?: boolean;
  showCustomPayment?: boolean;
  paymentIban?: string | null;
}

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  pending_approval: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  waiting_for_payment: "bg-sky-100 text-sky-800",
  payment_submitted: "bg-orange-100 text-orange-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipping: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  refunded: "bg-gray-100 text-gray-800",
  rejected: "bg-red-100 text-red-800",
};

export function OrderTable({
  orders,
  returns = [],
  onRequestReturn,
  showReturnButton,
  showCustomPayment,
  paymentIban,
}: OrderTableProps) {
  const t = useTranslations("orders");
  const locale = useLocale() as Locale;

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        {t("noOrders")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-start py-3 px-2 font-medium text-gray-500">{t("orderId")}</th>
            <th className="text-start py-3 px-2 font-medium text-gray-500">{t("date")}</th>
            <th className="text-start py-3 px-2 font-medium text-gray-500">{t("status")}</th>
            <th className="text-start py-3 px-2 font-medium text-gray-500">{t("total")}</th>
            <th className="text-start py-3 px-2 font-medium text-gray-500">{t("items")}</th>
            {showCustomPayment && <th className="py-3 px-2" />}
            {showReturnButton && <th className="py-3 px-2" />}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const tracking = getOrderTracking(order);
            const pendingReturn = getPendingReturnForOrder(order.id, returns);
            const canRequestReturn =
              order.status === "delivered" &&
              !orderHasActiveReturn(order.id, returns) &&
              onRequestReturn;
            const payable = showCustomPayment && canPayCustomOrder(order);

            return (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                <td className="py-3 px-2 font-mono text-brand-700 font-medium">{order.id}</td>
                <td className="py-3 px-2 text-gray-600">{formatDate(order.created_at, locale)}</td>
                <td className="py-3 px-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      statusColors[order.status]
                    )}
                  >
                    {t(`statuses.${order.status}`)}
                  </span>
                  {pendingReturn && (
                    <p className="mt-1 text-xs font-medium text-orange-700">
                      {t("refundRequested")}
                    </p>
                  )}
                  {showCustomPayment && isCustomAwaitingApproval(order) && (
                    <p className="mt-1 text-xs text-amber-700">{t("awaitingQuoteApproval")}</p>
                  )}
                  {showCustomPayment && order.status === "waiting_for_payment" && (
                    <p className="mt-1 text-xs text-sky-700">{t("paymentReady")}</p>
                  )}
                </td>
                <td className="py-3 px-2 font-medium">{formatCurrency(order.total_amount, locale)}</td>
                <td className="py-3 px-2 text-gray-600">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="truncate max-w-[220px]">
                      {getLocalizedText(item.product_name, locale)} × {item.quantity}
                    </div>
                  ))}
                  {tracking && (
                    <div className="mt-2 text-xs space-y-0.5 border-t border-gray-100 pt-2">
                      <p className="font-medium text-gray-700">{t("shippingTracking")}</p>
                      <p>{t("shippingCarrier")}: {tracking.shipping_carrier}</p>
                      <p>{t("trackingNumber")}: {tracking.tracking_number}</p>
                      <a
                        href={tracking.shipping_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline inline-block"
                      >
                        {t("trackShipment")}
                      </a>
                    </div>
                  )}
                </td>
                {showCustomPayment && (
                  <td className="py-3 px-2">
                    {payable ? (
                      <div className="space-y-2">
                        {paymentIban && order.status === "waiting_for_payment" && (
                          <p className="text-xs text-gray-600 font-mono break-all max-w-[200px]">
                            {t("iban")}: {paymentIban}
                          </p>
                        )}
                        <MotionLink
                          href={`/orders/${order.id}/payment`}
                          className="inline-flex px-3 py-1.5 bg-brand-500 text-gray-900 text-xs font-semibold rounded-lg hover:bg-brand-600 whitespace-nowrap"
                        >
                          {t("orderNow")}
                        </MotionLink>
                      </div>
                    ) : null}
                  </td>
                )}
                {showReturnButton && (
                  <td className="py-3 px-2">
                    {canRequestReturn ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRequestReturn(order.id)}
                        className="text-xs text-orange-600 hover:text-orange-800 hover:bg-orange-50 px-0"
                      >
                        {t("requestReturn")}
                      </Button>
                    ) : orderHasActiveReturn(order.id, returns) ? (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {t("returnSubmitted")}
                      </span>
                    ) : null}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
