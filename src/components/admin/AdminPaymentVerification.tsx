"use client";

import { BANK_ACCOUNT_HOLDER_NAME, getSiteIban } from "@/lib/payment-details";
import { paymentReceiptAccessUrl } from "@/lib/storage-access";
import type { Order } from "@/types";

interface AdminPaymentVerificationProps {
  order: Order;
  defaultIban: string | null;
  labels: {
    title: string;
    iban: string;
    accountHolderName: string;
    viewReceipt: string;
  };
}

export function AdminPaymentVerification({
  order,
  defaultIban,
  labels,
}: AdminPaymentVerificationProps) {
  const receiptAccessUrl = paymentReceiptAccessUrl(order.receipt_url);
  const displayIban = getSiteIban(defaultIban);

  return (
    <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50 p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
        {labels.title}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-sky-900">{labels.iban}</p>
          <p className="font-mono text-sm break-all text-sky-950">
            {displayIban || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-sky-900">{labels.accountHolderName}</p>
          <p className="text-sm font-bold text-sky-950">{BANK_ACCOUNT_HOLDER_NAME}</p>
        </div>
      </div>
      {receiptAccessUrl && (
        <a
          href={receiptAccessUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-brand-600 hover:underline"
        >
          {labels.viewReceipt}
        </a>
      )}
    </div>
  );
}
