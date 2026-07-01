import {
  COUNTRY_LIST,
  getCountryAddressConfig,
  isSupportedCountry,
} from "@/lib/address-country-config";
import {
  getInternationalDistricts,
  getInternationalNeighborhoods,
  getInternationalProvinces,
  isInternationalDataAvailable,
} from "@/lib/address-providers/international";
import {
  getTurkeyDistricts,
  getTurkeyNeighborhoods,
  getTurkeyProvinces,
} from "@/lib/address-providers/turkey";

export const ADDRESS_COUNTRY_LIST = COUNTRY_LIST;

export function getSupportedCountries(): string[] {
  return [...COUNTRY_LIST];
}

export function getProvincesForCountry(country: string): string[] {
  if (!isSupportedCountry(country)) return [];
  const config = getCountryAddressConfig(country);
  if (!config?.fields.state.show) return [];

  if (country === "Turkey") return getTurkeyProvinces();
  if (isInternationalDataAvailable(country)) return getInternationalProvinces(country);
  return [];
}

export function getDistrictsForCountry(country: string, province: string): string[] {
  if (!isSupportedCountry(country) || !province) return [];

  if (country === "Turkey") return getTurkeyDistricts(province);
  if (isInternationalDataAvailable(country)) {
    return getInternationalDistricts(country, province);
  }
  return [];
}

export function getNeighborhoodsForCountry(
  country: string,
  province: string,
  districtOrCity: string
): string[] {
  if (!isSupportedCountry(country) || !province || !districtOrCity) return [];

  if (country === "Turkey") {
    return getTurkeyNeighborhoods(province, districtOrCity);
  }
  if (isInternationalDataAvailable(country)) {
    return getInternationalNeighborhoods(country, province, districtOrCity);
  }
  return [];
}

export function getCountryFieldConfig(country: string) {
  return getCountryAddressConfig(country);
}
