import {
  getCities,
  getCityNames,
  getDistrictsByCityCode,
  getNeighbourhoodsByCityCodeAndDistrict,
} from "turkey-neighbourhoods";

function findCityCode(provinceName: string): string | null {
  const cities = getCities();
  const normalized = provinceName.trim().toLowerCase();
  const match = cities.find(
    (city) =>
      city.name.trim().toLowerCase() === normalized ||
      city.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ===
        normalized.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  );
  return match?.code ?? null;
}

export function getTurkeyProvinces(): string[] {
  return getCityNames().sort((a, b) => a.localeCompare(b, "tr"));
}

export function getTurkeyDistricts(province: string): string[] {
  const code = findCityCode(province);
  if (!code) return [];
  return getDistrictsByCityCode(code).sort((a, b) => a.localeCompare(b, "tr"));
}

export function getTurkeyNeighborhoods(province: string, district: string): string[] {
  const code = findCityCode(province);
  if (!code) return [];
  return getNeighbourhoodsByCityCodeAndDistrict(code, district).sort((a, b) =>
    a.localeCompare(b, "tr")
  );
}
