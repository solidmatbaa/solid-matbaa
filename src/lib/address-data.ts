import type { UserAddress } from "@/types";
import {
  COUNTRY_LIST,
  getCountryAddressConfig,
  isFieldRequired,
  isFieldShown,
  type AddressFieldName,
  type CountryAddressConfig,
  type SupportedCountry,
} from "@/lib/address-country-config";

export { COUNTRY_LIST, getCountryAddressConfig, isFieldRequired, isFieldShown };
export type { SupportedCountry, AddressFieldName };

/** Form state for the hierarchical address picker. */
export interface AddressFormValues {
  country: string;
  province: string;
  city: string;
  district: string;
  neighborhood: string;
  streetName: string;
  buildingNumber: string;
  apartmentNumber: string;
  postalCode: string;
  additionalDetails: string;
}

export function getCountries(): string[] {
  return [...COUNTRY_LIST];
}

async function fetchAddressLevel<T>(
  params: Record<string, string>
): Promise<T[]> {
  const search = new URLSearchParams(params);
  const res = await fetch(`/api/address?${search.toString()}`);
  const json = (await res.json()) as { data?: T[]; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Failed to load address data");
  return json.data ?? [];
}

export function fetchProvinces(country: string): Promise<string[]> {
  return fetchAddressLevel({ country, level: "provinces" });
}

export function fetchDistricts(country: string, province: string): Promise<string[]> {
  return fetchAddressLevel({ country, province, level: "districts" });
}

export function fetchNeighborhoods(
  country: string,
  province: string,
  districtOrCity: string
): Promise<string[]> {
  return fetchAddressLevel({
    country,
    province,
    district: districtOrCity,
    level: "neighborhoods",
  });
}

const GEO_CASCADE_FIELDS: AddressFieldName[] = ["state", "city", "district", "neighborhood"];

const EMPTY_DETAIL_FIELDS = {
  streetName: "",
  buildingNumber: "",
  apartmentNumber: "",
  postalCode: "",
  additionalDetails: "",
} as const;

export type AddressFormVisibility = {
  country: boolean;
  state: boolean;
  city: boolean;
  district: boolean;
  neighborhood: boolean;
  street: boolean;
  buildingNumber: boolean;
  apartmentNumber: boolean;
  postalCode: boolean;
  additionalDetails: boolean;
};

function getGeoFieldValue(form: AddressFormValues, field: AddressFieldName): string {
  switch (field) {
    case "state":
      return form.province;
    case "city":
      return form.city;
    case "district":
      return form.district;
    case "neighborhood":
      return form.neighborhood;
    default:
      return "";
  }
}

/** Ordered geo dropdowns configured for a country (e.g. state → city → neighborhood). */
export function getGeoCascadeOrder(config: CountryAddressConfig): AddressFieldName[] {
  return GEO_CASCADE_FIELDS.filter((field) => isFieldShown(config, field));
}

/** Step-by-step visibility: each field appears only after its parent is selected. */
export function getAddressFieldVisibility(
  form: AddressFormValues,
  config: CountryAddressConfig | null
): AddressFormVisibility {
  const hidden: AddressFormVisibility = {
    country: true,
    state: false,
    city: false,
    district: false,
    neighborhood: false,
    street: false,
    buildingNumber: false,
    apartmentNumber: false,
    postalCode: false,
    additionalDetails: false,
  };

  if (!config || !form.country.trim()) {
    return hidden;
  }

  const visibility: AddressFormVisibility = { ...hidden };
  const geoOrder = getGeoCascadeOrder(config);

  let parentSelected = true;
  for (const field of geoOrder) {
    if (!parentSelected) break;
    visibility[field] = true;
    parentSelected = getGeoFieldValue(form, field).trim().length > 0;
  }

  if (isGeoSelectionComplete(form)) {
    if (isFieldShown(config, "street")) visibility.street = true;
    if (isFieldShown(config, "buildingNumber")) visibility.buildingNumber = true;
    if (isFieldShown(config, "apartmentNumber")) visibility.apartmentNumber = true;
    if (isFieldShown(config, "postalCode")) visibility.postalCode = true;
    visibility.additionalDetails = true;
  }

  return visibility;
}

export function applyCountrySelection(
  country: string
): Pick<
  AddressFormValues,
  | "country"
  | "province"
  | "city"
  | "district"
  | "neighborhood"
  | "streetName"
  | "buildingNumber"
  | "apartmentNumber"
  | "postalCode"
  | "additionalDetails"
> {
  return {
    country,
    province: "",
    city: "",
    district: "",
    neighborhood: "",
    ...EMPTY_DETAIL_FIELDS,
  };
}

export function applyProvinceSelection(
  province: string
): Pick<
  AddressFormValues,
  | "province"
  | "city"
  | "district"
  | "neighborhood"
  | "streetName"
  | "buildingNumber"
  | "apartmentNumber"
  | "postalCode"
  | "additionalDetails"
> {
  return {
    province,
    city: "",
    district: "",
    neighborhood: "",
    ...EMPTY_DETAIL_FIELDS,
  };
}

export function applyCitySelection(
  city: string
): Pick<
  AddressFormValues,
  | "city"
  | "neighborhood"
  | "streetName"
  | "buildingNumber"
  | "apartmentNumber"
  | "postalCode"
  | "additionalDetails"
> {
  return { city, neighborhood: "", ...EMPTY_DETAIL_FIELDS };
}

export function applyDistrictSelection(
  district: string
): Pick<
  AddressFormValues,
  | "district"
  | "neighborhood"
  | "streetName"
  | "buildingNumber"
  | "apartmentNumber"
  | "postalCode"
  | "additionalDetails"
> {
  return { district, neighborhood: "", ...EMPTY_DETAIL_FIELDS };
}

export function applyNeighborhoodSelection(
  neighborhood: string
): Pick<
  AddressFormValues,
  "neighborhood" | "streetName" | "buildingNumber" | "apartmentNumber" | "postalCode" | "additionalDetails"
> {
  return { neighborhood, ...EMPTY_DETAIL_FIELDS };
}

export function getDefaultAddressFormValues(): AddressFormValues {
  return {
    country: "",
    province: "",
    city: "",
    district: "",
    neighborhood: "",
    streetName: "",
    buildingNumber: "",
    apartmentNumber: "",
    postalCode: "",
    additionalDetails: "",
  };
}

export function isGeoSelectionComplete(form: AddressFormValues): boolean {
  const config = getCountryAddressConfig(form.country);
  if (!config || !form.country) return false;
  if (isFieldRequired(config, "state") && !form.province) return false;
  if (isFieldRequired(config, "city") && !form.city) return false;
  if (isFieldRequired(config, "district") && !form.district) return false;
  if (isFieldRequired(config, "neighborhood") && !form.neighborhood) return false;
  return true;
}

export function getNeighborhoodParentValue(
  form: AddressFormValues,
  config: ReturnType<typeof getCountryAddressConfig>
): string {
  if (!config) return "";
  if (config.neighborhoodParent === "district") return form.district;
  if (config.neighborhoodParent === "city") return form.city;
  return "";
}

export function addressFormToUserAddress(form: AddressFormValues): UserAddress {
  const config = getCountryAddressConfig(form.country);

  return {
    country: form.country,
    state: form.province,
    city: config && isFieldShown(config, "city") ? form.city : "",
    district: config && isFieldShown(config, "district") ? form.district : "",
    region: form.neighborhood,
    street: form.streetName,
    building_number: form.buildingNumber,
    apartment_number: form.apartmentNumber,
    postal_code: form.postalCode,
    additional_details: form.additionalDetails || undefined,
    province: form.province,
    neighborhood: form.neighborhood,
  };
}

export function userAddressToAddressForm(address: UserAddress): AddressFormValues {
  const config = getCountryAddressConfig(address.country ?? "");

  return {
    country: address.country ?? "",
    province: address.province ?? address.state ?? "",
    city: config && isFieldShown(config, "city") ? address.city ?? "" : "",
    district:
      config && isFieldShown(config, "district")
        ? address.district ?? (isFieldShown(config, "city") ? "" : address.city ?? "")
        : "",
    neighborhood: address.neighborhood ?? address.region ?? "",
    streetName: address.street ?? "",
    buildingNumber: address.building_number ?? "",
    apartmentNumber: address.apartment_number ?? "",
    postalCode: address.postal_code ?? "",
    additionalDetails: address.additional_details ?? "",
  };
}

export function isAddressFormComplete(form: AddressFormValues): boolean {
  const config = getCountryAddressConfig(form.country);
  if (!config || !isGeoSelectionComplete(form)) return false;

  const textFields: AddressFieldName[] = [
    "street",
    "buildingNumber",
    "apartmentNumber",
    "postalCode",
  ];
  for (const field of textFields) {
    if (!isFieldRequired(config, field)) continue;
    const value =
      field === "street"
        ? form.streetName
        : field === "buildingNumber"
          ? form.buildingNumber
          : field === "apartmentNumber"
            ? form.apartmentNumber
            : form.postalCode;
    if (!value.trim()) return false;
  }
  return true;
}

function fieldRequiredError(config: CountryAddressConfig, field: AddressFieldName): string {
  const labelKey = config.fields[field].labelKey;
  const label = labelKey.startsWith("labels.") ? labelKey.slice(7) : labelKey;
  return `${label} is required`;
}

export function validateUserAddress(address: UserAddress): string | null {
  const config = getCountryAddressConfig(address.country);
  if (!config) return "Unsupported country";
  if (isFieldRequired(config, "state") && !address.state?.trim()) {
    return fieldRequiredError(config, "state");
  }
  if (isFieldRequired(config, "city") && !address.city?.trim()) {
    return fieldRequiredError(config, "city");
  }
  if (isFieldRequired(config, "district") && !address.district?.trim()) {
    return fieldRequiredError(config, "district");
  }
  if (
    isFieldRequired(config, "neighborhood") &&
    !(address.neighborhood ?? address.region)?.trim()
  ) {
    return fieldRequiredError(config, "neighborhood");
  }
  if (isFieldRequired(config, "street") && !address.street?.trim()) {
    return fieldRequiredError(config, "street");
  }
  if (isFieldRequired(config, "buildingNumber") && !address.building_number?.trim()) {
    return fieldRequiredError(config, "buildingNumber");
  }
  if (isFieldRequired(config, "apartmentNumber") && !address.apartment_number?.trim()) {
    return fieldRequiredError(config, "apartmentNumber");
  }
  if (isFieldRequired(config, "postalCode") && !address.postal_code?.trim()) {
    return fieldRequiredError(config, "postalCode");
  }
  return null;
}

/** Strict field order for admin order detail address display. */
const ADMIN_ORDER_ADDRESS_FIELDS: Array<(address: UserAddress) => string | undefined> = [
  (address) => address.district,
  (address) => address.neighborhood ?? address.region,
  (address) => address.street,
  (address) => address.building_number,
  (address) => address.apartment_number,
  (address) => address.postal_code,
  (address) => address.city,
  (address) => address.province ?? address.state,
  (address) => address.country,
];

/** Admin order detail: District → Neighborhood → Street → Building → Apartment → Postal → City → State → Country */
export function formatAdminOrderAddress(
  address: UserAddress | null | undefined
): string {
  if (!address) return "";

  return ADMIN_ORDER_ADDRESS_FIELDS.map((getValue) => getValue(address))
    .filter((part) => part != null && String(part).trim() !== "")
    .join(", ");
}

export function formatAddressPath(address: UserAddress): string {
  return formatAdminOrderAddress(address);
}

export function mapUserAddressToShippingAddress(
  address: UserAddress,
  fullName: string,
  phone: string
) {
  const cityLine = address.city || address.district || address.state;

  return {
    full_name: fullName,
    phone,
    address_line1: `${address.street} ${address.building_number}`.trim(),
    address_line2: address.apartment_number,
    city: cityLine,
    country: address.country,
    postal_code: address.postal_code ?? "",
  };
}
