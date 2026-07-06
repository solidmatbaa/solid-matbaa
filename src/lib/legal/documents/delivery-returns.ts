import { LEGAL_SELLER, LEGAL_SELLER_BLOCK, type LegalSection } from "@/lib/legal/company";

export const deliveryReturnsTitle = "Teslimat ve İade Şartları";

export const deliveryReturnsSections: LegalSection[] = [
  {
    title: "1. Satıcı Bilgileri",
    paragraphs: [LEGAL_SELLER_BLOCK],
  },
  {
    title: "2. Konu ve Kapsam",
    paragraphs: [
      "İşbu Teslimat ve İade Şartları, Alıcı'nın www.solidmatbaa.com internet sitesi üzerinden elektronik ortamda sipariş verdiği ürün ve hizmetlerin teslimatı ile iade/değişim süreçlerine ilişkin usul ve esasları düzenler.",
      "Sipariş veren her Alıcı, işbu şartları okuduğunu, anladığını ve kabul ettiğini beyan eder.",
    ],
  },
  {
    title: "3. Sipariş ve Onay Süreci",
    paragraphs: [
      "Siparişler, ödeme onayı ve (varsa) tasarım/onay süreçlerinin tamamlanmasının ardından üretim planına alınır.",
      "Özel baskı siparişlerinde fiyat teklifi, Alıcı onayı ve ödeme makbuzunun doğrulanması sonrasında üretim başlatılır.",
      "Satıcı, stok, üretim kapasitesi veya mücbir sebep hallerinde siparişi kısmen veya tamamen reddetme hakkını saklı tutar; bu durumda Alıcı bilgilendirilir ve ödenen bedel iade edilir.",
    ],
  },
  {
    title: "4. Teslimat Süresi ve Yöntemi",
    paragraphs: [
      "Teslimat süresi; sipariş türüne, üretim yoğunluğuna ve kargo firmasının operasyonel koşullarına göre değişiklik gösterebilir. Tahmini teslimat süresi sipariş onayı sırasında veya sipariş takip ekranında bildirilir.",
      "Ürünler, Alıcı'nın sipariş sırasında bildirdiği teslimat adresine, anlaşmalı kargo firması aracılığıyla teslim edilir.",
      "Teslimat, Alıcı'nın adresinde bulunmaması veya teslimatın kabul edilmemesi halinde kargo firmasının prosedürleri uygulanır; ek bekleme/nakliye bedelleri Alıcı'ya ait olabilir.",
    ],
  },
  {
    title: "5. Teslimat Masrafları",
    paragraphs: [
      "Kargo ve teslimat bedeli, sipariş özetinde ayrıca gösterilir. Kampanya dönemlerinde ücretsiz kargo uygulanabilir; bu durum site üzerinde ilan edilir.",
      "Uluslararası gönderimlerde gümrük, vergi ve ek nakliye masrafları Alıcı'ya aittir.",
    ],
  },
  {
    title: "6. Teslimat Anında Kontrol Yükümlülüğü",
    paragraphs: [
      "Alıcı, ürünü teslim alırken ambalajın hasarsız olduğunu kontrol etmekle yükümlüdür.",
      "Hasarlı veya eksik teslimat durumunda, teslimat tutanağına kayıt düşülmesi ve en geç 48 saat içinde info@solidmatbaa.com adresine bildirim yapılması gerekir.",
    ],
  },
  {
    title: "7. Cayma Hakkı",
    paragraphs: [
      "6502 sayılı Tüketicinin Korunması Hakkında Kanun uyarınca Alıcı, onaylanmış mesafeli satış sözleşmelerinde 14 (ondört) gün içinde herhangi bir gerekçe göstermeksizin cayma hakkına sahiptir.",
      "Cayma hakkı süresi, malın Alıcı veya belirlediği üçüncü kişiye teslim edildiği günden itibaren başlar.",
      "Cayma bildirimi info@solidmatbaa.com adresine yazılı olarak iletilmelidir.",
    ],
  },
  {
    title: "8. Cayma Hakkının İstisnaları",
    paragraphs: [
      "Alıcı'nın istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan, kişiye özel üretilen (özel baskı, kişiselleştirilmiş tasarım vb.) ürünlerde cayma hakkı kullanılamaz.",
      "Niteliği itibarıyla iade edilemeyecek ürünler, hijyen ve sağlık açısından iadeye uygun olmayan açılmış ambalajlı mallar ile dijital içeriklerde yürürlükteki mevzuat hükümleri saklıdır.",
    ],
  },
  {
    title: "9. İade Koşulları ve Süreci",
    paragraphs: [
      "Cayma hakkı kapsamındaki iadelerde ürün, kullanılmamış ve yeniden satılabilir durumda olmalıdır.",
      "İade kargo bedeli, yürürlükteki mevzuat hükümlerine tabidir. Satıcı, iade adresini ve süreci Alıcı'ya e-posta ile bildirir.",
      "İade edilen ürün Satıcı'ya ulaştıktan sonra en geç 14 gün içinde ödeme, Alıcı'nın kullandığı ödeme aracına uygun şekilde iade edilir.",
    ],
  },
  {
    title: "10. Ayıplı Mal ve Hizmet",
    paragraphs: [
      "Teslim edilen ürünün ayıplı olması halinde Alıcı, 6502 sayılı Kanun ve ilgili mevzuattan doğan seçimlik haklarını (tamir, değişim, bedel indirimi, sözleşmeden dönme) kullanabilir.",
      "Ayıp bildirimleri info@solidmatbaa.com adresine sipariş numarası ve görsel delillerle birlikte iletilmelidir.",
    ],
  },
  {
    title: "11. İletişim",
    paragraphs: [
      `Teslimat ve iade süreçlerine ilişkin tüm talepleriniz için ${LEGAL_SELLER.email} adresinden ${LEGAL_SELLER.name} ile iletişime geçebilirsiniz.`,
    ],
  },
];
