import { LEGAL_SELLER, LEGAL_SELLER_BLOCK, type LegalSection } from "@/lib/legal/company";

export const distanceSalesTitle = "Mesafeli Satış Sözleşmesi";

export const distanceSalesSections: LegalSection[] = [
  {
    title: "1. Taraflar",
    paragraphs: [
      "İşbu Mesafeli Satış Sözleşmesi (\"Sözleşme\"), aşağıda bilgileri yer alan Satıcı ile www.solidmatbaa.com internet sitesinden sipariş veren Alıcı arasında, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca elektronik ortamda kurulmuştur.",
      "SATICI:",
      LEGAL_SELLER_BLOCK,
      "ALICI: Sipariş sırasında sisteme kayıtlı ad, soyad, adres, telefon ve e-posta bilgilerini içeren gerçek veya tüzel kişi.",
    ],
  },
  {
    title: "2. Sözleşmenin Konusu",
    paragraphs: [
      "Sözleşmenin konusu; Alıcı'nın Satıcı'ya ait internet sitesinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı sipariş özetinde belirtilen ürün/hizmetin satışı ve teslimine ilişkin tarafların hak ve yükümlülüklerinin belirlenmesidir.",
    ],
  },
  {
    title: "3. Sözleşme Konusu Ürün/Hizmet Bilgileri",
    paragraphs: [
      "Ürün/hizmetin türü, miktarı, marka/modeli, birim fiyatı, ara toplam, vergiler, kargo bedeli ve toplam tutar sipariş onay ekranında ve Alıcı'ya iletilen sipariş teyit e-postasında gösterilir.",
      "Özel baskı siparişlerinde tasarım dosyası, ebat, adet ve teklif edilen birim/toplam fiyat sipariş detaylarında yer alır.",
    ],
  },
  {
    title: "4. Genel Hükümler",
    paragraphs: [
      "Alıcı, siparişi onaylamadan önce ön bilgilendirme formu, teslimat-iade şartları ve işbu Sözleşme hükümlerini okuduğunu, anladığını ve elektronik ortamda gerekli onayı verdiğini kabul eder.",
      "Sözleşme, Alıcı tarafından elektronik ortamda onaylandığı anda yürürlüğe girer.",
    ],
  },
  {
    title: "5. Ödeme Şekli ve Teslimat",
    paragraphs: [
      "Ödeme; banka havalesi/EFT, kredi kartı veya sitede sunulan diğer güvenli ödeme yöntemleri ile yapılır.",
      "Ürünler, Alıcı'nın sipariş formunda belirttiği adrese anlaşmalı kargo firması aracılığıyla teslim edilir. Teslimat süresi sipariş türüne göre değişebilir ve Alıcı'ya bildirilir.",
    ],
  },
  {
    title: "6. Cayma Hakkı",
    paragraphs: [
      "Alıcı, malı teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkına sahiptir.",
      "Cayma hakkının kullanılması için bu süre içinde Satıcı'ya info@solidmatbaa.com üzerinden yazılı bildirimde bulunulması yeterlidir.",
      "Alıcı'nın istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan kişiye özel ürünlerde (özel baskı vb.) cayma hakkı kullanılamaz.",
      "Cayma hakkı kullanımında iade edilen ürünün kullanılmamış ve yeniden satılabilir olması gerekir. İade bedeli, yasal süreler içinde Alıcı'ya iade edilir.",
    ],
  },
  {
    title: "7. Ayıplı Mal",
    paragraphs: [
      "Ayıplı mal/hizmet halinde Alıcı, yürürlükteki tüketici mevzuatından doğan seçimlik haklarını kullanabilir.",
    ],
  },
  {
    title: "8. Uyuşmazlık Çözümü",
    paragraphs: [
      "İşbu Sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığı tarafından her yıl ilan edilen parasal sınırlara göre Alıcı'nın yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.",
    ],
  },
  {
    title: "9. Yürürlük",
    paragraphs: [
      "Alıcı, siparişi onayladığı anda işbu Sözleşme'nin tüm hükümlerini kabul etmiş sayılır.",
      `${LEGAL_SELLER.name} — ${LEGAL_SELLER.email}`,
    ],
  },
];
