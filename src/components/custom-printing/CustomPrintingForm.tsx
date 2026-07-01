"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { validateCustomQuantity, CUSTOM_QUANTITY_MIN, CUSTOM_QUANTITY_STEP } from "@/lib/custom-order";
import { parseJsonText } from "@/lib/utils";
import {
  removeCustomDesignPdfClient,
  uploadCustomDesignPdfClient,
} from "@/lib/upload-order-design-client";
import { Button } from "@/components/ui/Button";

export function CustomPrintingForm() {
  const t = useTranslations("customPrinting");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [designSize, setDesignSize] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setError(t("pdfOnly"));
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!file) {
      setError(t("fileRequired"));
      setLoading(false);
      return;
    }

    if (!designSize.trim()) {
      setError(t("designSizeRequired"));
      setLoading(false);
      return;
    }

    const qty = parseInt(quantity, 10);
    const qtyValidation = validateCustomQuantity(qty);
    if (!qtyValidation.ok) {
      setError(t("quantityInvalid"));
      setLoading(false);
      return;
    }

    const upload = await uploadCustomDesignPdfClient(file);
    if (!upload.ok) {
      setError(upload.error || t("submitError"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/custom-printing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designFileUrl: upload.designFileUrl,
          quantity: qty,
          designSize: designSize.trim(),
        }),
      });
      const raw = await res.text();
      const parsed = parseJsonText<{ success?: boolean; error?: string; data?: { orderId?: string } }>(
        raw,
        { url: "/api/custom-printing", status: res.status }
      );

      if (!parsed.ok) {
        await removeCustomDesignPdfClient(upload.path);
        setError(parsed.error ?? t("submitError"));
        setLoading(false);
        return;
      }

      const data = parsed.data;

      if (!res.ok || !data.success) {
        await removeCustomDesignPdfClient(upload.path);
        if (res.status === 401) {
          setError(t("loginRequired"));
        } else if (res.status === 403) {
          setError(t("verifyRequired"));
        } else {
          setError(data.error ?? t("submitError"));
        }
        setLoading(false);
        return;
      }

      setSuccess(t("submitSuccess", { orderId: data.data?.orderId ?? "" }));
      setFile(null);
      setDesignSize("");
      setQuantity("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      await removeCustomDesignPdfClient(upload.path);
      setError(t("submitError"));
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          {(error === t("loginRequired") || error === t("verifyRequired")) && (
            <span className="block mt-1">
              <Link href="/auth/login" className="underline font-medium">
                {t("loginLink")}
              </Link>
            </span>
          )}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("uploadLabel")}
        </label>
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-400 transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {file ? (
            <p className="text-brand-700 font-medium">{file.name}</p>
          ) : (
            <>
              <p className="text-gray-600 font-medium">{t("uploadHint")}</p>
              <p className="text-sm text-gray-400 mt-1">{t("pdfOnly")}</p>
            </>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="designSize" className="block text-sm font-medium text-gray-700 mb-2">
          {t("designSizeLabel")}
        </label>
        <input
          id="designSize"
          type="text"
          required
          value={designSize}
          onChange={(e) => setDesignSize(e.target.value)}
          placeholder={t("designSizePlaceholder")}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
          {t("quantityLabel")}
        </label>
        <input
          id="quantity"
          type="number"
          min={CUSTOM_QUANTITY_MIN}
          step={CUSTOM_QUANTITY_STEP}
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={t("quantityPlaceholder")}
          className="input-field"
        />
        <p className="text-xs text-gray-500 mt-1">{t("quantityHint")}</p>
      </div>

      <Button type="submit" loading={loading} fullWidth size="lg">
        {loading ? t("submitting") : t("submitButton")}
      </Button>
    </form>
  );
}
