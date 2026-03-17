export type UserRole = 'admin' | 'kasir';
export type TransactionType = 'sale' | 'rental';
export type RentalStatus = 'active' | 'returned' | 'overdue';
export type TransactionStatus = 'completed' | 'pending' | 'cancelled';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price_sell: number;
  price_rent: number;
  stock: number;
  size: string;
  color: string;
  discount_percent: number;
  image_url: string;
  active: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  type: TransactionType;
  rental_days: number;
  discount_percent: number;
  subtotal: number;
}

export interface TransactionItem {
  product_id: string;
  product_name: string;
  quantity: number;
  type: TransactionType;
  price: number;
  rental_days: number;
  discount_percent: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  items: TransactionItem[];
  subtotal: number;
  discount_total: number;
  total: number;
  payment_amount: number;
  change_amount: number;
  customer_name: string;
  customer_phone: string;
  cashier_id: string;
  cashier_name: string;
  status: TransactionStatus;
  rental_start?: string;
  rental_end?: string;
  rental_status?: RentalStatus;
  deposit?: number;
  notes: string;
  created_at: string;
}

export interface StoreSettings {
  store_name: string;
  store_subtitle: string;
  store_logo: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  receipt_footer: string;
}

export interface DashboardStats {
  totalSalesToday: number;
  totalRentalsToday: number;
  totalRevenueToday: number;
  totalProducts: number;
  activeRentals: number;
  overdueRentals: number;
  lowStockProducts: number;
  totalTransactionsToday: number;
}

// === LICENSE TYPES ===
export type LicenseTier = 'starter' | 'professional' | 'enterprise';
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'suspended';

export interface License {
  id: string;
  license_key: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  tier: LicenseTier;
  status: LicenseStatus;
  domain_bound: string;
  device_fingerprint: string;
  max_products: number;
  max_users: number;
  activated_at: string;
  expires_at: string;
  created_at: string;
  notes: string;
  watermark_id: string;
}

export interface LicenseActivation {
  license_key: string;
  buyer_name: string;
  buyer_email: string;
  domain: string;
  fingerprint: string;
  tier: LicenseTier;
  expires_at: string;
  activated_at: string;
  watermark_id: string;
  max_products: number;
  max_users: number;
}
