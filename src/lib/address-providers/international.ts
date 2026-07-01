import fs from "fs";
import path from "path";

type ProvinceIndex = {
  country: string;
  provinces: Array<{ name: string; slug: string }>;
};

type ProvinceFile = {
  province: string;
  districts: Record<string, { neighborhoods: string[] }>;
};

const DATA_ROOT = path.join(process.cwd(), "src/data/address/international");

function countryDir(country: string): string {
  return path.join(
    DATA_ROOT,
    country
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
  );
}

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function getInternationalProvinces(country: string): string[] {
  const index = readJson<ProvinceIndex>(path.join(countryDir(country), "index.json"));
  return index?.provinces.map((p) => p.name) ?? [];
}

function findProvinceSlug(country: string, province: string): string | null {
  const index = readJson<ProvinceIndex>(path.join(countryDir(country), "index.json"));
  if (!index) return null;

  const normalized = province.trim().toLowerCase();
  const match = index.provinces.find(
    (p) =>
      p.name.trim().toLowerCase() === normalized ||
      p.slug ===
        province
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase()
  );
  return match?.slug ?? null;
}

function readProvinceFile(country: string, province: string): ProvinceFile | null {
  const slug = findProvinceSlug(country, province);
  if (!slug) return null;
  return readJson<ProvinceFile>(path.join(countryDir(country), `${slug}.json`));
}

export function getInternationalDistricts(country: string, province: string): string[] {
  const file = readProvinceFile(country, province);
  if (!file) return [];
  return Object.keys(file.districts).sort((a, b) => a.localeCompare(b, "en"));
}

export function getInternationalNeighborhoods(
  country: string,
  province: string,
  district: string
): string[] {
  const file = readProvinceFile(country, province);
  if (!file) return [];
  return file.districts[district]?.neighborhoods ?? [];
}

export function isInternationalDataAvailable(country: string): boolean {
  return fs.existsSync(path.join(countryDir(country), "index.json"));
}
