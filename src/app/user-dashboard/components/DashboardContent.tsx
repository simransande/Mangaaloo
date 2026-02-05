'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { authService } from '@/lib/supabase/services/auth';
import { orderService } from '@/lib/supabase/services/orders';
import type { UserProfile, Order } from '@/lib/supabase/types';
import { ecommerceTracking } from '@/lib/analytics';

export default function DashboardContent() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // First check if we have a session
        const { data: { session }, error: sessionError } = await authService.getCurrentSession();

        if (sessionError || !session) {
          console.log('No active session, redirecting to login');
          router.push('/login');
          return;
        }

        const user = await authService.getCurrentUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const profile = await authService.getUserProfile(user.id);
        setUserProfile(profile);

        // Fetch user's orders
        const orders = await orderService.getAll(user.id);
        setRecentOrders(orders.slice(0, 3)); // Get 3 most recent orders

        // Track purchase events for completed orders
        orders.forEach((order) => {
          if (order.status === 'delivered' && !sessionStorage.getItem(`tracked_${order.id}`)) {
            ecommerceTracking.purchase({
              transactionId: order.id,
              value: order.total_amount,
              tax: 0,
              shipping: order.shipping_cost || 0,
              items: [{
                id: order.id,
                name: 'Order Items',
                price: order.total_amount,
                quantity: 1,
              }],
            });
            sessionStorage.setItem(`tracked_${order.id}`, 'true');
          }
        });

        // Subscribe to real-time order updates
        const channel = orderService.subscribeToOrderUpdates(
          (updatedOrder) => {
            setRecentOrders((prevOrders) => {
              const orderIndex = prevOrders.findIndex((o) => o.id === updatedOrder.id);
              if (orderIndex !== -1) {
                // Update existing order
                const newOrders = [...prevOrders];
                newOrders[orderIndex] = updatedOrder;
                return newOrders;
              } else {
                // Add new order
                return [updatedOrder, ...prevOrders].slice(0, 3);
              }
            });
          },
          user.id
        );

        // Cleanup subscription on unmount
        return () => {
          orderService.unsubscribe(channel);
        };
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        if (err.message?.includes('Auth session missing')) {
          router.push('/login');
        } else {
          setError(err.message || 'Failed to load user data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.push('/homepage');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'HomeIcon' },
    { id: 'orders', label: 'My Orders', icon: 'ShoppingBagIcon' },
    { id: 'profile', label: 'Profile', icon: 'UserIcon' },
    { id: 'addresses', label: 'Addresses', icon: 'MapPinIcon' },
  ];

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
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {userProfile?.full_name || 'User'}!</h1>
              <p className="text-white/80">{userProfile?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
            >
              <Icon name="ArrowRightOnRectangleIcon" size={20} />
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icon name={tab.icon} size={20} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Icon name="ShoppingBagIcon" size={24} className="text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-600">Total Orders</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{recentOrders.length}</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Icon name="CurrencyDollarIcon" size={24} className="text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Total Spent</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{recentOrders.reduce((sum, order) => sum + order.final_amount, 0).toFixed(2)}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Icon name="HeartIcon" size={24} className="text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-600">Wishlist</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Orders</h2>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon name="ShoppingBagIcon" size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-4">No orders yet</p>
                    <Link
                      href="/product-listing"
                      className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="font-semibold text-gray-900">{order.order_number}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              Last updated: {new Date(order.updated_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()} • {order.items_count} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">₹{order.final_amount}</p>
                          <Link
                            href={`/order-details?id=${order.id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">All Orders</h2>
              <p className="text-gray-600">Order history will be displayed here</p>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={userProfile?.full_name || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={userProfile?.email || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={userProfile?.phone || ''}
                    placeholder="Add phone number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Saved Addresses</h2>
              <p className="text-gray-600">No saved addresses yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}