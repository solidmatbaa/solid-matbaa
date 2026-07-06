import Image from "next/image";
import paymentLogos from "@/assets/images/payments/all.png";

export function PaymentLogos() {
  return (
    <div className="flex w-full justify-center">
      <Image
        src={paymentLogos}
        alt="Visa, iyzico, MasterCard"
        width={paymentLogos.width}
        height={paymentLogos.height}
        className="h-10 w-auto max-w-full object-contain bg-transparent mix-blend-screen"
        style={{ width: "auto" }}
        sizes="(max-width: 640px) 90vw, 320px"
      />
    </div>
  );
}
