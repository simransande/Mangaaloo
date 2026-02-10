'use client';

import { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { CartItem } from './CartContent';

interface OrderSummaryProps {
  cartItems: CartItem[];
  couponCode: string;
  setCouponCode: Dispatch<SetStateAction<string>>;
  appliedCoupon: { code: string; discount: number } | null;
  handleApplyCoupon: () => void;
  handleRemoveCoupon: () => void;
  handleCheckout: () => void;
}

export default function OrderSummary({
  cartItems,
  couponCode,
  setCouponCode,
  appliedCoupon,
  handleApplyCoupon,
  handleRemoveCoupon,
  handleCheckout,
}: OrderSummaryProps) {
  // Add null check for cartItems
  const validCartItems = cartItems?.filter((item) => item && item.price != null) || [];

  const subtotal = validCartItems.reduce(
    (sum, item) => sum + (item.discountedPrice || item.price) * item.quantity,
    0
  );

  const shipping = subtotal >= 999 ? 0 : 50;
  const couponDiscount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discount) / 100) : 0;
  const total = subtotal + shipping - couponDiscount;

  const freeShippingProgress = Math.min((subtotal / 999) * 100, 100);

  return (
    <div className="glass-panel p-6 rounded-2xl sticky top-24 space-y-6">
      {/* Free Shipping Progress */}
      {subtotal < 999 && (
        <div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-muted-foreground">Free shipping progress</span>
            <span className="font-semibold text-primary">₹{999 - subtotal} to go</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Coupon Code */}
      <div>
        <label className="font-semibold text-sm block mb-2">Coupon Code</label>
        {appliedCoupon ? (
          <div className="flex items-center justify-between p-3 bg-success/10 border border-success rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="CheckCircleIcon" size={20} className="text-success" variant="solid" />
              <span className="font-semibold text-sm">
                {appliedCoupon.code} applied (-{appliedCoupon.discount}%)
              </span>
            </div>
            <button onClick={handleRemoveCoupon} className="text-error hover:underline text-sm">
              Remove
            </button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 px-4 py-2 border border-border rounded-lg outline-none focus:border-primary"
            />
            <button
              onClick={handleApplyCoupon}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all whitespace-nowrap"
            >
              Apply
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">Try: SAVE20 or FIRST10</p>
      </div>

      {/* Divider */}
      <div className="border-t border-border"></div>

      {/* Order Summary */}
      <div className="space-y-3">
        <h3 className="font-heading font-bold text-lg">Order Summary</h3>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">₹{subtotal}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Coupon Discount</span>
            <span className="font-semibold text-success">-₹{couponDiscount}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-semibold">
            {shipping === 0 ? <span className="text-success">Free</span> : `₹${shipping}`}
          </span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="font-bold text-lg">Total</span>
          <span className="font-bold text-2xl text-primary">₹{total}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        className="w-full px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all hover-lift"
      >
        Proceed to Checkout
      </button>

      {/* Continue Shopping */}
      <Link
        href="/product-listing"
        className="block text-center text-sm text-primary hover:underline"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
