"use client";

import { useTranslations } from "next-intl";
import { CustomPrintingForm } from "@/components/custom-printing/CustomPrintingForm";
import { MotionSection } from "@/components/ui/MotionSection";

export function CustomPrintingPageContent() {
  const t = useTranslations("customPrinting");

  return (
    <div className="page-container">
      <MotionSection className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
        <h1 className="section-title mb-3">{t("title")}</h1>
        <p className="text-lg text-gray-600 leading-relaxed">{t("subtitle")}</p>
      </MotionSection>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-start">
        <MotionSection delay={0.1} className="lg:col-span-3">
          <CustomPrintingForm />
        </MotionSection>

        <MotionSection delay={0.15} className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            {(["step1", "step2", "step3"] as const).map((step, index) => (
              <div
                key={step}
                className="card-soft text-center hover:shadow-md hover:scale-[1.02] transition-all duration-200"
              >
                <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{t(step)}</p>
              </div>
            ))}
          </div>
        </MotionSection>
      </div>
    </div>
  );
}
