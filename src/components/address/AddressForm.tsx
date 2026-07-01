"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
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

  const countryOptions = useMemo(
    () => countries.map((country) => ({ value: country.isoCode, label: country.name })),
    [countries]
  );

  const states = useMemo(
    () => getStatesForCountry(value.countryCode),
    [value.countryCode]
  );

  const stateOptions = useMemo(
    () => states.map((state) => ({ value: state.isoCode, label: state.name })),
    [states]
  );

  const cities = useMemo(
    () => getCitiesForLocation(value.countryCode, value.stateCode || undefined),
    [value.countryCode, value.stateCode]
  );

  const cityOptions = useMemo(
    () =>
      cities.map((city) => ({
        value: city.name,
        label: city.name,
      })),
    [cities]
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
        <SearchableSelect
          id={`${idPrefix}-country`}
          inputId={`${idPrefix}-country`}
          options={countryOptions}
          value={value.countryCode}
          onChange={(isoCode) => {
            const country = countries.find((c) => c.isoCode === isoCode);
            if (!country) return;
            onChange(applyCountrySelection(country.name, country.isoCode));
          }}
          placeholder={t("selectCountry")}
          required
        />
      </div>

      {showStateSelect && (
        <div>
          <label htmlFor={`${idPrefix}-state`} className={labelClass}>
            {t("state")}
          </label>
          <SearchableSelect
            id={`${idPrefix}-state`}
            inputId={`${idPrefix}-state`}
            options={stateOptions}
            value={value.stateCode}
            onChange={(isoCode) => {
              const state = states.find((s) => s.isoCode === isoCode);
              if (!state) return;
              update(applyProvinceSelection(state.name, state.isoCode));
            }}
            placeholder={t("selectState")}
            isDisabled={!value.countryCode}
            required
          />
        </div>
      )}

      {(showCitySelect || (value.countryCode && !showStateSelect)) && (
        <div>
          <label htmlFor={`${idPrefix}-city`} className={labelClass}>
            {t("city")}
          </label>
          {showCitySelect ? (
            <SearchableSelect
              id={`${idPrefix}-city`}
              inputId={`${idPrefix}-city`}
              options={cityOptions}
              value={value.city}
              onChange={(cityName) => update(applyCitySelection(cityName))}
              placeholder={t("selectCity")}
              isDisabled={showStateSelect && !value.stateCode}
              required
            />
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
