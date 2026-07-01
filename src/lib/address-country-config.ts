/** Supported countries and per-country address field mapping. */
export const COUNTRY_LIST = [
  "Germany",
  "Turkey",
  "Netherlands",
  "Iraq",
  "Palestine",
  "Algeria",
] as const;

export type SupportedCountry = (typeof COUNTRY_LIST)[number];

export type AddressFieldName =
  | "state"
  | "city"
  | "district"
  | "neighborhood"
  | "street"
  | "buildingNumber"
  | "apartmentNumber"
  | "postalCode";

/** i18n keys are relative to the `address` namespace (e.g. `labels.wilaya`). */
export interface AddressFieldDefinition {
  show: boolean;
  required: boolean;
  labelKey: string;
  selectLabelKey?: string;
}

export interface CountryAddressConfig {
  fields: Record<AddressFieldName, AddressFieldDefinition>;
  /** Form value used as parent when loading neighborhoods. */
  neighborhoodParent: "city" | "district" | null;
}

const alwaysRequired = (labelKey: string, selectLabelKey?: string): AddressFieldDefinition => ({
  show: true,
  required: true,
  labelKey,
  selectLabelKey,
});

const hidden = (): AddressFieldDefinition => ({
  show: false,
  required: false,
  labelKey: "",
});

const textField = (labelKey: string): AddressFieldDefinition => ({
  show: true,
  required: true,
  labelKey,
});

function buildConfig(
  config: Partial<Record<AddressFieldName, AddressFieldDefinition>> & {
    neighborhoodParent: CountryAddressConfig["neighborhoodParent"];
  }
): CountryAddressConfig {
  const { neighborhoodParent, ...fieldOverrides } = config;
  const defaults: Record<AddressFieldName, AddressFieldDefinition> = {
    state: hidden(),
    city: hidden(),
    district: hidden(),
    neighborhood: hidden(),
    street: textField("streetName"),
    buildingNumber: textField("buildingNumber"),
    apartmentNumber: textField("apartmentNumber"),
    postalCode: textField("postalCode"),
  };

  return {
    neighborhoodParent,
    fields: { ...defaults, ...fieldOverrides },
  };
}

export const COUNTRY_ADDRESS_CONFIG: Record<SupportedCountry, CountryAddressConfig> = {
  Turkey: buildConfig({
    neighborhoodParent: "district",
    state: alwaysRequired("labels.il", "selectLabels.il"),
    district: alwaysRequired("labels.ilce", "selectLabels.ilce"),
    neighborhood: alwaysRequired("labels.mahalle", "selectLabels.mahalle"),
  }),
  Germany: buildConfig({
    neighborhoodParent: "city",
    state: alwaysRequired("labels.bundesland", "selectLabels.bundesland"),
    city: alwaysRequired("labels.stadt", "selectLabels.stadt"),
    neighborhood: alwaysRequired("labels.stadtteil", "selectLabels.stadtteil"),
  }),
  Netherlands: buildConfig({
    neighborhoodParent: "city",
    state: alwaysRequired("labels.provincie", "selectLabels.provincie"),
    city: alwaysRequired("labels.stad", "selectLabels.stad"),
    neighborhood: alwaysRequired("labels.buurt", "selectLabels.buurt"),
  }),
  Iraq: buildConfig({
    neighborhoodParent: "city",
    state: alwaysRequired("labels.governorate", "selectLabels.governorate"),
    city: alwaysRequired("labels.city", "selectLabels.city"),
    neighborhood: alwaysRequired("labels.neighborhood", "selectLabels.neighborhood"),
  }),
  Palestine: buildConfig({
    neighborhoodParent: "district",
    state: alwaysRequired("labels.governorate", "selectLabels.governorate"),
    district: alwaysRequired("labels.district", "selectLabels.district"),
    neighborhood: alwaysRequired("labels.neighborhood", "selectLabels.neighborhood"),
  }),
  Algeria: buildConfig({
    neighborhoodParent: "city",
    state: alwaysRequired("labels.wilaya", "selectLabels.wilaya"),
    city: alwaysRequired("labels.commune", "selectLabels.commune"),
    neighborhood: alwaysRequired("labels.neighborhood", "selectLabels.neighborhood"),
  }),
};

export function getCountryAddressConfig(country: string): CountryAddressConfig | null {
  if (country in COUNTRY_ADDRESS_CONFIG) {
    return COUNTRY_ADDRESS_CONFIG[country as SupportedCountry];
  }
  return null;
}

export function isSupportedCountry(country: string): country is SupportedCountry {
  return country in COUNTRY_ADDRESS_CONFIG;
}

export function isFieldShown(
  config: CountryAddressConfig,
  field: AddressFieldName
): boolean {
  return config.fields[field].show;
}

export function isFieldRequired(
  config: CountryAddressConfig,
  field: AddressFieldName
): boolean {
  return config.fields[field].show && config.fields[field].required;
}

/** @deprecated Use `isFieldShown(config, "state")` */
export function configHasState(config: CountryAddressConfig): boolean {
  return isFieldShown(config, "state");
}

/** @deprecated Use `isFieldShown(config, "city")` */
export function configHasCity(config: CountryAddressConfig): boolean {
  return isFieldShown(config, "city");
}

/** @deprecated Use `isFieldShown(config, "district")` */
export function configHasDistrict(config: CountryAddressConfig): boolean {
  return isFieldShown(config, "district");
}

/** @deprecated Use `isFieldShown(config, "neighborhood")` */
export function configHasNeighborhood(config: CountryAddressConfig): boolean {
  return isFieldShown(config, "neighborhood");
}
