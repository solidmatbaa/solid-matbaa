"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { apiFetch, getLocalizedText, DEFAULT_PRICING_TIERS } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { Product, Locale, PricingTier } from "@/types";

interface ProductManagerProps {
  products: Product[];
  onRefresh: () => void;
}

export function ProductManager({ products, onRefresh }: ProductManagerProps) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    description_ar: "",
    image_url: "",
    tier100: "19",
    tier500: "39",
    tier1000: "69",
  });
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditing(null);
    setForm({
      name_ar: "",
      name_en: "",
      description_ar: "",
      image_url: "",
      tier100: "19",
      tier500: "39",
      tier1000: "69",
    });
  }

  function startEdit(product: Product) {
    setEditing(product);
    const tiers = product.pricing_tiers?.length > 0 ? product.pricing_tiers : DEFAULT_PRICING_TIERS;
    setForm({
      name_ar: product.name.ar,
      name_en: product.name.en,
      description_ar: product.description.ar,
      image_url: product.image_url ?? "",
      tier100: String(tiers.find((t) => t.quantity === 100)?.price ?? 19),
      tier500: String(tiers.find((t) => t.quantity === 500)?.price ?? 39),
      tier1000: String(tiers.find((t) => t.quantity === 1000)?.price ?? 69),
    });
  }

  async function handleSave() {
    setSaving(true);
    const pricing_tiers: PricingTier[] = [
      { quantity: 100, price: parseFloat(form.tier100) || 19 },
      { quantity: 500, price: parseFloat(form.tier500) || 39 },
      { quantity: 1000, price: parseFloat(form.tier1000) || 69 },
    ];

    const payload = {
      name: { en: form.name_en, ar: form.name_ar, tr: form.name_ar },
      description: { en: form.description_ar, ar: form.description_ar, tr: form.description_ar },
      price: pricing_tiers[0].price,
      pricing_tiers,
      image_url: form.image_url || null,
      sizes: [],
      specs: [],
      is_active: true,
    };

    if (editing) {
      await apiFetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...payload }),
      });
    } else {
      await apiFetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    resetForm();
    onRefresh();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    await apiFetch(`/api/products?id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          {editing ? t("editProduct") : t("addProduct")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input placeholder={t("nameAr")} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-lg" />
          <input placeholder={t("nameEn")} value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-lg" />
          <input placeholder={t("descriptionAr")} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-lg sm:col-span-2" />
          <input placeholder={t("imageUrl")} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-lg sm:col-span-2" />
          <input placeholder="100 pcs price (€)" type="number" value={form.tier100} onChange={(e) => setForm({ ...form, tier100: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-lg" />
          <input placeholder="500 pcs price (€)" type="number" value={form.tier500} onChange={(e) => setForm({ ...form, tier500: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-lg" />
          <input placeholder="1000 pcs price (€)" type="number" value={form.tier1000} onChange={(e) => setForm({ ...form, tier1000: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-lg sm:col-span-2" />
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleSave} loading={saving}>
            {saving ? t("saving") : t("saveProduct")}
          </Button>
          {editing && (
            <Button variant="secondary" onClick={resetForm}>
              {t("cancelEdit")}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{getLocalizedText(product.name, locale)}</p>
              <p className="text-sm text-gray-500">
                100→{product.pricing_tiers?.[0]?.price ?? 19}€ · 500→{product.pricing_tiers?.[1]?.price ?? 39}€ · 1000→{product.pricing_tiers?.[2]?.price ?? 69}€
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => startEdit(product)}>
                {t("edit")}
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(product.id)}>
                {t("delete")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
