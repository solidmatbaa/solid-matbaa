import {
  getAllCountries,
  getCitiesForLocation,
  getCountryByName,
  getStateByName,
  getStatesForCountry,
  isCountrySupported,
} from "@/lib/geo/country-state-city-helpers";
import {
  getCountryAddressConfig,
  isSupportedCountry as isLegacySupportedCountry,
} from "@/lib/address-country-config";

export const ADDRESS_COUNTRY_LIST = getAllCountries().map((country) => country.name);

export function getSupportedCountries(): string[] {
  return ADDRESS_COUNTRY_LIST;
}

export function getProvincesForCountry(country: string): string[] {
  const match = getCountryByName(country);
  if (!match) return [];
  return getStatesForCountry(match.isoCode).map((state) => state.name);
}

export function getDistrictsForCountry(country: string, province: string): string[] {
  const match = getCountryByName(country);
  if (!match || !province) return [];
  const state = getStateForProvince(match.isoCode, province);
  if (!state) return [];
  return getCitiesForLocation(match.isoCode, state.isoCode).map((city) => city.name);
}

export function getNeighborhoodsForCountry(
  _country: string,
  _province: string,
  _districtOrCity: string
): string[] {
  return [];
}

export function getCountryFieldConfig(country: string) {
  if (isCountrySupported(country)) {
    return getCountryAddressConfig(country as never);
  }
  return getCountryAddressConfig("Turkey");
}

function getStateForProvince(countryCode: string, provinceName: string) {
  return getStateByName(countryCode, provinceName);
}

export function isSupportedCountry(country: string): boolean {
  return isCountrySupported(country) || isLegacySupportedCountry(country);
}
