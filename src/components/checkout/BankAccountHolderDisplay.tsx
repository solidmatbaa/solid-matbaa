import { BANK_ACCOUNT_HOLDER_NAME } from "@/lib/payment-details";

interface BankAccountHolderDisplayProps {
  label: string;
  className?: string;
}

export function BankAccountHolderDisplay({ label, className = "" }: BankAccountHolderDisplayProps) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-amber-900 mb-1">{label}</p>
      <p className="text-base sm:text-lg font-bold text-amber-950 bg-white px-3 py-2.5 rounded-xl border border-amber-200">
        {BANK_ACCOUNT_HOLDER_NAME}
      </p>
    </div>
  );
}
