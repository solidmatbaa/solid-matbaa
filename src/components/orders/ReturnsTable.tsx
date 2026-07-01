"use client";

import { useTranslations } from "next-intl";
import type { Return, ReturnStatus } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import type { Locale } from "@/types";
import { getNextReturnStatuses, getReturnActionLabel } from "@/lib/orders";
import { getOrderTracking } from "@/lib/shipping";
import { Button } from "@/components/ui/Button";

interface ReturnsTableProps {
  returns: Return[];
  isAdmin?: boolean;
  loadingReturnId?: string | null;
  onUpdateStatus?: (
    returnId: string,
    status: "approved" | "rejected" | "shipping" | "inspecting" | "refunded"
  ) => void;
}

const statusColors: Record<ReturnStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  shipping: "bg-purple-100 text-purple-800",
  inspecting: "bg-indigo-100 text-indigo-800",
  refunded: "bg-gray-100 text-gray-800",
};

export function ReturnsTable({ returns, isAdmin, onUpdateStatus, loadingReturnId }: ReturnsTableProps) {
  const t = useTranslations("orders");
  const tAdmin = useTranslations("admin");
  const locale = useLocale() as Locale;

  if (returns.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {isAdmin ? tAdmin("noPendingReturns") : t("noOrders")}
      </div>
    );
  }

  function renderAdminActions(ret: Return) {
    if (!isAdmin || !onUpdateStatus) return null;

    if (ret.status === "pending") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            loading={loadingReturnId === ret.id}
            onClick={() => onUpdateStatus(ret.id, "approved")}
          >
            {tAdmin("approveReturn")}
          </Button>
          <Button
            size="sm"
            variant="danger"
            loading={loadingReturnId === ret.id}
            onClick={() => onUpdateStatus(ret.id, "rejected")}
          >
            {tAdmin("rejectReturn")}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {getNextReturnStatuses(ret.status).map((nextStatus) => (
          <Button
            key={nextStatus}
            size="sm"
            className="text-xs px-2 py-1"
            onClick={() =>
              onUpdateStatus(
                ret.id,
                nextStatus as "approved" | "rejected" | "shipping" | "inspecting" | "refunded"
              )
            }
          >
            {tAdmin(getReturnActionLabel(nextStatus))}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-start py-3 px-2 font-medium text-gray-500">{t("orderId")}</th>
            <th className="text-start py-3 px-2 font-medium text-gray-500">{t("date")}</th>
            <th className="text-start py-3 px-2 font-medium text-gray-500">{t("returnReason")}</th>
            <th className="text-start py-3 px-2 font-medium text-gray-500">{t("status")}</th>
            {!isAdmin && (
              <th className="text-start py-3 px-2 font-medium text-gray-500">{t("details")}</th>
            )}
            {isAdmin && <th className="py-3 px-2" />}
          </tr>
        </thead>
        <tbody>
          {returns.map((ret) => {
            const linkedOrder = ret.orders;
            const tracking = linkedOrder ? getOrderTracking(linkedOrder) : null;

            return (
              <tr key={ret.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                <td className="py-3 px-2 font-mono text-brand-700">{ret.order_id}</td>
                <td className="py-3 px-2 text-gray-600">{formatDate(ret.created_at, locale)}</td>
                <td className="py-3 px-2 text-gray-700 max-w-[220px]">
                  <p className="whitespace-pre-wrap break-words">{ret.reason}</p>
                  {linkedOrder?.total_amount != null && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(linkedOrder.total_amount, locale)}
                    </p>
                  )}
                </td>
                <td className="py-3 px-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      statusColors[ret.status]
                    )}
                  >
                    {t(`returnStatuses.${ret.status}`)}
                  </span>
                </td>
                {!isAdmin && (
                  <td className="py-3 px-2 text-gray-600 text-xs space-y-1">
                    {ret.admin_notes && (
                      <p>
                        <span className="font-medium">{t("adminNotes")}:</span> {ret.admin_notes}
                      </p>
                    )}
                    {tracking && (
                      <div>
                        <p>{t("shippingCarrier")}: {tracking.shipping_carrier}</p>
                        <p>{t("trackingNumber")}: {tracking.tracking_number}</p>
                        <a
                          href={tracking.shipping_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          {t("trackShipment")}
                        </a>
                      </div>
                    )}
                  </td>
                )}
                {isAdmin && (
                  <td className="py-3 px-2">{renderAdminActions(ret)}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
