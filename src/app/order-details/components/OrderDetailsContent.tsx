'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { orderService } from '@/lib/supabase/services/orders';
import { authService } from '@/lib/supabase/services/auth';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  price: number;
  discounted_price?: number;
  quantity: number;
  color?: string;
  size?: string;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  billing_address?: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  shipping_cost?: number;
  payment_method?: string;
  discount_code?: string;
  status: string;
  items_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function OrderDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Check authentication
        const user = await authService.getCurrentUser();
        if (!user) {
          router.push('/login?redirect=/order-details?id=' + orderId);
          return;
        }

        // Fetch order details
        const orderData = await orderService.getById(orderId);
        setOrder(orderData);

        // Fetch order items
        const items = await orderService.getOrderItems(orderId);
        setOrderItems(items);
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
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
        <Icon name="ExclamationTriangleIcon" size={64} className="mx-auto text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
        <Link
          href="/user-dashboard"
          className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    processing: 'bg-yellow-100 text-yellow-700',
    shipped: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/homepage" className="hover:text-foreground">
            Home
          </Link>
          <Icon name="ChevronRightIcon" size={16} />
          <Link href="/user-dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <Icon name="ChevronRightIcon" size={16} />
          <span className="text-foreground font-medium">Order Details</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Order #{order.order_number}</h1>
              <p className="text-sm text-gray-600">
                Placed on{' '}
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[order.status as keyof typeof statusColors] || statusColors.pending}`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
              {orderItems.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No items found</p>
              ) : (
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                        {item.color && <p className="text-sm text-gray-600">Color: {item.color}</p>}
                        {item.size && <p className="text-sm text-gray-600">Size: {item.size}</p>}
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ₹{(item.discounted_price || item.price).toFixed(2)}
                        </p>
                        {item.discounted_price && (
                          <p className="text-sm text-gray-500 line-through">
                            ₹{item.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
              <div className="text-gray-700">
                <p className="font-semibold">{order.customer_name}</p>
                <p className="text-sm mt-2 whitespace-pre-line">{order.shipping_address}</p>
                {order.customer_phone && (
                  <p className="text-sm mt-2">Phone: {order.customer_phone}</p>
                )}
                <p className="text-sm">Email: {order.customer_email}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{order.total_amount.toFixed(2)}</span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Discount {order.discount_code && `(${order.discount_code})`}
                    </span>
                    <span className="font-semibold text-green-600">
                      -₹{order.discount_amount.toFixed(2)}
                    </span>
                  </div>
                )}

                {order.shipping_cost !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">
                      {order.shipping_cost === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `₹${order.shipping_cost.toFixed(2)}`
                      )}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-primary">
                    ₹{order.final_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {order.payment_method && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <p className="font-semibold text-gray-900">
                    {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                  </p>
                </div>
              )}

              {order.notes && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Order Notes</p>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}

              <Link
                href="/user-dashboard"
                className="block w-full text-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
