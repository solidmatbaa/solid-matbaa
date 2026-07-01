import type { Locale } from "@/types";
import { getResend, getResendFrom } from "./resend";

interface EmailTemplate {
  subject: string;
  body: string;
}

const emailTemplates: Record<string, Record<Locale, EmailTemplate>> = {
  pending: {
    en: {
      subject: "Order received - {orderId}",
      body: "Dear {name},\n\nWe received your order {orderId}. Our team will review your payment receipt and confirm your order shortly.\n\nTotal: {total} EUR\n\nBest regards,\nSolid Matbaa Team",
    },
    ar: {
      subject: "تم استلام طلبك - {orderId}",
      body: "عزيزي {name}،\n\nاستلمنا طلبك {orderId}. سيقوم فريقنا بمراجعة إيصال الدفع وتأكيد طلبك قريباً.\n\nالإجمالي: {total} EUR\n\nمع أطيب التحيات،\nفريق سوليد مطبعة",
    },
    tr: {
      subject: "Sipariş alındı - {orderId}",
      body: "Sayın {name},\n\n{orderId} numaralı siparişiniz alındı. Ekibimiz ödeme makbuzunuzu inceleyip siparişinizi onaylayacaktır.\n\nToplam: {total} EUR\n\nSaygılarımızla,\nSolid Matbaa Ekibi",
    },
  },
  confirmed: {
    en: {
      subject: "Order approved - {orderId}",
      body: "Dear {name},\n\nYour order {orderId} has been approved and is being prepared.\n\nBest regards,\nSolid Matbaa Team",
    },
    ar: {
      subject: "تمت الموافقة على الطلب - {orderId}",
      body: "عزيزي {name}،\n\nتمت الموافقة على طلبك {orderId} وجاري تحضيره.\n\nمع أطيب التحيات،\nفريق سوليد مطبعة",
    },
    tr: {
      subject: "Sipariş onaylandı - {orderId}",
      body: "Sayın {name},\n\n{orderId} numaralı siparişiniz onaylandı ve hazırlanıyor.\n\nSaygılarımızla,\nSolid Matbaa Ekibi",
    },
  },
  rejected: {
    en: {
      subject: "Order rejected - {orderId}",
      body: "Dear {name},\n\nUnfortunately, your order {orderId} has been rejected. Please contact us if you have questions.\n\nBest regards,\nSolid Matbaa Team",
    },
    ar: {
      subject: "تم رفض الطلب - {orderId}",
      body: "عزيزي {name}،\n\nللأسف، تم رفض طلبك {orderId}. يرجى التواصل معنا إذا كان لديك أي استفسار.\n\nمع أطيب التحيات،\nفريق سوليد مطبعة",
    },
    tr: {
      subject: "Sipariş reddedildi - {orderId}",
      body: "Sayın {name},\n\nMaalesef {orderId} numaralı siparişiniz reddedildi. Sorularınız için bizimle iletişime geçin.\n\nSaygılarımızla,\nSolid Matbaa Ekibi",
    },
  },
  processing: {
    en: {
      subject: "Order in production - {orderId}",
      body: "Dear {name},\n\nYour order {orderId} is now being processed.\n\nBest regards,\nSolid Matbaa Team",
    },
    ar: {
      subject: "الطلب قيد الإنتاج - {orderId}",
      body: "عزيزي {name}،\n\nطلبك {orderId} قيد المعالجة الآن.\n\nمع أطيب التحيات،\nفريق سوليد مطبعة",
    },
    tr: {
      subject: "Sipariş üretimde - {orderId}",
      body: "Sayın {name},\n\n{orderId} numaralı siparişiniz işleniyor.\n\nSaygılarımızla,\nSolid Matbaa Ekibi",
    },
  },
  shipped: {
    en: {
      subject: "Your order has been shipped - {orderId}",
      body: "Dear {name},\n\nYour order {orderId} has been shipped!\n\nTracking: {trackingNumber}\nCarrier: {shippingCompany}\nTrack: {trackingUrl}\n\nBest regards,\nSolid Matbaa Team",
    },
    ar: {
      subject: "تم شحن طلبك - {orderId}",
      body: "عزيزي {name}،\n\nتم شحن طلبك {orderId}!\n\nرقم التتبع: {trackingNumber}\nشركة الشحن: {shippingCompany}\nالتتبع: {trackingUrl}\n\nمع أطيب التحيات،\nفريق سوليد مطبعة",
    },
    tr: {
      subject: "Siparişiniz kargoya verildi - {orderId}",
      body: "Sayın {name},\n\n{orderId} numaralı siparişiniz kargoya verildi!\n\nTakip No: {trackingNumber}\nKargo: {shippingCompany}\nTakip: {trackingUrl}\n\nSaygılarımızla,\nSolid Matbaa Ekibi",
    },
  },
  delivered: {
    en: {
      subject: "Your order has been delivered - {orderId}",
      body: "Dear {name},\n\nYour order {orderId} has been delivered. Thank you for choosing Solid Matbaa!\n\nBest regards,\nSolid Matbaa Team",
    },
    ar: {
      subject: "تم تسليم طلبك - {orderId}",
      body: "عزيزي {name}،\n\nتم تسليم طلبك {orderId}. شكراً لاختيارك سوليد مطبعة!\n\nمع أطيب التحيات،\nفريق سوليد مطبعة",
    },
    tr: {
      subject: "Siparişiniz teslim edildi - {orderId}",
      body: "Sayın {name},\n\n{orderId} numaralı siparişiniz teslim edildi. Solid Matbaa'yı tercih ettiğiniz için teşekkürler!\n\nSaygılarımızla,\nSolid Matbaa Ekibi",
    },
  },
  refund_processed: {
    en: {
      subject: "Refund processed - {orderId}",
      body: "Dear {name},\n\nYour refund for order {orderId} has been processed.\n\nBest regards,\nSolid Matbaa Team",
    },
    ar: {
      subject: "تم استرداد المبلغ - {orderId}",
      body: "عزيزي {name}،\n\nتم استرداد المبلغ لطلبك {orderId}.\n\nمع أطيب التحيات،\nفريق سوليد مطبعة",
    },
    tr: {
      subject: "İade işlendi - {orderId}",
      body: "Sayın {name},\n\n{orderId} numaralı siparişiniz için iadeniz işlendi.\n\nSaygılarımızla,\nSolid Matbaa Ekibi",
    },
  },
  payment_submitted: {
    en: {
      subject: "Payment submitted - {orderId}",
      body: "Dear {name},\n\nWe received your payment proof for order {orderId}. Our team will verify it and start processing your order.\n\nTotal: {total} EUR\n\nBest regards,\nSolid Matbaa Team",
    },
    ar: {
      subject: "تم إرسال الدفع - {orderId}",
      body: "عزيزي {name}،\n\nاستلمنا إثبات الدفع للطلب {orderId}. سيقوم فريقنا بالتحقق وبدء المعالجة.\n\nالإجمالي: {total} EUR\n\nمع أطيب التحيات،\nفريق سوليد مطبعة",
    },
    tr: {
      subject: "Ödeme gönderildi - {orderId}",
      body: "Sayın {name},\n\n{orderId} siparişi için ödeme kanıtınız alındı. Ekibimiz doğrulayıp siparişinizi işleme alacaktır.\n\nToplam: {total} EUR\n\nSaygılarımızla,\nSolid Matbaa Ekibi",
    },
  },
  paid: {
    en: {
      subject: "Payment received - {orderId}",
      body: "Dear {name},\n\nWe received your payment proof for order {orderId}. Our team will verify it and start processing your order.\n\nTotal: {total} EUR\n\nBest regards,\nSolid Matbaa Team",
    },
    ar: {
      subject: "تم استلام الدفع - {orderId}",
      body: "عزيزي {name}،\n\nاستلمنا إثبات الدفع للطلب {orderId}. سيقوم فريقنا بالتحقق وبدء المعالجة.\n\nالإجمالي: {total} EUR\n\nمع أطيب التحيات،\nفريق سوليد مطبعة",
    },
    tr: {
      subject: "Ödeme alındı - {orderId}",
      body: "Sayın {name},\n\n{orderId} siparişi için ödeme kanıtınız alındı. Ekibimiz doğrulayıp siparişinizi işleme alacaktır.\n\nToplam: {total} EUR\n\nSaygılarımızla,\nSolid Matbaa Ekibi",
    },
  },
};

const STATUS_ALIASES: Record<string, string> = {
  confirmed: "approved",
  shipped: "shipping",
  refund_processed: "refunded",
  pending_payment: "waiting_for_payment",
  paid: "payment_submitted",
  payment_submitted: "payment_submitted",
};

function normalizeStatusKey(status: string): string {
  return STATUS_ALIASES[status] ?? status;
}

// Spec status names (approved/shipping/refunded) mirror legacy template keys
emailTemplates.approved = emailTemplates.confirmed;
emailTemplates.shipping = emailTemplates.shipped;
emailTemplates.refunded = emailTemplates.refund_processed;
emailTemplates.paid = emailTemplates.payment_submitted;

const rejectionTemplates: Record<Locale, EmailTemplate> = {
  en: {
    subject: "Order rejected - {orderId}",
    body: "Dear {name},\n\nUnfortunately, your order {orderId} has been rejected.\n\nReason: {reason}\n\nTotal: {total} EUR\n\nBest regards,\nSolid Matbaa Team",
  },
  ar: {
    subject: "تم رفض الطلب - {orderId}",
    body: "عزيزي {name}،\n\nللأسف، تم رفض طلبك {orderId}.\n\nالسبب: {reason}\n\nالإجمالي: {total} EUR\n\nمع أطيب التحيات،\nفريق سوليد مطبعة",
  },
  tr: {
    subject: "Sipariş reddedildi - {orderId}",
    body: "Sayın {name},\n\nMaalesef {orderId} numaralı siparişiniz reddedildi.\n\nSebep: {reason}\n\nToplam: {total} EUR\n\nSaygılarımızla,\nSolid Matbaa Ekibi",
  },
};

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

export async function sendCustomOrderApprovedEmail(
  to: string,
  locale: Locale,
  vars: {
    name: string;
    orderId: string;
    total: string;
    quantity: string;
    designSize: string;
    adminNotes?: string;
  }
): Promise<boolean> {
  const templates: Record<Locale, EmailTemplate> = {
    en: {
      subject: "Your custom order quote - {orderId}",
      body: "Dear {name},\n\nYour custom order {orderId} has been approved.\n\nDesign size: {designSize}\nQuantity: {quantity}\nFinal price: {total} EUR\n{adminNotesBlock}\nGo to My Orders → Custom Orders and tap Order Now to submit your bank transfer receipt.\n\nBest regards,\nSolid Matbaa Team",
    },
    ar: {
      subject: "عرض سعر طلبك المخصص - {orderId}",
      body: "عزيزي {name}،\n\nتمت الموافقة على طلبك المخصص {orderId}.\n\nمقاس التصميم: {designSize}\nالكمية: {quantity}\nالسعر النهائي: {total} EUR\n{adminNotesBlock}\nانتقل إلى طلباتي → طلبات مخصصة واضغط «اطلب الآن» لإرسال إيصال التحويل البنكي.\n\nمع أطيب التحيات،\nفريق سوليد مطبعة",
    },
    tr: {
      subject: "Özel sipariş teklifiniz - {orderId}",
      body: "Sayın {name},\n\n{orderId} numaralı özel siparişiniz onaylandı.\n\nTasarım boyutu: {designSize}\nAdet: {quantity}\nNihai fiyat: {total} EUR\n{adminNotesBlock}\nSiparişlerim → Özel Siparişler bölümünden Şimdi Sipariş Ver'e tıklayarak havale makbuzunuzu gönderin.\n\nSaygılarımızla,\nSolid Matbaa Ekibi",
    },
  };

  const template = templates[locale] ?? templates.en;
  const adminNotesBlock = vars.adminNotes?.trim()
    ? locale === "ar"
      ? `ملاحظات الإدارة: ${vars.adminNotes.trim()}`
      : locale === "tr"
        ? `Yönetici notları: ${vars.adminNotes.trim()}`
        : `Admin notes: ${vars.adminNotes.trim()}`
    : "";

  const allVars = {
    ...vars,
    adminNotesBlock: adminNotesBlock ? `${adminNotesBlock}\n` : "",
  };

  const subject = interpolate(template.subject, allVars);
  const text = interpolate(template.body, allVars);

  try {
    const resend = getResend();
    const from = getResendFrom();
    await resend.emails.send({ from, to, subject, text });
    return true;
  } catch (err) {
    console.error("Custom order approved email failed:", err);
    return false;
  }
}

export async function sendStatusEmail(
  to: string,
  status: string,
  locale: Locale,
  vars: {
    name: string;
    orderId: string;
    total?: string;
    trackingNumber?: string;
    shippingCompany?: string;
    trackingUrl?: string;
  }
): Promise<boolean> {
  const templateKey = normalizeStatusKey(status);
  const template = emailTemplates[templateKey]?.[locale] ?? emailTemplates[templateKey]?.en;
  if (!template) return false;

  const subject = interpolate(template.subject, vars);
  const text = interpolate(template.body, vars);

  try {
    const resend = getResend();
    const from = getResendFrom();

    await resend.emails.send({ from, to, subject, text });
    return true;
  } catch (err) {
    console.error("Resend email failed:", err);
    return false;
  }
}

export async function sendRejectionEmail(
  to: string,
  locale: Locale,
  vars: {
    name: string;
    orderId: string;
    reason: string;
    total: string;
  }
): Promise<boolean> {
  const template = rejectionTemplates[locale] ?? rejectionTemplates.en;
  const subject = interpolate(template.subject, vars);
  const text = interpolate(template.body, vars);

  try {
    const resend = getResend();
    const from = getResendFrom();
    const result = await resend.emails.send({ from, to, subject, text });
    if (result.error) {
      console.error("Rejection email API error:", result.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Rejection email failed:", err);
    return false;
  }
}

export function getNotificationContent(
  status: string,
  orderId: string
): { type: string; title: Record<Locale, string>; message: Record<Locale, string> } {
  const map: Record<string, { type: string; title: Record<Locale, string>; message: Record<Locale, string> }> = {
    pending: {
      type: "order_placed",
      title: { en: "Order Received", ar: "تم استلام الطلب", tr: "Sipariş Alındı" },
      message: {
        en: `Your order ${orderId} has been received and is pending review.`,
        ar: `تم استلام طلبك ${orderId} وهو قيد المراجعة.`,
        tr: `${orderId} numaralı siparişiniz alındı ve inceleniyor.`,
      },
    },
    approved: {
      type: "order_confirmed",
      title: { en: "Order Approved", ar: "تمت الموافقة", tr: "Sipariş Onaylandı" },
      message: {
        en: `Order ${orderId} has been approved.`,
        ar: `تمت الموافقة على الطلب ${orderId}.`,
        tr: `${orderId} numaralı sipariş onaylandı.`,
      },
    },
    waiting_for_payment: {
      type: "custom_order_approved",
      title: { en: "Quote Approved", ar: "تم اعتماد السعر", tr: "Teklif Onaylandı" },
      message: {
        en: `Custom order ${orderId} is ready for payment. Tap Order Now in Custom Orders.`,
        ar: `الطلب المخصص ${orderId} جاهز للدفع. اضغط «اطلب الآن» في طلباتك المخصصة.`,
        tr: `${orderId} özel siparişi ödemeye hazır. Özel Siparişler'de Şimdi Sipariş Ver'e tıklayın.`,
      },
    },
    pending_payment: {
      type: "custom_order_approved",
      title: { en: "Quote Approved", ar: "تم اعتماد السعر", tr: "Teklif Onaylandı" },
      message: {
        en: `Custom order ${orderId} is ready for payment. Tap Order Now in Custom Orders.`,
        ar: `الطلب المخصص ${orderId} جاهز للدفع. اضغط «اطلب الآن» في طلباتك المخصصة.`,
        tr: `${orderId} özel siparişi ödemeye hazır. Özel Siparişler'de Şimdi Sipariş Ver'e tıklayın.`,
      },
    },
    paid: {
      type: "paid",
      title: { en: "Payment Received", ar: "تم استلام الدفع", tr: "Ödeme Alındı" },
      message: {
        en: `Payment proof for order ${orderId} was submitted.`,
        ar: `تم إرسال إثبات الدفع للطلب ${orderId}.`,
        tr: `${orderId} siparişi için ödeme kanıtı gönderildi.`,
      },
    },
    payment_submitted: {
      type: "payment_submitted",
      title: { en: "Payment Submitted", ar: "تم إرسال الدفع", tr: "Ödeme Gönderildi" },
      message: {
        en: `Payment proof for order ${orderId} was submitted.`,
        ar: `تم إرسال إثبات الدفع للطلب ${orderId}.`,
        tr: `${orderId} siparişi için ödeme kanıtı gönderildi.`,
      },
    },
    confirmed: {
      type: "order_confirmed",
      title: { en: "Order Approved", ar: "تمت الموافقة", tr: "Sipariş Onaylandı" },
      message: {
        en: `Order ${orderId} has been approved.`,
        ar: `تمت الموافقة على الطلب ${orderId}.`,
        tr: `${orderId} numaralı sipariş onaylandı.`,
      },
    },
    rejected: {
      type: "order_rejected",
      title: { en: "Order Rejected", ar: "تم رفض الطلب", tr: "Sipariş Reddedildi" },
      message: {
        en: `Order ${orderId} has been rejected.`,
        ar: `تم رفض الطلب ${orderId}.`,
        tr: `${orderId} numaralı sipariş reddedildi.`,
      },
    },
    processing: {
      type: "order_processing",
      title: { en: "In Production", ar: "قيد الإنتاج", tr: "Üretimde" },
      message: {
        en: `Order ${orderId} is being processed.`,
        ar: `الطلب ${orderId} قيد المعالجة.`,
        tr: `${orderId} numaralı sipariş işleniyor.`,
      },
    },
    shipping: {
      type: "order_shipped",
      title: { en: "Order Shipping", ar: "قيد الشحن", tr: "Kargoda" },
      message: {
        en: `Order ${orderId} is on its way!`,
        ar: `الطلب ${orderId} في الطريق!`,
        tr: `${orderId} numaralı sipariş yolda!`,
      },
    },
    shipped: {
      type: "order_shipped",
      title: { en: "Order Shipped", ar: "تم الشحن", tr: "Kargoya Verildi" },
      message: {
        en: `Order ${orderId} is on its way!`,
        ar: `الطلب ${orderId} في الطريق!`,
        tr: `${orderId} numaralı sipariş yolda!`,
      },
    },
    delivered: {
      type: "order_delivered",
      title: { en: "Order Delivered", ar: "تم التسليم", tr: "Teslim Edildi" },
      message: {
        en: `Order ${orderId} has been delivered.`,
        ar: `تم تسليم الطلب ${orderId}.`,
        tr: `${orderId} numaralı sipariş teslim edildi.`,
      },
    },
    refunded: {
      type: "refund_processed",
      title: { en: "Refund Processed", ar: "تم الاسترداد", tr: "İade İşlendi" },
      message: {
        en: `Refund for order ${orderId} has been processed.`,
        ar: `تم استرداد المبلغ للطلب ${orderId}.`,
        tr: `${orderId} numaralı sipariş için iade işlendi.`,
      },
    },
    refund_processed: {
      type: "refund_processed",
      title: { en: "Refund Processed", ar: "تم الاسترداد", tr: "İade İşlendi" },
      message: {
        en: `Refund for order ${orderId} has been processed.`,
        ar: `تم استرداد المبلغ للطلب ${orderId}.`,
        tr: `${orderId} numaralı sipariş için iade işlendi.`,
      },
    },
  };

  const key = normalizeStatusKey(status);
  return map[key] ?? map.pending;
}
