'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { orderService } from '@/lib/supabase/services/orders';
import type { Order, OrderItem } from '@/lib/supabase/types';

function OrderConfirmationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        router.push('/homepage');
        return;
      }

      try {
        setLoading(true);
        const { order: fetchedOrder, items } = await orderService.getById(orderId);
        setOrder(fetchedOrder);
        setOrderItems(items);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Icon name="ExclamationCircleIcon" size={64} className="mx-auto text-red-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
        <p className="text-gray-600 mb-6">{error || 'Unable to load order details'}</p>
        <Link
          href="/homepage"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Go to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircleIcon" size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-4">
              Thank you for your order. We'll send you a confirmation email shortly.
            </p>
            <div className="inline-block bg-primary/10 px-6 py-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Order Number</p>
              <p className="text-xl font-bold text-primary">{order.order_number}</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>

            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer Name</p>
                  <p className="font-semibold text-gray-900">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-gray-900">{order.customer_email}</p>
                </div>
                {order.customer_phone && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-semibold text-gray-900">{order.customer_phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Icon name="BanknotesIcon" size={20} className="text-primary" />
                    Cash on Delivery
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Shipping Address</p>
                <p className="font-semibold text-gray-900">{order.shipping_address}</p>
              </div>

              {/* Order Status */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Status</p>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 pb-4 border-b border-gray-200 last:border-0"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.product_name}</h3>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} × ₹{item.discounted_price || item.price}
                    </p>
                    {(item.color || item.size) && (
                      <p className="text-sm text-gray-500">
                        {item.color && `Color: ${item.color}`}
                        {item.color && item.size && ' • '}
                        {item.size && `Size: ${item.size}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={order.shipping_cost === 0 ? 'text-green-600 font-semibold' : ''}>
                  {order.shipping_cost === 0 ? 'FREE' : `₹${order.shipping_cost.toFixed(2)}`}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {order.discount_code && `(${order.discount_code})`}</span>
                  <span>-₹{order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{order.final_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* COD Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <Icon
                name="InformationCircleIcon"
                size={24}
                className="text-blue-600 flex-shrink-0"
              />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Cash on Delivery Instructions</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Please keep exact change of ₹{order.final_amount.toFixed(2)} ready</li>
                  <li>• Payment will be collected by our delivery partner at your doorstep</li>
                  <li>• You can inspect the package before making payment</li>
                  <li>• Order tracking details will be sent to your email</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/user-dashboard"
              className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all text-center"
            >
              View My Orders
            </Link>
            <Link
              href="/product-listing"
              className="flex-1 px-6 py-3 bg-white text-primary border-2 border-primary font-semibold rounded-lg hover:bg-primary/5 transition-all text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationContent() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <OrderConfirmationInner />
    </Suspense>
  );
}
