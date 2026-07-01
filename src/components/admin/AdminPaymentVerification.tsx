"use client";

import { useEffect, useState } from "react";
import { BANK_ACCOUNT_HOLDER_NAME } from "@/lib/payment-details";
import { Button } from "@/components/ui/Button";
import { paymentReceiptAccessUrl } from "@/lib/storage-access";
import type { Order } from "@/types";

export interface AdminPaymentDetailsPayload {
  paymentIban: string;
}

interface AdminPaymentVerificationProps {
  order: Order;
  defaultIban: string | null;
  labels: {
    title: string;
    iban: string;
    accountHolderName: string;
    edit: string;
    save: string;
    cancel: string;
    viewReceipt: string;
  };
  onSave: (orderId: string, payload: AdminPaymentDetailsPayload) => Promise<boolean>;
}

export function AdminPaymentVerification({
  order,
  defaultIban,
  labels,
  onSave,
}: AdminPaymentVerificationProps) {
  const [editing, setEditing] = useState(false);
  const [paymentIban, setPaymentIban] = useState(order.payment_iban ?? defaultIban ?? "");
  const [saving, setSaving] = useState(false);
  const receiptAccessUrl = paymentReceiptAccessUrl(order.receipt_url);

  useEffect(() => {
    setPaymentIban(order.payment_iban ?? defaultIban ?? "");
    setEditing(false);
  }, [order.id, order.payment_iban, defaultIban]);

  async function handleSave() {
    const iban = paymentIban.trim();
    if (!iban) return;

    setSaving(true);
    const ok = await onSave(order.id, { paymentIban: iban });
    setSaving(false);
    if (ok) setEditing(false);
  }

  function handleCancel() {
    setPaymentIban(order.payment_iban ?? defaultIban ?? "");
    setEditing(false);
  }

  return (
    <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50 p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
        {labels.title}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-sky-900">{labels.iban}</p>
          {editing ? (
            <input
              type="text"
              value={paymentIban}
              onChange={(e) => setPaymentIban(e.target.value)}
              className="mt-1 w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          ) : (
            <p className="font-mono text-sm break-all text-sky-950">
              {order.payment_iban || defaultIban || "—"}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-sky-900">{labels.accountHolderName}</p>
          <p className="text-sm font-bold text-sky-950">{BANK_ACCOUNT_HOLDER_NAME}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {receiptAccessUrl && (
          <a
            href={receiptAccessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-600 hover:underline"
          >
            {labels.viewReceipt}
          </a>
        )}
        {editing ? (
          <>
            <Button size="sm" onClick={() => void handleSave()} loading={saving} disabled={!paymentIban.trim()}>
              {labels.save}
            </Button>
            <Button size="sm" variant="secondary" onClick={handleCancel}>
              {labels.cancel}
            </Button>
          </>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            {labels.edit}
          </Button>
        )}
      </div>
    </div>
  );
}
