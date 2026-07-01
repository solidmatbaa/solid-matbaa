import type { UserAddress } from "@/types";
import { formatAddressPath } from "@/lib/address-data";

export const CUSTOM_QUANTITY_MIN = 1000;
export const CUSTOM_QUANTITY_STEP = 1000;

export function validateCustomQuantity(
  quantity: number
): { ok: true } | { ok: false; error: string } {
  if (!Number.isInteger(quantity)) {
    return { ok: false, error: "Quantity must be a whole number" };
  }
  if (quantity < CUSTOM_QUANTITY_MIN) {
    return {
      ok: false,
      error: `Minimum quantity is ${CUSTOM_QUANTITY_MIN}`,
    };
  }
  if (quantity % CUSTOM_QUANTITY_STEP !== 0) {
    return {
      ok: false,
      error: `Quantity must be in increments of ${CUSTOM_QUANTITY_STEP}`,
    };
  }
  return { ok: true };
}

export function formatProfileAddress(address: UserAddress | null | undefined): string {
  if (!address) return "";
  const parts = [
    address.street,
    address.building_number && `#${address.building_number}`,
    address.apartment_number && `Apt ${address.apartment_number}`,
    formatAddressPath(address),
    address.additional_details,
  ].filter(Boolean);
  return parts.join(", ");
}
