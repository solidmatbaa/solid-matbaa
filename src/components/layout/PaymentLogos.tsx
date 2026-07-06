import Image, { type StaticImageData } from "next/image";
import iyzicoLogo from "@/assets/images/payments/iyzico.webp";
import mastercardLogo from "@/assets/images/payments/mastercard.png";
import visaLogo from "@/assets/images/payments/visa.png";

const LOGO_HEIGHT_CLASS = "h-6 sm:h-[30px] w-auto object-contain";

function PaymentLogo({ src, alt }: { src: StaticImageData; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={src.width}
      height={src.height}
      className={LOGO_HEIGHT_CLASS}
      style={{ width: "auto" }}
      sizes="30px"
    />
  );
}

export function PaymentLogos() {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-6 sm:gap-8"
      aria-label="Visa, MasterCard, iyzico"
    >
      <PaymentLogo src={visaLogo} alt="Visa" />
      <PaymentLogo src={mastercardLogo} alt="MasterCard" />
      <PaymentLogo src={iyzicoLogo} alt="iyzico" />
    </div>
  );
}
