import Image from "next/image";

const BADGE_CLASS =
  "h-9 sm:h-10 w-[4.75rem] sm:w-[5.25rem] px-2.5 py-1.5 bg-white/95 rounded-md flex items-center justify-center shrink-0";

const LOGO_CLASS = "h-5 sm:h-6 w-auto max-w-full object-contain";

export function PaymentLogos() {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
      aria-label="Visa, MasterCard, iyzico"
    >
      <div className={BADGE_CLASS}>
        <Image
          src="/images/payments/visa.png"
          alt="Visa"
          width={512}
          height={166}
          className={LOGO_CLASS}
          sizes="(min-width: 640px) 5rem, 4.75rem"
        />
      </div>

      <div className={BADGE_CLASS}>
        <svg viewBox="0 0 36 22" className={LOGO_CLASS} aria-label="MasterCard" role="img">
          <circle cx="13" cy="11" r="9" fill="#EB001B" />
          <circle cx="23" cy="11" r="9" fill="#F79E1B" fillOpacity="0.95" />
          <path
            fill="#FF5F00"
            d="M18 4.8a9 9 0 0 0-3.4 6.2 9 9 0 0 0 3.4 6.2 9 9 0 0 0 3.4-6.2 9 9 0 0 0-3.4-6.2z"
          />
        </svg>
      </div>

      <div className={BADGE_CLASS}>
        <svg viewBox="0 0 88 24" className={LOGO_CLASS} aria-label="iyzico" role="img">
          <rect width="88" height="24" rx="6" fill="#1E64FF" />
          <text
            x="44"
            y="16"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="11"
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            iyzico
          </text>
        </svg>
      </div>
    </div>
  );
}
