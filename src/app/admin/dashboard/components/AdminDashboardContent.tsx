'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { authService } from '@/lib/supabase/services/auth';
import { orderService } from '@/lib/supabase/services/orders';
import { productService } from '@/lib/supabase/services/products';
import { reviewService } from '@/lib/supabase/services/reviews';
import { adminService } from '@/lib/supabase/services/admin';
import { customerService, type Customer } from '@/lib/supabase/services/customers';
import { supabaseClient } from '@/lib/supabase/client';
import type { Order, Product } from '@/lib/supabase/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useToast } from '@/lib/contexts/ToastContext';

interface AnalyticsData {
  dailyStats: Array<{ date: string; orders: number; revenue: number; cancelled: number }>;
  monthlyStats: Array<{ month: string; orders: number; revenue: number; cancelled: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  topProducts: Array<{ id: string; name: string; totalSold: number; revenue: number }>;
  lowStockProducts: Product[];
}

export default function AdminDashboardContent() {
  const PRODUCT_IMAGE_BUCKET = 'products';
  const router = useRouter();
  const { showToast } = useToast();
  const [userEmail, setUserEmail] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [moderatingReviewId, setModeratingReviewId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'daily' | 'monthly' | 'yearly'>(
    'daily'
  );
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productToDeleteConfirm, setProductToDeleteConfirm] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        setLoading(true);

        // Get current user with proper error handling
        let user = null;
        try {
          user = await authService.getCurrentUser();
        } catch (authError) {
          console.error('Auth error:', authError);
          router.push('/admin/login');
          return;
        }

        if (!user) {
          router.push('/admin/login');
          return;
        }

        // Check if user is admin
        let isAdmin = false;
        try {
          isAdmin = await authService.isAdmin(user.id);
        } catch (adminCheckError) {
          console.error('Admin check error:', adminCheckError);
          router.push('/admin/login');
          return;
        }

        if (!isAdmin) {
          router.push('/admin/login');
          return;
        }

        const profile = await authService.getUserProfile(user.id);
        setUserEmail(profile.email);

        // Fetch orders
        const orders = await orderService.getAll();
        setRecentOrders(orders.slice(0, 4));
        setAllOrders(orders);

        // Fetch products
        const allProducts = await productService.getAll();
        setProducts(allProducts);

        // Fetch reviews for moderation
        const allReviews = await reviewService.getAllForModeration();
        setReviews(allReviews);

        // Get pending reviews count
        const pendingCount = await reviewService.getPendingCount();
        setPendingReviewsCount(pendingCount);

        // Fetch customers
        const allCustomers = await customerService.getAll();
        setCustomers(allCustomers);
        console.info('Loaded customers:', allCustomers.length);

        // Fetch analytics data
        const [dailyStats, monthlyStats, statusBreakdown, topProducts, lowStockProducts] =
          await Promise.all([
            adminService.getDailyStats(30),
            adminService.getMonthlyStats(12),
            adminService.getOrderStatusBreakdown(),
            adminService.getTopProducts(10),
            adminService.getLowStockProducts(10),
          ]);

        setAnalyticsData({
          dailyStats,
          monthlyStats,
          statusBreakdown,
          topProducts,
          lowStockProducts,
        });

        // Calculate stats
        const totalRevenue = orders.reduce((sum, order) => sum + order.final_amount, 0);
        setStats({
          totalRevenue,
          totalOrders: orders.length,
          totalProducts: allProducts.length,
          totalCustomers: new Set(orders.map((o) => o.user_id).filter(Boolean)).size,
        });

        // Subscribe to real-time order updates
        const channel = orderService.subscribeToOrderUpdates((updatedOrder) => {
          setRecentOrders((prevOrders) => {
            const orderIndex = prevOrders.findIndex((o) => o.id === updatedOrder.id);
            if (orderIndex !== -1) {
              const newOrders = [...prevOrders];
              newOrders[orderIndex] = updatedOrder;
              return newOrders;
            } else {
              return [updatedOrder, ...prevOrders].slice(0, 4);
            }
          });

          setAllOrders((prevOrders) => {
            const orderIndex = prevOrders.findIndex((o) => o.id === updatedOrder.id);
            if (orderIndex !== -1) {
              const newOrders = [...prevOrders];
              newOrders[orderIndex] = updatedOrder;
              return newOrders;
            } else {
              return [updatedOrder, ...prevOrders];
            }
          });

          // Update stats
          setStats((prevStats) => {
            const allOrdersWithUpdate = allOrders.map((o) =>
              o.id === updatedOrder.id ? updatedOrder : o
            );
            const totalRevenue = allOrdersWithUpdate.reduce(
              (sum, order) => sum + order.final_amount,
              0
            );
            return {
              ...prevStats,
              totalRevenue,
            };
          });
        });

        // Cleanup subscription on unmount
        return () => {
          orderService.unsubscribe(channel);
        };
      } catch (err: any) {
        console.error('Error fetching admin data:', err);
        setError(err.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [router]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingOrderId(orderId);
      await orderService.updateStatus(orderId, newStatus);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      showToast(`Failed to update order status: ${err.message}`, 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleModerateReview = async (
    reviewId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) => {
    try {
      setModeratingReviewId(reviewId);
      const user = await authService.getCurrentUser();
      if (!user) return;

      await reviewService.moderate(reviewId, status, user.id, reason);

      // Refresh reviews
      const allReviews = await reviewService.getAllForModeration();
      setReviews(allReviews);

      // Update pending count
      const pendingCount = await reviewService.getPendingCount();
      setPendingReviewsCount(pendingCount);

      showToast(`Review ${status} successfully!`, 'success');
    } catch (err: any) {
      console.error('Error moderating review:', err);
      showToast(`Failed to moderate review: ${err.message}`, 'error');
    } finally {
      setModeratingReviewId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setProductToDelete(productId);
      await productService.delete(productId);
      setProducts(products.filter((p) => p.id !== productId));
      showToast('Product deleted successfully!', 'success');
      setProductToDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      showToast(`Failed to delete product: ${err.message}`, 'error');
    } finally {
      setProductToDelete(null);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const colorsInput = formData.get('colors') as string;
    const colors = colorsInput
      ? colorsInput
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : [];

    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      discounted_price: formData.get('discounted_price')
        ? parseFloat(formData.get('discounted_price') as string)
        : null,
      image_url: productImages[0] || formImageUrl || (formData.get('image_url') as string),
      image_alt: formData.get('image_alt') as string,
      colors: colors.length > 0 ? colors : [],
      sizes: (formData.get('sizes') as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      stock_quantity: parseInt(formData.get('stock_quantity') as string),
      stock_status: formData.get('stock_status') as Product['stock_status'],
      badge: (formData.get('badge') as string) || null,
    };

    // Validation
    if (!productData.name || productData.name.trim() === '') {
      showToast('Product name is required', 'error');
      return;
    }
    if (!productData.price || isNaN(productData.price) || productData.price <= 0) {
      showToast('Valid price is required', 'error');
      return;
    }
    if (!productData.image_url || productData.image_url.trim() === '') {
      showToast('Product image is required', 'error');
      return;
    }
    if (
      !productData.stock_quantity ||
      isNaN(productData.stock_quantity) ||
      productData.stock_quantity < 0
    ) {
      showToast('Valid stock quantity is required', 'error');
      return;
    }

    console.info('Saving product with data:', productData);

    try {
      let savedProduct: Product;
      if (productToEdit) {
        savedProduct = await productService.update(productToEdit.id, productData as any);
        setProducts(products.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
        showToast('Product updated successfully!', 'success');
      } else {
        savedProduct = await productService.create(productData as any);
        setProducts([savedProduct, ...products]);
        showToast('Product created successfully!', 'success');
      }

      // Save additional images
      if (productImages.length > 1) {
        await productService.addImages(
          savedProduct.id,
          productImages.slice(1),
          productData.image_alt
        );
        showToast(`${productImages.length - 1} additional image(s) saved`, 'success');
      }

      setShowProductForm(false);
      setProductToEdit(null);
      setImagePreview('');
      setFormImageUrl('');
      setProductImages([]);
      setExistingImages([]);
    } catch (err: any) {
      console.error('Error saving product:', err);
      const errorMessage =
        err?.message || err?.error?.message || JSON.stringify(err) || 'Unknown error occurred';
      showToast(`Failed to save product: ${errorMessage}`, 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const newImages: string[] = [];
    const hadExistingImages = productImages.length > 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        showToast(`${file.name} is not an image`, 'warning');
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        showToast(`${file.name} is too large (max 10MB)`, 'error');
        continue;
      }

      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const filePath = `products/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabaseClient.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(filePath);

        if (!data?.publicUrl) {
          throw new Error('Failed to get public URL');
        }

        newImages.push(data.publicUrl);
      } catch (uploadError: any) {
        console.error('Image upload failed:', uploadError);
        showToast(`Failed to upload ${file.name}`, 'error');
      }
    }

    if (newImages.length > 0) {
      setProductImages((prev) => [...prev, ...newImages]);
      if (!hadExistingImages && !formImageUrl) {
        setFormImageUrl(newImages[0]);
      }
      showToast(`${newImages.length} image(s) added`, 'success');
    }

    setUploadingImage(false);
    e.target.value = '';
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.push('/homepage');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'HomeIcon' },
    { id: 'products', label: 'Products', icon: 'ShoppingBagIcon' },
    { id: 'orders', label: 'Orders', icon: 'ClipboardDocumentListIcon' },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: 'StarIcon',
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
    },
    { id: 'returns', label: 'Returns', icon: 'ArrowUturnLeftIcon' },
    { id: 'customers', label: 'Customers', icon: 'UsersIcon' },
    { id: 'inventory', label: 'Inventory', icon: 'CubeIcon' },
    { id: 'discounts', label: 'Discounts', icon: 'TicketIcon' },
    { id: 'offers', label: 'Homepage Offers', icon: 'SparklesIcon' },
    { id: 'analytics', label: 'Analytics', icon: 'ChartBarIcon' },
  ];

  const statsDisplay = [
    {
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: 'CurrencyDollarIcon',
      color: 'green',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: 'ShoppingBagIcon',
      color: 'blue',
    },
    {
      label: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: 'CubeIcon',
      color: 'purple',
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: 'UsersIcon',
      color: 'orange',
    },
  ];

  const CHART_COLORS = ['#4A9B8E', '#004E89', '#B8D4E3', '#10B981', '#8B5CF6'];

  const filteredOrders =
    orderStatusFilter === 'all'
      ? allOrders
      : allOrders.filter((order) => order.status === orderStatusFilter);

  const handleSearchCustomers = () => {
    // This can be used for manual search if needed
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = (customerSearchQuery || '').toLowerCase();
    return (
      (customer.full_name || '').toLowerCase().includes(query) ||
      (customer.email || '').toLowerCase().includes(query) ||
      (customer.phone || '').toLowerCase().includes(query)
    );
  });

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-lg transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/homepage" className="flex items-center gap-3">
            <AppImage
              src="/assets/images/Screenshot_2026-02-02_at_10.48.11_AM-1770016852639.png"
              alt="Mangaaloo admin logo"
              width={isSidebarOpen ? 120 : 40}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) =>
            item.id === 'returns' ? (
              <Link
                key={item.id}
                href="/admin/returns"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                title={!isSidebarOpen ? item.label : ''}
              >
                <Icon name={item.icon as any} size={20} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                  activeSection === item.id
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={!isSidebarOpen ? item.label : ''}
              >
                <Icon name={item.icon as any} size={20} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                {item.badge && isSidebarOpen && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Icon name="ArrowRightOnRectangleIcon" size={20} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icon name="Bars3Icon" size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">{userEmail}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsDisplay.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 rounded-lg ${
                          stat.color === 'green'
                            ? 'bg-green-100'
                            : stat.color === 'blue'
                              ? 'bg-blue-100'
                              : stat.color === 'purple'
                                ? 'bg-purple-100'
                                : 'bg-orange-100'
                        }`}
                      >
                        <Icon
                          name={stat.icon as any}
                          size={24}
                          className={`${
                            stat.color === 'green'
                              ? 'text-green-600'
                              : stat.color === 'blue'
                                ? 'text-blue-600'
                                : stat.color === 'purple'
                                  ? 'text-purple-600'
                                  : 'text-orange-600'
                          }`}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              {analyticsData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Trend Chart */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Revenue Trend (Last 30 Days)
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke={CHART_COLORS[0]}
                          strokeWidth={2}
                          name="Revenue (₹)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Order Status Breakdown */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Order Status Distribution
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.statusBreakdown}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => `${entry.status}: ${entry.count}`}
                        >
                          {analyticsData.statusBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Daily Orders Chart */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Daily Orders (Last 30 Days)
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="orders" fill={CHART_COLORS[1]} name="Total Orders" />
                        <Bar dataKey="cancelled" fill={CHART_COLORS[4]} name="Cancelled" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top Products */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Top Selling Products</h2>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {analyticsData.topProducts.map((product, index) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-400 text-lg">#{index + 1}</span>
                            <div>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-600">
                                Sold: {product.totalSold} units
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-green-600">₹{product.revenue.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Order ID
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {order.order_number}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">{order.customer_name}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                            ₹{order.final_amount}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'shipped'
                                    ? 'bg-blue-100 text-blue-700'
                                    : order.status === 'processing'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : order.status === 'cancelled'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(order.id, e.target.value as Order['status'])
                              }
                              disabled={updatingOrderId === order.id}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary disabled:opacity-50"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Alert */}
              {analyticsData && analyticsData.lowStockProducts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon name="ExclamationTriangleIcon" size={24} className="text-red-600" />
                    <h2 className="text-xl font-bold text-red-900">Low Stock Alert</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyticsData.lowStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white p-4 rounded-lg border border-red-200"
                      >
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-red-600 font-bold">
                          Only {product.stock_quantity} left
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products Section */}
          {activeSection === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
                <button
                  onClick={() => {
                    setProductToEdit(null);
                    setShowProductForm(true);
                    setImagePreview('');
                    setFormImageUrl('');
                  }}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold flex items-center gap-2"
                >
                  <Icon name="PlusIcon" size={20} />
                  Add New Product
                </button>
              </div>

              {/* Product Form Modal */}
              {showProductForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">
                        {productToEdit ? 'Edit Product' : 'Add New Product'}
                      </h3>
                      <button
                        onClick={() => {
                          setShowProductForm(false);
                          setProductToEdit(null);
                          setImagePreview('');
                          setFormImageUrl('');
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Icon name="XMarkIcon" size={24} />
                      </button>
                    </div>
                    <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          defaultValue={productToEdit?.name}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          defaultValue={productToEdit?.description}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Price (₹) *
                          </label>
                          <input
                            type="number"
                            name="price"
                            step="0.01"
                            defaultValue={productToEdit?.price}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Discounted Price (₹)
                          </label>
                          <input
                            type="number"
                            name="discounted_price"
                            step="0.01"
                            defaultValue={productToEdit?.discounted_price}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {/* Image Upload Section */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">
                          Product Images *
                        </label>

                        {/* File Upload Button */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Icon name="PhotoIcon" size={20} />
                            {uploadingImage ? 'Uploading...' : 'Upload Multiple Images'}
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            Select multiple images (max 10MB each)
                          </p>
                        </div>

                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Existing Images:
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {existingImages.map((img) => (
                                <div key={img.id} className="relative group">
                                  <AppImage
                                    src={img.image_url}
                                    alt="Product"
                                    className="w-full h-24 object-cover rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await productService.deleteImage(img.id);
                                      setExistingImages(
                                        existingImages.filter((i) => i.id !== img.id)
                                      );
                                      showToast('Image deleted', 'success');
                                    }}
                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100"
                                  >
                                    <Icon name="XMarkIcon" size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* New Images Preview */}
                        {productImages.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              New Images ({productImages.length}):
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {productImages.map((img, idx) => (
                                <div key={idx} className="relative group">
                                  <AppImage
                                    src={img}
                                    alt={`Preview ${idx + 1}`}
                                    className="w-full h-24 object-cover rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProductImages((prev) => {
                                        const nextImages = prev.filter((_, i) => i !== idx);
                                        if (idx === 0) {
                                          setFormImageUrl(nextImages[0] || '');
                                        }
                                        return nextImages;
                                      });
                                    }}
                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100"
                                  >
                                    <Icon name="XMarkIcon" size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Image URL Input (fallback) */}
                        <input
                          type="text"
                          name="image_url"
                          value={formImageUrl}
                          onChange={(e) => {
                            setFormImageUrl(e.target.value);
                            if (e.target.value && !productImages.includes(e.target.value)) {
                              setProductImages([e.target.value]);
                            }
                          }}
                          autoComplete="off"
                          placeholder="Or paste image URL"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Image Alt Text *
                        </label>
                        <input
                          type="text"
                          name="image_alt"
                          defaultValue={productToEdit?.image_alt}
                          required
                          placeholder="Describe the product image"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Colors (optional)
                            <span className="text-xs text-gray-500 block mt-1">
                              Leave empty if no colors
                            </span>
                          </label>
                          <input
                            type="text"
                            name="colors"
                            defaultValue={productToEdit?.colors?.join(', ')}
                            placeholder="Red, Blue, Green (or leave empty)"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Sizes (comma-separated)
                          </label>
                          <input
                            type="text"
                            name="sizes"
                            defaultValue={productToEdit?.sizes?.join(', ')}
                            placeholder="S, M, L, XL"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Stock Quantity *
                          </label>
                          <input
                            type="number"
                            name="stock_quantity"
                            defaultValue={productToEdit?.stock_quantity}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Stock Status *
                          </label>
                          <select
                            name="stock_status"
                            defaultValue={productToEdit?.stock_status}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          >
                            <option value="in-stock">In Stock</option>
                            <option value="low-stock">Low Stock</option>
                            <option value="out-of-stock">Out of Stock</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Badge (optional)
                        </label>
                        <input
                          type="text"
                          name="badge"
                          defaultValue={productToEdit?.badge}
                          placeholder="New, Sale, Trending"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={uploadingImage}
                          className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold disabled:opacity-50"
                        >
                          {productToEdit ? 'Update Product' : 'Create Product'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProductForm(false);
                            setProductToEdit(null);
                            setImagePreview('');
                            setFormImageUrl('');
                          }}
                          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative">
                      <AppImage
                        src={product.image_url}
                        alt={product.image_alt}
                        width={400}
                        height={300}
                        className="w-full h-48 object-cover"
                      />
                      {product.badge && (
                        <span className="absolute top-3 left-3 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                          {product.badge}
                        </span>
                      )}
                      <span
                        className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full ${
                          product.stock_status === 'in-stock'
                            ? 'bg-green-100 text-green-700'
                            : product.stock_status === 'low-stock'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.stock_status}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-lg font-bold text-gray-900">₹{product.price}</p>
                          {product.discounted_price && (
                            <p className="text-sm text-gray-500 line-through">
                              ₹{product.discounted_price}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Stock: {product.stock_quantity}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            setProductToEdit(product);
                            setShowProductForm(true);
                            const imageUrl = product.image_url.includes('drive.google.com')
                              ? ''
                              : product.image_url;
                            setImagePreview(imageUrl);
                            setFormImageUrl(imageUrl);
                            setProductImages(imageUrl ? [imageUrl] : []);

                            // Load existing images
                            try {
                              const images = await productService.getImages(product.id);
                              setExistingImages(images);
                            } catch (err) {
                              console.error('Failed to load images:', err);
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setProductToDeleteConfirm(product.id)}
                          disabled={productToDelete === product.id}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm disabled:opacity-50"
                        >
                          {productToDelete === product.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delete Confirmation Modal */}
              {productToDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Product?</h3>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete this product? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDeleteProduct(productToDeleteConfirm)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setProductToDeleteConfirm(null)}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Orders Section */}
          {activeSection === 'orders' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">All Orders</h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Filter by Status:</label>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Order ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Shipping Address
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Payment
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {order.order_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{order.customer_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{order.customer_email}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                          <div className="truncate" title={order.shipping_address}>
                            {order.shipping_address || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                          ₹{order.final_amount}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {order.payment_method.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'shipped'
                                  ? 'bg-blue-100 text-blue-700'
                                  : order.status === 'processing'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : order.status === 'cancelled'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order.id, e.target.value as Order['status'])
                            }
                            disabled={updatingOrderId === order.id}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary disabled:opacity-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <Icon name="ShoppingBagIcon" size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No orders found with the selected filter</p>
                </div>
              )}
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && analyticsData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAnalyticsTimeRange('daily')}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      analyticsTimeRange === 'daily'
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setAnalyticsTimeRange('monthly')}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      analyticsTimeRange === 'monthly'
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue & Orders Trend */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {analyticsTimeRange === 'daily' ? 'Daily' : 'Monthly'} Revenue & Orders
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart
                      data={
                        analyticsTimeRange === 'daily'
                          ? analyticsData.dailyStats
                          : analyticsData.monthlyStats
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey={analyticsTimeRange === 'daily' ? 'date' : 'month'}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke={CHART_COLORS[0]}
                        strokeWidth={2}
                        name="Revenue (₹)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        stroke={CHART_COLORS[1]}
                        strokeWidth={2}
                        name="Orders"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Cancelled Orders Trend */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {analyticsTimeRange === 'daily' ? 'Daily' : 'Monthly'} Cancellations
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={
                        analyticsTimeRange === 'daily'
                          ? analyticsData.dailyStats
                          : analyticsData.monthlyStats
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey={analyticsTimeRange === 'daily' ? 'date' : 'month'}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cancelled" fill={CHART_COLORS[4]} name="Cancelled Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Order Status Distribution */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Order Status Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={analyticsData.statusBreakdown}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={(entry) => `${entry.status}: ${entry.count}`}
                      >
                        {analyticsData.statusBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Products Table */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Top Selling Products</h3>
                  <div className="overflow-y-auto max-h-[350px]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">
                            Rank
                          </th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">
                            Product
                          </th>
                          <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">
                            Sold
                          </th>
                          <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">
                            Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.topProducts.map((product, index) => (
                          <tr key={product.id} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-sm font-bold text-gray-400">
                              #{index + 1}
                            </td>
                            <td className="py-2 px-2 text-sm text-gray-900">{product.name}</td>
                            <td className="py-2 px-2 text-sm text-right text-gray-700">
                              {product.totalSold}
                            </td>
                            <td className="py-2 px-2 text-sm text-right font-semibold text-green-600">
                              ₹{product.revenue.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Google Analytics Insights */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Icon name="ChartBarIcon" size={28} className="text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Google Analytics Insights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Total Page Views</p>
                    <p className="text-2xl font-bold text-gray-900">Tracking Active</p>
                    <p className="text-xs text-gray-500 mt-1">Real-time analytics enabled</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">E-commerce Events</p>
                    <p className="text-2xl font-bold text-green-600">Configured</p>
                    <p className="text-xs text-gray-500 mt-1">Purchase, cart, view tracking</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Conversion Funnels</p>
                    <p className="text-2xl font-bold text-purple-600">Active</p>
                    <p className="text-xs text-gray-500 mt-1">Registration, login, checkout</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Google Analytics 4 is integrated and tracking all user
                    interactions. Visit your{' '}
                    <a
                      href="https://analytics.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Google Analytics Dashboard
                    </a>{' '}
                    to view detailed reports, user behavior, conversion rates, and real-time data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {activeSection === 'reviews' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Review Moderation</h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Pending:{' '}
                    <span className="font-bold text-orange-600">{pendingReviewsCount}</span>
                  </span>
                  <span className="text-sm text-gray-600">
                    Total: <span className="font-bold">{reviews.length}</span>
                  </span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Icon
                    name="ChatBubbleLeftRightIcon"
                    size={48}
                    className="text-gray-400 mx-auto mb-4"
                  />
                  <p className="text-gray-600">No reviews to moderate</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div
                      key={review.id}
                      className="border border-gray-200 rounded-lg p-6 hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                  key={star}
                                  name="StarIcon"
                                  size={16}
                                  variant={star <= review.rating ? 'solid' : 'outline'}
                                  className={
                                    star <= review.rating ? 'text-accent' : 'text-gray-300'
                                  }
                                />
                              ))}
                            </div>
                            <span className="font-semibold text-gray-900">{review.title}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            By:{' '}
                            <span className="font-medium">{review.user_profiles?.full_name}</span> (
                            {review.user_profiles?.email})
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            Product: <span className="font-medium">{review.products?.name}</span>
                          </p>
                          {review.is_verified_purchase && (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded mb-2">
                              <Icon name="CheckBadgeIcon" size={14} />
                              <span>Verified Purchase</span>
                            </span>
                          )}
                          <p className="text-gray-700 mt-3">{review.content}</p>
                        </div>
                        <div className="ml-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              review.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : review.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleString()}
                        </span>

                        {review.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleModerateReview(review.id, 'approved')}
                              disabled={moderatingReviewId === review.id}
                              className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {moderatingReviewId === review.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleModerateReview(review.id, 'rejected')}
                              disabled={moderatingReviewId === review.id}
                              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other Sections */}
          {activeSection !== 'overview' &&
            activeSection !== 'orders' &&
            activeSection !== 'reviews' &&
            activeSection !== 'products' &&
            activeSection !== 'analytics' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {menuItems.find((item) => item.id === activeSection)?.label}
                </h2>
                <p className="text-gray-600">
                  This section is under development. Data will be displayed here.
                </p>
              </div>
            )}

          {/* Customers Section */}
          {activeSection === 'customers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchCustomers()}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary w-80"
                  />
                  <button
                    onClick={handleSearchCustomers}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold flex items-center gap-2"
                  >
                    <Icon name="MagnifyingGlassIcon" size={20} />
                    Search
                  </button>
                </div>
              </div>

              {/* Customer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                      <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Icon name="UsersIcon" size={24} className="text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {customers.reduce((sum, c) => sum + c.total_orders, 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Icon name="ShoppingBagIcon" size={24} className="text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{customers.reduce((sum, c) => sum + Number(c.total_spent), 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Icon name="CurrencyDollarIcon" size={24} className="text-purple-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹
                        {customers.length > 0
                          ? (
                              customers.reduce((sum, c) => sum + Number(c.total_spent), 0) /
                                customers.reduce((sum, c) => sum + c.total_orders, 0) || 1
                            ).toFixed(2)
                          : '0.00'}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Icon name="ChartBarIcon" size={24} className="text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Table */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Phone
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Total Orders
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Total Spent
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            {customerSearchQuery
                              ? 'No customers found matching your search.'
                              : 'No customers yet.'}
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <tr
                            key={customer.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">
                              {customer.full_name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">{customer.email}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">
                              {customer.phone || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {customer.total_orders}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                              ₹{Number(customer.total_spent).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {new Date(customer.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
