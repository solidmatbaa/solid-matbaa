"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { AddressFieldDefinition } from "@/lib/address-country-config";
import {
  applyCitySelection,
  applyCountrySelection,
  applyDistrictSelection,
  applyNeighborhoodSelection,
  applyProvinceSelection,
  fetchDistricts,
  fetchNeighborhoods,
  fetchProvinces,
  getAddressFieldVisibility,
  getCountries,
  getCountryAddressConfig,
  getNeighborhoodParentValue,
  isFieldRequired,
  isFieldShown,
  type AddressFormValues,
} from "@/lib/address-data";

interface AddressFormProps {
  value: AddressFormValues;
  onChange: (value: AddressFormValues) => void;
  showBuildingFields?: boolean;
  idPrefix?: string;
}

const inputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

function fieldLabel(
  field: AddressFieldDefinition,
  t: ReturnType<typeof useTranslations<"address">>
): string {
  return field.labelKey ? t(field.labelKey as "streetName") : "";
}

function fieldSelectPlaceholder(
  field: AddressFieldDefinition,
  loading: boolean,
  t: ReturnType<typeof useTranslations<"address">>
): string {
  if (loading) return t("loading");
  return field.selectLabelKey
    ? t(field.selectLabelKey as "selectCountry")
    : t("selectCountry");
}

export function AddressForm({
  value,
  onChange,
  showBuildingFields = true,
  idPrefix = "address",
}: AddressFormProps) {
  const t = useTranslations("address");
  const countries = getCountries();
  const config = useMemo(
    () => (value.country ? getCountryAddressConfig(value.country) : null),
    [value.country]
  );

  const visibleFields = useMemo(
    () => getAddressFieldVisibility(value, config),
    [value, config]
  );

  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [loadError, setLoadError] = useState("");

  const neighborhoodParent = config ? getNeighborhoodParentValue(value, config) : "";

  useEffect(() => {
    if (!visibleFields.state || !value.country) {
      setProvinces([]);
      return;
    }

    let cancelled = false;
    setLoadingProvinces(true);
    setLoadError("");

    fetchProvinces(value.country)
      .then((items) => {
        if (!cancelled) setProvinces(items);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setProvinces([]);
          setLoadError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });

    return () => {
      cancelled = true;
    };
  }, [value.country, visibleFields.state]);

  useEffect(() => {
    if (!visibleFields.city || !value.country || !value.province) {
      setCities([]);
      return;
    }

    let cancelled = false;
    setLoadingCities(true);
    setLoadError("");

    fetchDistricts(value.country, value.province)
      .then((items) => {
        if (!cancelled) setCities(items);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setCities([]);
          setLoadError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });

    return () => {
      cancelled = true;
    };
  }, [value.country, value.province, visibleFields.city]);

  useEffect(() => {
    if (!visibleFields.district || !value.country || !value.province) {
      setDistricts([]);
      return;
    }

    let cancelled = false;
    setLoadingDistricts(true);
    setLoadError("");

    fetchDistricts(value.country, value.province)
      .then((items) => {
        if (!cancelled) setDistricts(items);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setDistricts([]);
          setLoadError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [value.country, value.province, visibleFields.district]);

  useEffect(() => {
    if (
      !visibleFields.neighborhood ||
      !value.country ||
      !value.province ||
      !neighborhoodParent
    ) {
      setNeighborhoods([]);
      return;
    }

    let cancelled = false;
    setLoadingNeighborhoods(true);
    setLoadError("");

    fetchNeighborhoods(value.country, value.province, neighborhoodParent)
      .then((items) => {
        if (!cancelled) setNeighborhoods(items);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setNeighborhoods([]);
          setLoadError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingNeighborhoods(false);
      });

    return () => {
      cancelled = true;
    };
  }, [value.country, value.province, neighborhoodParent, visibleFields.neighborhood]);

  function update(partial: Partial<AddressFormValues>) {
    onChange({ ...value, ...partial });
  }

  const stateField = config?.fields.state;
  const cityField = config?.fields.city;
  const districtField = config?.fields.district;
  const neighborhoodField = config?.fields.neighborhood;
  const streetField = config?.fields.street;
  const buildingField = config?.fields.buildingNumber;
  const apartmentField = config?.fields.apartmentNumber;
  const postalField = config?.fields.postalCode;

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{loadError}</div>
      )}

      <div>
        <label htmlFor={`${idPrefix}-country`} className={labelClass}>
          {t("country")}
        </label>
        <select
          id={`${idPrefix}-country`}
          value={value.country}
          onChange={(e) => update(applyCountrySelection(e.target.value))}
          className={inputClass}
          required
        >
          <option value="">{t("selectCountry")}</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      {config && visibleFields.state && stateField && (
        <div>
          <label htmlFor={`${idPrefix}-state`} className={labelClass}>
            {fieldLabel(stateField, t)}
          </label>
          <select
            id={`${idPrefix}-state`}
            value={value.province}
            onChange={(e) => update(applyProvinceSelection(e.target.value))}
            className={inputClass}
            required={isFieldRequired(config, "state")}
            disabled={loadingProvinces}
          >
            <option value="">
              {fieldSelectPlaceholder(stateField, loadingProvinces, t)}
            </option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>
      )}

      {config && visibleFields.city && cityField && (
        <div>
          <label htmlFor={`${idPrefix}-city`} className={labelClass}>
            {fieldLabel(cityField, t)}
          </label>
          <select
            id={`${idPrefix}-city`}
            value={value.city}
            onChange={(e) => update(applyCitySelection(e.target.value))}
            className={inputClass}
            required={isFieldRequired(config, "city")}
            disabled={loadingCities}
          >
            <option value="">
              {fieldSelectPlaceholder(cityField, loadingCities, t)}
            </option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      )}

      {config && visibleFields.district && districtField && (
        <div>
          <label htmlFor={`${idPrefix}-district`} className={labelClass}>
            {fieldLabel(districtField, t)}
          </label>
          <select
            id={`${idPrefix}-district`}
            value={value.district}
            onChange={(e) => update(applyDistrictSelection(e.target.value))}
            className={inputClass}
            required={isFieldRequired(config, "district")}
            disabled={loadingDistricts}
          >
            <option value="">
              {fieldSelectPlaceholder(districtField, loadingDistricts, t)}
            </option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
      )}

      {config && visibleFields.neighborhood && neighborhoodField && (
        <div>
          <label htmlFor={`${idPrefix}-neighborhood`} className={labelClass}>
            {fieldLabel(neighborhoodField, t)}
          </label>
          <select
            id={`${idPrefix}-neighborhood`}
            value={value.neighborhood}
            onChange={(e) => update(applyNeighborhoodSelection(e.target.value))}
            className={inputClass}
            required={isFieldRequired(config, "neighborhood")}
            disabled={loadingNeighborhoods}
          >
            <option value="">
              {fieldSelectPlaceholder(neighborhoodField, loadingNeighborhoods, t)}
            </option>
            {neighborhoods.map((neighborhood) => (
              <option key={neighborhood} value={neighborhood}>
                {neighborhood}
              </option>
            ))}
          </select>
        </div>
      )}

      {config && visibleFields.street && streetField && (
        <div>
          <label htmlFor={`${idPrefix}-street`} className={labelClass}>
            {fieldLabel(streetField, t)}
          </label>
          <input
            id={`${idPrefix}-street`}
            type="text"
            required={isFieldRequired(config, "street")}
            value={value.streetName}
            onChange={(e) => update({ streetName: e.target.value })}
            className={inputClass}
            placeholder={t("streetNamePlaceholder")}
          />
        </div>
      )}

      {showBuildingFields && config && (
        <>
          {(visibleFields.buildingNumber || visibleFields.apartmentNumber) && (
            <div className="grid grid-cols-2 gap-3">
              {visibleFields.buildingNumber && buildingField && (
                <div>
                  <label htmlFor={`${idPrefix}-building`} className={labelClass}>
                    {fieldLabel(buildingField, t)}
                  </label>
                  <input
                    id={`${idPrefix}-building`}
                    type="text"
                    required={isFieldRequired(config, "buildingNumber")}
                    value={value.buildingNumber}
                    onChange={(e) => update({ buildingNumber: e.target.value })}
                    className={inputClass}
                  />
                </div>
              )}
              {visibleFields.apartmentNumber && apartmentField && (
                <div>
                  <label htmlFor={`${idPrefix}-apartment`} className={labelClass}>
                    {fieldLabel(apartmentField, t)}
                  </label>
                  <input
                    id={`${idPrefix}-apartment`}
                    type="text"
                    required={isFieldRequired(config, "apartmentNumber")}
                    value={value.apartmentNumber}
                    onChange={(e) => update({ apartmentNumber: e.target.value })}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          )}

          {visibleFields.postalCode && postalField && (
            <div>
              <label htmlFor={`${idPrefix}-postal`} className={labelClass}>
                {fieldLabel(postalField, t)}
              </label>
              <input
                id={`${idPrefix}-postal`}
                type="text"
                inputMode="numeric"
                required={isFieldRequired(config, "postalCode")}
                value={value.postalCode}
                onChange={(e) => update({ postalCode: e.target.value })}
                className={inputClass}
                placeholder={t("postalCodePlaceholder")}
              />
            </div>
          )}

          {visibleFields.additionalDetails && (
            <div>
              <label htmlFor={`${idPrefix}-details`} className={labelClass}>
                {t("additionalDetails")}
              </label>
              <input
                id={`${idPrefix}-details`}
                type="text"
                value={value.additionalDetails}
                onChange={(e) => update({ additionalDetails: e.target.value })}
                className={inputClass}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
