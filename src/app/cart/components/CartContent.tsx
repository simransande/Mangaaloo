'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CartItems from './CartItems';
import OrderSummary from './OrderSummary';
import Icon from '@/components/ui/AppIcon';
import { authService } from '@/lib/supabase/services/auth';
import { cartService } from '@/lib/supabase/services/cart';
import { discountService } from '@/lib/supabase/services/discounts';
import { ecommerceTracking } from '@/lib/analytics';
import { useRouter } from 'next/navigation';
// ===============================
// STEP 1: Guest Cart Identifier
// ===============================
let guestId: string | null = null;

if (typeof window !== 'undefined') {
  guestId = localStorage.getItem('guest_id');

  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem('guest_id', guestId);
  }
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  discountedPrice?: number;
  image: string;
  imageAlt: string;
  color: string;
  size: string;
  quantity: number;
  stock: number;
}

export default function CartContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setLoading(true);

        // Try to get current user, but don't fail if not authenticated
        let user = null;
        try {
          user = await authService.getCurrentUser();
        } catch (authError) {
          console.log('User not authenticated, using guest cart');
        }

        if (!user) {
          // Guest user - use local storage
          const localCart = localStorage.getItem('cart');
          if (localCart) {
            const items = JSON.parse(localCart);
            setCartItems(items);
            // Track view cart event
            const totalValue = items.reduce((sum: number, item: CartItem) => {
              const price = item.discountedPrice || item.price;
              return sum + price * item.quantity;
            }, 0);
            ecommerceTracking.viewCart(
              items.map((item: CartItem) => ({
                id: item.id,
                name: item.name,
                price: item.discountedPrice || item.price,
                quantity: item.quantity,
              })),
              totalValue
            );
          }
          setLoading(false);
          return;
        }

        // Logged in user - fetch from database
        const items = await cartService.getCartItems(user.id);
        const formattedItems: CartItem[] = items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          discountedPrice: item.discountedPrice,
          image: item.image,
          imageAlt: item.imageAlt,
          color: item.color || '',
          size: item.size || '',
          quantity: item.quantity,
          stock: item.stock,
        }));
        setCartItems(formattedItems);
        // Track view cart event
        const totalValue = formattedItems.reduce((sum, item) => {
          const price = item.discountedPrice || item.price;
          return sum + price * item.quantity;
        }, 0);
        ecommerceTracking.viewCart(
          formattedItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.discountedPrice || item.price,
            quantity: item.quantity,
          })),
          totalValue
        );
      } catch (err: any) {
        console.error('Error fetching cart:', err);
        setError(err.message || 'Failed to load cart');
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const subtotal = cartItems.reduce((sum, item) => {
        const price = item.discountedPrice || item.price;
        return sum + price * item.quantity;
      }, 0);

      const result = await discountService.applyDiscount(couponCode, subtotal);
      setAppliedCoupon({
        code: couponCode,
        discount: result.discountAmount,
      });
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = () => {
    // Check if user is logged in
    authService
      .getCurrentUser()
      .then((user) => {
        if (!user) {
          // Save cart to localStorage before redirecting to login
          if (cartItems.length > 0) {
            localStorage.setItem('cart', JSON.stringify(cartItems));
          }
          router.push('/login?redirect=/checkout');
          return;
        }

        // Track begin checkout event
        const totalValue = cartItems.reduce((sum, item) => {
          const price = item.discountedPrice || item.price;
          return sum + price * item.quantity;
        }, 0);
        ecommerceTracking.beginCheckout(
          cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.discountedPrice || item.price,
            quantity: item.quantity,
          })),
          totalValue
        );

        // Navigate to checkout page
        router.push('/checkout');
      })
      .catch((err) => {
        console.error('Auth check error:', err);
        // Save cart and redirect to login
        if (cartItems.length > 0) {
          localStorage.setItem('cart', JSON.stringify(cartItems));
        }
        router.push('/login?redirect=/checkout');
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/homepage" className="hover:text-foreground">
            Home
          </Link>
          <Icon name="ChevronRightIcon" size={16} />
          <span className="text-foreground font-medium">Shopping Cart</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="container mx-auto px-4 py-6">
        <h1 className="font-heading font-bold text-3xl md:text-4xl">
          Shopping Cart ({cartItems.length} items)
        </h1>
      </div>

      {/* Cart Content */}
      {cartItems.length === 0 ? (
        <div className="container mx-auto px-4 py-20 text-center">
          <Icon name="ShoppingCartIcon" size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to get started</p>
          <Link
            href="/product-listing"
            className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <CartItems items={cartItems} onUpdateCart={setCartItems} />
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <OrderSummary
                cartItems={cartItems}
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                appliedCoupon={appliedCoupon}
                handleApplyCoupon={handleApplyCoupon}
                handleRemoveCoupon={handleRemoveCoupon}
                handleCheckout={handleCheckout}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
