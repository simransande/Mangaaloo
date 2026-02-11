'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { authService } from '@/lib/supabase/services/auth';
import { cartService } from '@/lib/supabase/services/cart';
import { orderService } from '@/lib/supabase/services/orders';
import { customerService } from '@/lib/supabase/services/customers';
import type { UserProfile } from '@/lib/supabase/types';
import { ecommerceTracking, funnelTracking } from '@/lib/analytics';

interface CartItemWithProduct {
  id: string;
  productId: string;
  name: string;
  price: number;
  discountedPrice?: number;
  quantity: number;
  image: string;
  imageAlt: string;
  color?: string;
  size?: string;
}

function CheckoutInner() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Try to get current user
        let user = null;
        try {
          user = await authService.getCurrentUser();
        } catch (authError) {
          console.log('User not authenticated');
        }

        if (!user) {
          // Check if there are items in local storage
          const localCart = localStorage.getItem('cart');
          if (!localCart || JSON.parse(localCart).length === 0) {
            router.push('/cart');
            return;
          }
          // Redirect to login with return URL
          router.push('/login?redirect=/checkout');
          return;
        }

        const profile = await authService.getUserProfile(user.id);
        setUserProfile(profile);

        // Pre-fill form with user data
        setFormData((prev) => ({
          ...prev,
          fullName: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
        }));

        // Fetch cart items from database
        const dbCartItems = await cartService.getCartItems(user.id);

        // Transform to match interface
        const formattedItems: CartItemWithProduct[] = dbCartItems.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.name || 'Product',
          price: item.price || 0,
          discountedPrice: item.discountedPrice,
          quantity: item.quantity || 1,
          image: item.image || '/assets/images/no_image.png',
          imageAlt: item.imageAlt || item.name || 'Product image',
          color: item.color,
          size: item.size,
        }));

        setCartItems(formattedItems);

        if (formattedItems.length === 0) {
          router.push('/cart');
          return;
        }

        // Track checkout step
        funnelTracking.checkoutStep(1, 'Shipping Information');
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load checkout data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.discountedPrice || item.price;
      return sum + price * item.quantity;
    }, 0);
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    // Free shipping for orders above ₹999
    return subtotal >= 999 ? 0 : 50;
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = calculateSubtotal();
    return (subtotal * appliedCoupon.discount) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    const discount = calculateDiscount();
    return subtotal + shipping - discount;
  };

  const handlePlaceOrder = async () => {
    // Validate form
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.pincode
    ) {
      setError('Please fill in all required fields');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Get current user
      let user = null;
      try {
        user = await authService.getCurrentUser();
      } catch (err) {
        setError('Please login to complete your order');
        router.push('/login?redirect=/checkout');
        return;
      }

      if (!user) {
        setError('Please login to complete your order');
        router.push('/login?redirect=/checkout');
        return;
      }

      // Try to get or create customer record
      let customerId = null;
      try {
        const existingCustomer = await customerService.getByUserId(user.id);
        customerId = existingCustomer?.id || null;
      } catch (customerErr: any) {
        console.log('No existing customer record found');
      }

      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => {
        const price = item.discountedPrice || item.price;
        return sum + price * item.quantity;
      }, 0);

      const discountAmount = appliedCoupon?.discount || 0;
      const shippingCost = calculateShipping();
      const finalAmount = subtotal - discountAmount + shippingCost;

      // Create order with complete address
      const orderData = {
        user_id: user.id,
        customer_id: customerId,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        billing_address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        total_amount: subtotal,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        discount_code: appliedCoupon?.code || null,
        payment_method: 'cod' as const,
        shipping_cost: shippingCost,
        status: 'pending' as const,
        items_count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        order_number: `ORD-${Date.now()}`,
      };

      const orderItems = cartItems.map((item) => ({
        product_id: item.productId,
        product_name: item.name,
        product_image: item.image,
        price: item.price,
        discounted_price: item.discountedPrice || null,
        quantity: item.quantity,
        color: item.color || null,
        size: item.size || null,
        subtotal: (item.discountedPrice || item.price) * item.quantity,
      }));

      console.log('Creating order with data:', orderData);
      const order = await orderService.create(orderData, orderItems);
      console.log('Order created successfully:', order.order.id);

      // Track purchase event
      ecommerceTracking.purchase({
        transactionId: order.order.order_number,
        value: finalAmount,
        items: cartItems.map((item) => ({
          id: item.productId,
          name: item.name,
          price: item.discountedPrice || item.price,
          quantity: item.quantity,
        })),
      });

      // Clear cart
      await cartService.clearCart(user.id);
      localStorage.removeItem('cart');

      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'));

      // Redirect to order confirmation
      router.push(`/order-confirmation?orderId=${order.order.id}`);
    } catch (err: any) {
      console.error('Error placing order:', err?.message || String(err));
      setError(err?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
            <p className="text-gray-600">Complete your order with Cash on Delivery</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <Icon name="ExclamationCircleIcon" size={20} className="text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form
                onSubmit={handlePlaceOrder}
                className="bg-white rounded-xl shadow-md p-6 space-y-6"
              >
                {/* Shipping Information */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Icon name="TruckIcon" size={24} />
                    Shipping Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Street address, apartment, suite, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        required
                        pattern="[0-9]{6}"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="XXXXXX"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Order Notes (Optional)
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Any special instructions for delivery?"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Icon name="CurrencyRupeeIcon" size={24} />
                    Payment Method
                  </h2>
                  <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary rounded-lg">
                        <Icon name="BanknotesIcon" size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">Cash on Delivery (COD)</h3>
                        <p className="text-sm text-gray-600">
                          Pay with cash when your order is delivered
                        </p>
                      </div>
                      <Icon name="CheckCircleIcon" size={24} className="text-primary" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 flex items-start gap-2">
                    <Icon name="InformationCircleIcon" size={16} className="mt-0.5 flex-shrink-0" />
                    <span>
                      Please keep exact change ready. Our delivery partner will collect the payment
                      at your doorstep.
                    </span>
                  </p>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="glass-panel p-6 rounded-2xl sticky top-24 space-y-6">
                <h2 className="text-2xl font-bold">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.image || '/assets/images/no_image.png'}
                          alt={item.imageAlt || item.name || 'Product image'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/assets/images/no_image.png';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{item.name || 'Product'}</h3>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} × ₹{item.discountedPrice || item.price}
                        </p>
                        {item.color && <p className="text-xs text-gray-500">Color: {item.color}</p>}
                        {item.size && <p className="text-xs text-gray-500">Size: {item.size}</p>}
                      </div>
                      <div className="font-semibold">
                        ₹{((item.discountedPrice || item.price) * item.quantity).toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span
                      className={calculateShipping() === 0 ? 'text-green-600 font-semibold' : ''}
                    >
                      {calculateShipping() === 0 ? 'FREE' : `₹${calculateShipping().toFixed(2)}`}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-₹{calculateDiscount().toFixed(2)}</span>
                    </div>
                  )}
                  {calculateShipping() > 0 && (
                    <p className="text-xs text-gray-500">
                      Add ₹{(999 - calculateSubtotal()).toFixed(2)} more for FREE shipping
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{calculateTotal().toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    onClick={handlePlaceOrder}
                    disabled={submitting || cartItems.length === 0}
                    className="w-full px-6 py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="CheckCircleIcon" size={20} />
                        <span>Place Order</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/cart"
                    className="block text-center mt-4 text-sm text-primary hover:underline"
                  >
                    ← Back to Cart
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutContent() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
