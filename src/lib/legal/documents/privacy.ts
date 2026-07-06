import { LEGAL_SELLER, LEGAL_SELLER_BLOCK, type LegalSection } from "@/lib/legal/company";

export const privacyTitle = "Gizlilik Sözleşmesi";

export const privacySections: LegalSection[] = [
  {
    title: "1. Veri Sorumlusu",
    paragraphs: [
      LEGAL_SELLER_BLOCK,
      "6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") kapsamında kişisel verileriniz; veri sorumlusu sıfatıyla yukarıda bilgileri yer alan Satıcı tarafından aşağıda açıklanan çerçevede işlenmektedir.",
    ],
  },
  {
    title: "2. Kişisel Verilerin İşlenme Amaçları",
    paragraphs: [
      "Üyelik ve kimlik doğrulama işlemlerinin yürütülmesi,",
      "Sipariş, ödeme, faturalama, teslimat ve müşteri hizmetleri süreçlerinin yönetilmesi,",
      "Yasal yükümlülüklerin yerine getirilmesi ve resmi mercilerden gelen taleplerin karşılanması,",
      "Site güvenliğinin sağlanması, dolandırıcılık ve kötüye kullanımın önlenmesi,",
      "Talep halinde bilgilendirme, kampanya ve duyuruların iletilmesi (açık rıza veya mevzuat izni dahilinde),",
      "Hizmet kalitesinin artırılması ve istatistiksel analizlerin yapılması.",
    ],
  },
  {
    title: "3. İşlenen Kişisel Veri Kategorileri",
    paragraphs: [
      "Kimlik bilgileri (ad, soyad), iletişim bilgileri (e-posta, telefon, adres), müşteri işlem bilgileri (sipariş geçmişi, ödeme bilgisi, fatura), pazarlama bilgileri (tercihler, çerez kayıtları), işlem güvenliği bilgileri (IP, log kayıtları) ve gerekli hallerde finansal bilgiler işlenebilir.",
      "Ödeme kartı bilgileri, PCI-DSS uyumlu ödeme kuruluşları aracılığıyla işlenir; Satıcı kart numarasını sistemlerinde saklamaz.",
    ],
  },
  {
    title: "4. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebep",
    paragraphs: [
      "Kişisel verileriniz; web sitesi formları, sipariş ekranları, e-posta, telefon, çerezler ve benzeri elektronik ortamlar aracılığıyla otomatik veya otomatik olmayan yollarla toplanır.",
      "Veriler; KVKK m. 5/2 kapsamındaki sözleşmenin kurulması veya ifası, hukuki yükümlülük, meşru menfaat ve gerektiğinde açık rıza hukuki sebeplerine dayanılarak işlenir.",
    ],
  },
  {
    title: "5. Kişisel Verilerin Aktarılması",
    paragraphs: [
      "Kişisel verileriniz; kargo firmaları, ödeme kuruluşları, barındırma (hosting) hizmet sağlayıcıları, e-posta hizmet sağlayıcıları ve yasal zorunluluk halinde yetkili kamu kurumları ile paylaşılabilir.",
      "Yurt dışına aktarım söz konusu olduğunda KVKK m. 9 hükümlerine uygun hareket edilir.",
    ],
  },
  {
    title: "6. Kişisel Verilerin Saklanma Süresi",
    paragraphs: [
      "Kişisel veriler, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen zamanaşımı/resmi saklama süreleri kadar muhafaza edilir; sürenin sona ermesi halinde silinir, yok edilir veya anonim hale getirilir.",
    ],
  },
  {
    title: "7. Veri Sahibinin Hakları",
    paragraphs: [
      "KVKK m. 11 uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işleme sebebiyle zararın giderilmesini talep etme haklarına sahipsiniz.",
      `Taleplerinizi ${LEGAL_SELLER.email} adresine iletebilirsiniz. Başvurular en geç 30 gün içinde sonuçlandırılır.`,
    ],
  },
  {
    title: "8. Çerezler (Cookies)",
    paragraphs: [
      "Web sitemiz, kullanıcı deneyimini iyileştirmek, oturum yönetimi sağlamak ve istatistiksel analiz yapmak amacıyla çerez kullanabilir.",
      "Tarayıcı ayarlarınızdan çerezleri reddedebilir veya silebilirsiniz; bu durumda sitenin bazı işlevleri kısıtlanabilir.",
    ],
  },
  {
    title: "9. Güvenlik",
    paragraphs: [
      "Satıcı, kişisel verilerin hukuka aykırı olarak işlenmesini ve erişilmesini önlemek amacıyla uygun teknik ve idari güvenlik tedbirlerini uygular.",
    ],
  },
  {
    title: "10. Yürürlük ve Değişiklikler",
    paragraphs: [
      "İşbu Gizlilik Sözleşmesi yayımlandığı tarihte yürürlüğe girer. Satıcı, mevzuat veya hizmet değişikliklerine bağlı olarak metni güncelleyebilir; güncel metin web sitesinde yayımlanır.",
    ],
  },
];
