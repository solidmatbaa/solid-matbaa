export function PaymentLogos() {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
      aria-label="Visa, MasterCard, iyzico"
    >
      <div className="h-8 sm:h-9 px-3 py-1.5 bg-white/95 rounded-md flex items-center justify-center min-w-[3.5rem]">
        <svg viewBox="0 0 48 16" className="h-4 sm:h-5 w-auto" aria-label="Visa" role="img">
          <path
            fill="#1A1F71"
            d="M19.5 1.2h-3.3l-2.1 13.6h3.3L19.5 1.2zm8.9 8.8c0-3.3-4.6-3.5-4.6-5 0-.5.5-1 1.6-1.1.5-.1 2-.1 3.6.8l.6-3.1c-.9-.3-2-.6-3.5-.6-3.7 0-6.3 2-6.3 4.8 0 2.1 1.9 3.3 3.3 4 1.5.7 2 1.2 2 1.9 0 1-.6 1.5-1.9 1.5-1.6 0-2.5-.4-3.2-.8l-.6 3.2c.8.4 2.2.7 3.7.7 3.9 0 6.5-1.9 6.5-4.9zm9.2-8.8l-2.6 13.6h-3.1l2.6-13.6h3.1zM8.8 1.2L5.6 9.7 5.2 7.8c-.6-2.3-2.5-4.8-4.6-6l2.9-.1h3.6l2.7 9.1L8.8 1.2z"
          />
          <path fill="#F7B600" d="M3.2 1.2H0L0 1.3C2.5 2.1 4.1 3.8 4.8 5.8l-1.6-4.6z" />
        </svg>
      </div>

      <div className="h-8 sm:h-9 px-3 py-1.5 bg-white/95 rounded-md flex items-center justify-center min-w-[3.5rem]">
        <svg viewBox="0 0 36 22" className="h-5 sm:h-6 w-auto" aria-label="MasterCard" role="img">
          <circle cx="13" cy="11" r="9" fill="#EB001B" />
          <circle cx="23" cy="11" r="9" fill="#F79E1B" fillOpacity="0.95" />
          <path
            fill="#FF5F00"
            d="M18 4.8a9 9 0 0 0-3.4 6.2 9 9 0 0 0 3.4 6.2 9 9 0 0 0 3.4-6.2 9 9 0 0 0-3.4-6.2z"
          />
        </svg>
      </div>

      <div className="h-8 sm:h-9 px-3 py-1.5 bg-white rounded-md flex items-center justify-center min-w-[4.5rem]">
        <svg viewBox="0 0 88 24" className="h-4 sm:h-5 w-auto" aria-label="iyzico" role="img">
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
