"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  applyCitySelection,
  applyCountrySelection,
  applyProvinceSelection,
  type AddressFormValues,
} from "@/lib/address-data";
import {
  getAllCountries,
  getCitiesForLocation,
  getStatesForCountry,
} from "@/lib/geo/country-state-city-helpers";

interface AddressFormProps {
  value: AddressFormValues;
  onChange: (value: AddressFormValues) => void;
  showBuildingFields?: boolean;
  idPrefix?: string;
}

const inputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export function AddressForm({
  value,
  onChange,
  showBuildingFields = true,
  idPrefix = "address",
}: AddressFormProps) {
  const t = useTranslations("address");
  const countries = useMemo(() => getAllCountries(), []);

  const states = useMemo(
    () => getStatesForCountry(value.countryCode),
    [value.countryCode]
  );

  const cities = useMemo(
    () => getCitiesForLocation(value.countryCode, value.stateCode || undefined),
    [value.countryCode, value.stateCode]
  );

  const showStateSelect = states.length > 0;
  const showCitySelect = cities.length > 0;
  const geoComplete =
    !!value.countryCode &&
    (!showStateSelect || !!value.stateCode) &&
    !!value.city.trim();

  function update(partial: Partial<AddressFormValues>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-country`} className={labelClass}>
          {t("country")}
        </label>
        <select
          id={`${idPrefix}-country`}
          value={value.countryCode}
          onChange={(e) => {
            const country = countries.find((c) => c.isoCode === e.target.value);
            if (!country) return;
            onChange(applyCountrySelection(country.name, country.isoCode));
          }}
          className={inputClass}
          required
        >
          <option value="">{t("selectCountry")}</option>
          {countries.map((country) => (
            <option key={country.isoCode} value={country.isoCode}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {showStateSelect && (
        <div>
          <label htmlFor={`${idPrefix}-state`} className={labelClass}>
            {t("state")}
          </label>
          <select
            id={`${idPrefix}-state`}
            value={value.stateCode}
            onChange={(e) => {
              const state = states.find((s) => s.isoCode === e.target.value);
              if (!state) return;
              update(applyProvinceSelection(state.name, state.isoCode));
            }}
            className={inputClass}
            required
          >
            <option value="">{t("selectState")}</option>
            {states.map((state) => (
              <option key={state.isoCode} value={state.isoCode}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(showCitySelect || (value.countryCode && !showStateSelect)) && (
        <div>
          <label htmlFor={`${idPrefix}-city`} className={labelClass}>
            {t("city")}
          </label>
          {showCitySelect ? (
            <select
              id={`${idPrefix}-city`}
              value={value.city}
              onChange={(e) => update(applyCitySelection(e.target.value))}
              className={inputClass}
              required
            >
              <option value="">{t("selectCity")}</option>
              {cities.map((city) => (
                <option key={`${city.name}-${city.latitude}`} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`${idPrefix}-city`}
              type="text"
              required
              value={value.city}
              onChange={(e) => update(applyCitySelection(e.target.value))}
              className={inputClass}
              placeholder={t("cityPlaceholder")}
            />
          )}
        </div>
      )}

      {geoComplete && (
        <>
          <div>
            <label htmlFor={`${idPrefix}-street`} className={labelClass}>
              {t("streetName")}
            </label>
            <input
              id={`${idPrefix}-street`}
              type="text"
              required
              value={value.streetName}
              onChange={(e) => update({ streetName: e.target.value })}
              className={inputClass}
              placeholder={t("streetNamePlaceholder")}
            />
          </div>

          {showBuildingFields && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${idPrefix}-building`} className={labelClass}>
                    {t("buildingNumber")}
                  </label>
                  <input
                    id={`${idPrefix}-building`}
                    type="text"
                    required
                    value={value.buildingNumber}
                    onChange={(e) => update({ buildingNumber: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`${idPrefix}-apartment`} className={labelClass}>
                    {t("apartmentNumber")}
                  </label>
                  <input
                    id={`${idPrefix}-apartment`}
                    type="text"
                    required
                    value={value.apartmentNumber}
                    onChange={(e) => update({ apartmentNumber: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${idPrefix}-postal`} className={labelClass}>
                  {t("postalCode")}
                </label>
                <input
                  id={`${idPrefix}-postal`}
                  type="text"
                  value={value.postalCode}
                  onChange={(e) => update({ postalCode: e.target.value })}
                  className={inputClass}
                  placeholder={t("postalCodePlaceholder")}
                />
              </div>

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
            </>
          )}
        </>
      )}
    </div>
  );
}
