/** Seller details — must appear verbatim in legal documents. */
export const LEGAL_SELLER = {
  name: "Almuatsm Belah Ghazal",
  address: "Cihangir Mah. Petrol Ofisi Cad. No: 40/A Avcılar/İstanbul",
  taxOffice: "Avcılar Vergi Dairesi",
  taxNumber: "3861214044",
  email: "info@solidmatbaa.com",
  website: "www.solidmatbaa.com",
} as const;

export const LEGAL_SELLER_BLOCK = `Satıcı: ${LEGAL_SELLER.name}
Adres: ${LEGAL_SELLER.address}
Vergi Dairesi: ${LEGAL_SELLER.taxOffice}
Vergi Numarası: ${LEGAL_SELLER.taxNumber}
E-posta: ${LEGAL_SELLER.email}
Web sitesi: ${LEGAL_SELLER.website}`;

export type LegalSection = {
  title: string;
  paragraphs: string[];
};
