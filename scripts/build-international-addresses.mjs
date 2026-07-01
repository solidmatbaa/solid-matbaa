/**
 * Builds province → district → neighborhood JSON files for international countries.
 * Turkey is served at runtime via the turkey-neighbourhoods package.
 *
 * Usage: node scripts/build-international-addresses.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { State, City } = require("country-state-city");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "src/data/address/international");
const CACHE_DIR = path.join(__dirname, ".cache/geonames");

const COUNTRIES = [
  { label: "Germany", iso: "DE" },
  { label: "Netherlands", iso: "NL" },
  { label: "Iraq", iso: "IQ" },
  { label: "Palestine", iso: "PS", useGeonamesProvinces: true },
  { label: "Algeria", iso: "DZ" },
];

function slug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function downloadGeonames(iso) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const zipPath = path.join(CACHE_DIR, `${iso}.zip`);
  if (!fs.existsSync(zipPath)) {
    const res = await fetch(`https://download.geonames.org/export/dump/${iso}.zip`);
    if (!res.ok) throw new Error(`Failed to download GeoNames ${iso}.zip`);
    fs.writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
  }

  const { execSync } = await import("child_process");
  const txt = execSync(`unzip -p "${zipPath}" ${iso}.txt`, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 200,
  });

  return txt
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const cols = line.split("\t");
      return {
        name: cols[1],
        lat: Number(cols[4]),
        lng: Number(cols[5]),
        featureClass: cols[6],
        featureCode: cols[7],
        admin1: cols[10] || "",
      };
    });
}

async function loadAdmin1Names(iso) {
  const cachePath = path.join(CACHE_DIR, "admin1CodesASCII.txt");
  if (!fs.existsSync(cachePath)) {
    const res = await fetch(
      "https://download.geonames.org/export/dump/admin1CodesASCII.txt"
    );
    fs.writeFileSync(cachePath, Buffer.from(await res.arrayBuffer()));
  }
  const map = new Map();
  for (const line of fs.readFileSync(cachePath, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const [code, name] = line.split("\t");
    if (code.startsWith(`${iso}.`)) {
      map.set(code.split(".")[1], name);
    }
  }
  return map;
}

function getProvinces(country) {
  if (country.useGeonamesProvinces) {
    return null;
  }

  let states = State.getStatesOfCountry(country.iso) ?? [];
  if (country.onlyStatesMatching) {
    states = states.filter((s) => country.onlyStatesMatching.test(s.name));
  }
  return states;
}

function buildFromGeonamesProvinces(places, admin1Names) {
  const provinces = new Map();
  for (const place of places) {
    if (place.featureClass !== "A" || place.featureCode !== "ADM1") continue;
    const name = place.name.trim();
    if (!name) continue;
    provinces.set(name, { code: place.admin1, districts: new Map() });
  }

  if (provinces.size === 0) {
    for (const [code, name] of admin1Names.entries()) {
      provinces.set(name, { code, districts: new Map() });
    }
  }

  return provinces;
}

function mapStateToGeonamesAdmin1(iso, stateName, stateIsoCode, admin1Names) {
  const target = stateName.trim().toLowerCase();
  for (const [code, name] of admin1Names.entries()) {
    if (name.trim().toLowerCase() === target) return code;
  }
  return stateIsoCode;
}

function assignNeighborhoods(provinces, places, cities, radiusKm = 50) {
  const pplx = places.filter(
    (p) => p.featureClass === "P" && p.featureCode === "PPLX" && p.admin1
  );

  for (const city of cities) {
    const provinceEntry = [...provinces.entries()].find(
      ([name]) => name === city.provinceName
    );
    if (!provinceEntry) continue;

    const [, provinceMeta] = provinceEntry;
    if (!provinceMeta.districts.has(city.name)) {
      provinceMeta.districts.set(city.name, new Set());
    }

    const neighborhoods = provinceMeta.districts.get(city.name);
    for (const n of pplx) {
      if (n.admin1 !== city.admin1Code) continue;
      if (!Number.isFinite(city.lat) || !Number.isFinite(city.lng)) continue;
      if (haversineKm(city.lat, city.lng, n.lat, n.lng) <= radiusKm) {
        neighborhoods.add(n.name.trim());
      }
    }

    if (neighborhoods.size === 0) {
      const localPpl = places.filter(
        (p) =>
          p.featureClass === "P" &&
          (p.featureCode === "PPL" || p.featureCode === "PPLA" || p.featureCode === "PPLA2") &&
          p.admin1 === city.admin1Code &&
          Number.isFinite(city.lat) &&
          Number.isFinite(city.lng) &&
          haversineKm(city.lat, city.lng, p.lat, p.lng) <= radiusKm
      );
      for (const p of localPpl) {
        neighborhoods.add(p.name.trim());
      }
    }

    if (neighborhoods.size === 0) {
      neighborhoods.add(city.name);
    }
  }
}

function assignGeonamesDistricts(provinces, places) {
  for (const place of places) {
    if (place.featureClass !== "A" || place.featureCode !== "ADM2") continue;
    const province = [...provinces.values()].find((p) => p.code === place.admin1);
    if (!province) continue;
    if (!province.districts.has(place.name)) {
      province.districts.set(place.name, new Set());
    }
  }

  const pplx = places.filter(
    (p) => p.featureClass === "P" && p.featureCode === "PPLX" && p.admin1
  );
  for (const n of pplx) {
    const province = [...provinces.values()].find((p) => p.code === n.admin1);
    if (!province) continue;
    for (const [districtName, neighborhoods] of province.districts.entries()) {
      if (n.name.toLowerCase().includes(districtName.toLowerCase().slice(0, 4))) {
        neighborhoods.add(n.name.trim());
      }
    }
  }

  for (const province of provinces.values()) {
    for (const [districtName, neighborhoods] of province.districts.entries()) {
      if (neighborhoods.size === 0) {
        neighborhoods.add(districtName);
      }
    }
  }
}

async function buildCountry(country) {
  console.log(`Building ${country.label} (${country.iso})...`);
  const places = await downloadGeonames(country.iso);
  const admin1Names = await loadAdmin1Names(country.iso);
  const countryDir = path.join(OUT_DIR, slug(country.label));
  fs.mkdirSync(countryDir, { recursive: true });

  let provinces;

  if (country.useGeonamesProvinces) {
    provinces = buildFromGeonamesProvinces(places, admin1Names);
    assignGeonamesDistricts(provinces, places);
  } else {
    const states = getProvinces(country);
    provinces = new Map();

    const cityRows = [];
    for (const state of states) {
      const geonamesAdmin1 = mapStateToGeonamesAdmin1(
        country.iso,
        state.name,
        state.isoCode,
        admin1Names
      );
      provinces.set(state.name, { code: geonamesAdmin1, districts: new Map() });
      const cities = City.getCitiesOfState(country.iso, state.isoCode) ?? [];
      for (const city of cities) {
        cityRows.push({
          provinceName: state.name,
          admin1Code: geonamesAdmin1,
          name: city.name,
          lat: Number(city.latitude),
          lng: Number(city.longitude),
        });
      }
    }

    assignNeighborhoods(provinces, places, cityRows);
  }

  const index = [];
  for (const [provinceName, provinceMeta] of provinces.entries()) {
    if (provinceMeta.districts.size === 0) continue;

    const provinceSlug = slug(provinceName);
    index.push({ name: provinceName, slug: provinceSlug });

    const districts = {};
    for (const [districtName, neighborhoodSet] of provinceMeta.districts.entries()) {
      districts[districtName] = {
        neighborhoods: [...neighborhoodSet].sort((a, b) => a.localeCompare(b, "en")),
      };
    }

    fs.writeFileSync(
      path.join(countryDir, `${provinceSlug}.json`),
      JSON.stringify({ province: provinceName, districts }, null, 0)
    );
  }

  index.sort((a, b) => a.name.localeCompare(b.name, "en"));
  fs.writeFileSync(
    path.join(countryDir, "index.json"),
    JSON.stringify({ country: country.label, provinces: index }, null, 2)
  );

  console.log(`  ${index.length} provinces written to ${countryDir}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const country of COUNTRIES) {
    await buildCountry(country);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
