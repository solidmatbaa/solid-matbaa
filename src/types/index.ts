export type Locale = "en" | "ar" | "tr";

export type LocalizedString = Record<Locale, string>;

export type UserRole = "customer" | "admin";

export type OrderStatus =
  | "pending"
  | "pending_approval"
  | "approved"
  | "waiting_for_payment"
  | "payment_submitted"
  | "processing"
  | "shipping"
  | "delivered"
  | "refunded"
  | "rejected";

export type OrderType = "standard" | "custom";

export type ReturnStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "shipping"
  | "inspecting"
  | "refunded";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface UserAddress {
  country: string;
  /** State / Province (İl) */
  state: string;
  /** City (when applicable) */
  city: string;
  /** District (İlçe — when applicable, e.g. Turkey) */
  district?: string;
  /** Neighborhood (Mahalle) */
  region: string;
  /** Street name */
  street: string;
  building_number: string;
  apartment_number: string;
  postal_code?: string;
  additional_details?: string;
  /** Explicit hierarchy fields stored alongside legacy keys */
  province?: string;
  neighborhood?: string;
}

export interface Profile {
  id: string;
  tenant_id: string | null;
  role: UserRole;
  username: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  locale: Locale;
  email_verified: boolean;
  address: UserAddress | null;
  created_at: string;
  updated_at: string;
}

export interface PricingTier {
  quantity: number;
  price: number;
}

export interface ShippingInfo {
  tracking_number: string;
  shipping_carrier: string;
  shipping_url: string;
  /** @deprecated Legacy JSONB key — use shipping_carrier */
  shipping_company?: string;
  /** @deprecated Legacy JSONB key — use shipping_url */
  tracking_url?: string;
}

export interface ProductSpec {
  key: string;
  label: LocalizedString;
  options: string[];
}

export interface Product {
  id: string;
  tenant_id: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  pricing_tiers: PricingTier[];
  image_url: string | null;
  sizes: string[];
  specs: ProductSpec[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  user_id: string;
  status: OrderStatus;
  order_type: OrderType;
  is_archived: boolean;
  shipping_address: ShippingAddress | null;
  total_amount: number;
  notes: string | null;
  admin_notes: string | null;
  file_url: string | null;
  design_file_url: string | null;
  receipt_url: string | null;
  /** Fixed bank account holder name (Hamza Ghazal) */
  account_holder_name: string | null;
  /** IBAN for this order, set by admin during payment verification */
  payment_iban: string | null;
  shipping_info: ShippingInfo | null;
  tracking_number: string | null;
  shipping_carrier: string | null;
  shipping_url: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  profiles?: Pick<Profile, "full_name" | "email" | "username" | "phone" | "address">;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: LocalizedString | null;
  quantity: number;
  unit_price: number;
  specs: Record<string, string>;
  size: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Return {
  id: string;
  order_id: string;
  user_id: string;
  tenant_id: string;
  reason: string;
  status: ReturnStatus;
  is_archived: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  orders?: Pick<
    Order,
    | "id"
    | "total_amount"
    | "status"
    | "order_type"
    | "tracking_number"
    | "shipping_carrier"
    | "shipping_url"
    | "shipping_info"
  >;
}

export interface Notification {
  id: string;
  user_id: string;
  tenant_id: string;
  type: string;
  title: LocalizedString;
  message: LocalizedString;
  read: boolean;
  order_id: string | null;
  return_id: string | null;
  created_at: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: LocalizedString;
}

export interface SiteContent {
  hero_title: LocalizedString;
  hero_subtitle: LocalizedString;
  hero_button_designs: LocalizedString;
  hero_button_custom: LocalizedString;
  instagram_url: string;
  facebook_url: string;
}

export interface Settings {
  id: string;
  tenant_id: string;
  hero_images: string[];
  sizes: string[];
  iban: string | null;
  contact_info: ContactInfo;
  site_content?: SiteContent;
  updated_at: string;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  country: string;
  postal_code?: string;
}

export interface CartItem {
  productId: string;
  productName: LocalizedString;
  price: number;
  tierQuantity: number;
  quantity: number;
  imageUrl: string | null;
}

export type OrderTab = "custom" | "active" | "history" | "returns";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UpdateOrderStatusPayload {
  orderId: string;
  status: OrderStatus;
  shippingInfo?: ShippingInfo;
  rejectionReason?: string;
}

export interface CreateReturnPayload {
  orderId: string;
  reason: string;
}

export interface UpdateSettingsPayload {
  hero_images?: string[];
  sizes?: string[];
  iban?: string;
  contact_info?: ContactInfo;
  site_content?: SiteContent;
}
