// Database Types
export type UserRole = 'admin' | 'customer';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';
export type DiscountType = 'percentage' | 'fixed';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled';
export type ReturnReason =
  | 'defective'
  | 'wrong_item'
  | 'size_issue'
  | 'quality_issue'
  | 'not_as_described'
  | 'changed_mind'
  | 'damaged_in_transit'
  | 'other';
export type PaymentMethod = 'cod' | 'online';

// Table Types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  customer_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discounted_price?: number;
  category_id?: string;
  image_url: string;
  image_alt: string;
  colors: string[];
  sizes: string[];
  badge?: string;
  stock_status: StockStatus;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  image_alt: string;
  display_order: number;
  created_at: string;
}

export interface Design {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  image_alt: string;
  link?: string;
  badge?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Discount {
  id: string;
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until?: string;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string | null;
  customer_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  shipping_address: string;
  billing_address?: string | null;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  discount_code?: string | null;
  payment_method: PaymentMethod;
  shipping_cost: number;
  status: OrderStatus;
  items_count: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name: string;
  product_image: string;
  price: number;
  discounted_price?: number | null;
  quantity: number;
  color?: string | null;
  size?: string | null;
  subtotal: number;
  created_at: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  change_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reason?: string;
  created_by?: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  color?: string;
  size?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  status: ReviewStatus;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewModerationLog {
  id: string;
  review_id: string;
  moderator_id: string;
  action: string;
  previous_status: ReviewStatus;
  new_status: ReviewStatus;
  reason?: string;
  created_at: string;
}

export interface ReviewWithUser extends Review {
  user_profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface Return {
  id: string;
  return_number: string;
  order_id: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  reason: ReturnReason;
  reason_details?: string;
  status: ReturnStatus;
  refund_amount: number;
  refund_processed_at?: string;
  processed_by?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReturnItem {
  id: string;
  return_id: string;
  order_item_id?: string;
  product_name: string;
  product_image: string;
  quantity: number;
  refund_amount: number;
  created_at: string;
}
function Customer(...args: any[]): any {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: Customer is not implemented yet.', args);
  return null;
}

export { Customer };
