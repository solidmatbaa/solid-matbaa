import type { LegalSection } from "@/lib/legal/company";
import { Link } from "@/i18n/routing";

interface LegalDocumentLayoutProps {
  title: string;
  sections: LegalSection[];
  updatedLabel?: string;
  disclaimer?: string | null;
}

export function LegalDocumentLayout({
  title,
  sections,
  updatedLabel,
  disclaimer,
}: LegalDocumentLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 border-b-4 border-brand-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-400 hover:text-brand-500 transition-colors mb-6"
          >
            ← Solid Matbaa
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            {title}
          </h1>
          {updatedLabel && (
            <p className="mt-3 text-sm text-gray-400">{updatedLabel}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {disclaimer && (
          <div
            role="note"
            className="mb-6 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-4 text-sm sm:text-base text-amber-950 leading-relaxed"
          >
            {disclaimer}
          </div>
        )}
        <article className="bg-white rounded-2xl border border-gray-200/80 shadow-sm divide-y divide-gray-100">
          {sections.map((section) => (
            <section key={section.title} className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h2>
              <div className="space-y-3 text-gray-600 text-sm sm:text-base leading-relaxed">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
