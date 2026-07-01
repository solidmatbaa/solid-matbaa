import { City, Country, State, type ICity, ICountry, IState } from "country-state-city";

export function getAllCountries(): ICountry[] {
  return Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));
}

export function getCountryByName(name: string): ICountry | undefined {
  return getAllCountries().find((c) => c.name === name);
}

export function getCountryByCode(isoCode: string): ICountry | undefined {
  return Country.getCountryByCode(isoCode);
}

export function getStatesForCountry(countryCode: string): IState[] {
  if (!countryCode) return [];
  return State.getStatesOfCountry(countryCode).sort((a, b) => a.name.localeCompare(b.name));
}

export function getStateByName(countryCode: string, stateName: string): IState | undefined {
  return getStatesForCountry(countryCode).find((s) => s.name === stateName);
}

export function getCitiesForLocation(countryCode: string, stateCode?: string): ICity[] {
  if (!countryCode) return [];
  const cities = stateCode
    ? City.getCitiesOfState(countryCode, stateCode)
    : City.getCitiesOfCountry(countryCode);
  return (cities ?? []).sort((a, b) => a.name.localeCompare(b.name));
}

export function isCountrySupported(countryName: string): boolean {
  return !!getCountryByName(countryName);
}
