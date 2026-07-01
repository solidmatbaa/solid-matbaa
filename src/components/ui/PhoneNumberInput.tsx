"use client";

import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

interface PhoneNumberInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const inputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400";

export function PhoneNumberInput({
  id,
  value,
  onChange,
  required,
  disabled,
  className,
}: PhoneNumberInputProps) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry="TR"
      value={value || undefined}
      onChange={(next) => onChange(next ?? "")}
      disabled={disabled}
      className={cn("PhoneInput flex gap-2", className)}
      numberInputProps={{
        required,
        className: inputClass,
      }}
      countrySelectProps={{
        className: cn(inputClass, "max-w-[7rem] shrink-0"),
      }}
    />
  );
}

export function isPhoneNumberValid(value: string): boolean {
  return !!value.trim() && isValidPhoneNumber(value);
}
