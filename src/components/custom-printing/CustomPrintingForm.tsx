"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { validateCustomQuantity, CUSTOM_QUANTITY_MIN, CUSTOM_QUANTITY_STEP } from "@/lib/custom-order";
import { parseJsonText, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/** Vercel serverless request body limit — validate before upload. */
const MAX_PDF_SIZE_BYTES = 4.5 * 1024 * 1024;

function isPdfTooLarge(file: File): boolean {
  return file.size > MAX_PDF_SIZE_BYTES;
}

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
  const [fileTooLarge, setFileTooLarge] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setError(t("pdfOnly"));
      setFile(null);
      setFileTooLarge(false);
      return;
    }

    if (isPdfTooLarge(selected)) {
      setError(t("fileTooLarge"));
      setFile(selected);
      setFileTooLarge(true);
      return;
    }

    setError("");
    setFileTooLarge(false);
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

    if (isPdfTooLarge(file)) {
      setError(t("fileTooLarge"));
      setFileTooLarge(true);
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

    const formData = new FormData();
    formData.append("file", file);
    formData.append("quantity", String(qty));
    formData.append("designSize", designSize.trim());

    try {
      const res = await fetch("/api/custom-printing", {
        method: "POST",
        body: formData,
      });
      const raw = await res.text();
      const parsed = parseJsonText<{ success?: boolean; error?: string; data?: { orderId?: string } }>(
        raw,
        { url: "/api/custom-printing", status: res.status }
      );

      if (!parsed.ok) {
        setError(parsed.error ?? t("submitError"));
        setLoading(false);
        return;
      }

      const data = parsed.data;

      if (!res.ok || !data.success) {
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
      setFileTooLarge(false);
      setDesignSize("");
      setQuantity("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError(t("submitError"));
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      {error && (
        <div
          role="alert"
          className={cn(
            "px-4 py-3 rounded-lg text-sm border",
            fileTooLarge
              ? "bg-amber-50 text-amber-950 border-amber-300"
              : "bg-red-50 text-red-700 border-red-200"
          )}
        >
          <p className="font-medium leading-relaxed">{error}</p>
          {fileTooLarge && (
            <a
              href="mailto:info@solidmatbaa.com"
              className="mt-2 inline-block text-sm font-semibold text-brand-700 underline hover:text-brand-800"
            >
              info@solidmatbaa.com
            </a>
          )}
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
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
            fileTooLarge
              ? "border-amber-400 bg-amber-50/50"
              : "border-gray-200 hover:border-brand-400"
          )}
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
            <>
              <p className={cn("font-medium", fileTooLarge ? "text-amber-900" : "text-brand-700")}>
                {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 font-medium">{t("uploadHint")}</p>
              <p className="text-sm text-gray-400 mt-1">{t("pdfOnly")}</p>
              <p className="text-sm text-gray-400 mt-1">{t("maxFileSize")}</p>
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

      <Button type="submit" loading={loading} disabled={fileTooLarge} fullWidth size="lg">
        {loading ? t("submitting") : t("submitButton")}
      </Button>
    </form>
  );
}
