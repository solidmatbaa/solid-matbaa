"use client";

import Select, { type SingleValue, type StylesConfig } from "react-select";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

interface SearchableSelectProps {
  id?: string;
  inputId?: string;
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  required?: boolean;
}

const BRAND_500 = "#28e19c";
const GRAY_200 = "#e5e7eb";
const GRAY_400 = "#9ca3af";
const GRAY_50 = "#f9fafb";

const selectStyles: StylesConfig<SearchableSelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? BRAND_500 : GRAY_200,
    boxShadow: state.isFocused ? "0 0 0 2px rgb(40 225 156 / 0.35)" : "none",
    backgroundColor: state.isDisabled ? GRAY_50 : base.backgroundColor,
    fontSize: "0.875rem",
    "&:hover": {
      borderColor: state.isFocused ? BRAND_500 : "#d1d5db",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 12px",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
  placeholder: (base) => ({
    ...base,
    color: GRAY_400,
  }),
  singleValue: (base, state) => ({
    ...base,
    color: state.isDisabled ? GRAY_400 : base.color,
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    overflow: "hidden",
    zIndex: 50,
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  }),
  menuList: (base) => ({
    ...base,
    maxHeight: "240px",
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    backgroundColor: state.isSelected
      ? BRAND_500
      : state.isFocused
        ? "#ecfdf5"
        : base.backgroundColor,
    color: state.isSelected ? "#fff" : base.color,
    cursor: "pointer",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? BRAND_500 : GRAY_400,
    "&:hover": { color: BRAND_500 },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: GRAY_400,
    "&:hover": { color: "#ef4444" },
  }),
};

export function SearchableSelect({
  id,
  inputId,
  options,
  value,
  onChange,
  placeholder,
  isDisabled = false,
  isClearable = false,
  required = false,
}: SearchableSelectProps) {
  const selected =
    options.find((option) => option.value === value) ??
    (value ? { value, label: value } : null);

  function handleChange(option: SingleValue<SearchableSelectOption>) {
    onChange(option?.value ?? "");
  }

  return (
    <Select
      instanceId={id}
      inputId={inputId ?? id}
      options={options}
      value={selected}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isClearable={isClearable}
      isSearchable
      required={required}
      styles={selectStyles}
      classNamePrefix="searchable-select"
      noOptionsMessage={() => "No results"}
    />
  );
}
