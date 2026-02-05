import { supabaseClient } from '../client';
import type { Product, Order } from '../types';

export const adminService = {
  // Get order analytics by date range
  async getOrderAnalytics(startDate?: string, endDate?: string) {
    let query = supabaseClient
      .from('orders')
      .select('id, created_at, final_amount, status, items_count')
      .order('created_at', { ascending: true });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data as Order[];
  },

  // Get daily order statistics
  async getDailyStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseClient
      .from('orders')
      .select('created_at, final_amount, status')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by day
    const dailyStats = new Map<string, { date: string; orders: number; revenue: number; cancelled: number }>();

    data.forEach((order: any) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      const existing = dailyStats.get(date) || { date, orders: 0, revenue: 0, cancelled: 0 };
      
      existing.orders += 1;
      existing.revenue += order.final_amount;
      if (order.status === 'cancelled') {
        existing.cancelled += 1;
      }
      
      dailyStats.set(date, existing);
    });

    return Array.from(dailyStats.values());
  },

  // Get monthly order statistics
  async getMonthlyStats(months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabaseClient
      .from('orders')
      .select('created_at, final_amount, status')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by month
    const monthlyStats = new Map<string, { month: string; orders: number; revenue: number; cancelled: number }>();

    data.forEach((order: any) => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyStats.get(monthKey) || { month: monthKey, orders: 0, revenue: 0, cancelled: 0 };
      
      existing.orders += 1;
      existing.revenue += order.final_amount;
      if (order.status === 'cancelled') {
        existing.cancelled += 1;
      }
      
      monthlyStats.set(monthKey, existing);
    });

    return Array.from(monthlyStats.values());
  },

  // Get order status breakdown
  async getOrderStatusBreakdown() {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('status');

    if (error) throw error;

    const statusCount = new Map<string, number>();
    data.forEach((order: any) => {
      statusCount.set(order.status, (statusCount.get(order.status) || 0) + 1);
    });

    return Array.from(statusCount.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  },

  // Get top selling products
  async getTopProducts(limit: number = 10) {
    const { data, error } = await supabaseClient
      .from('order_items')
      .select('product_id, product_name, quantity, price')
      .not('product_id', 'is', null);

    if (error) throw error;

    // Aggregate by product
    const productStats = new Map<string, { id: string; name: string; totalSold: number; revenue: number }>();

    data.forEach((item: any) => {
      const existing = productStats.get(item.product_id) || {
        id: item.product_id,
        name: item.product_name,
        totalSold: 0,
        revenue: 0,
      };
      
      existing.totalSold += item.quantity;
      existing.revenue += item.price * item.quantity;
      
      productStats.set(item.product_id, existing);
    });

    return Array.from(productStats.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  },

  // Get low stock products
  async getLowStockProducts(threshold: number = 10) {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .lte('stock_quantity', threshold)
      .order('stock_quantity', { ascending: true });

    if (error) throw error;
    return data as Product[];
  },

  // Get revenue by category
  async getRevenueByCategory() {
    const { data: orderItems, error } = await supabaseClient
      .from('order_items')
      .select('product_id, price, quantity, products(category_id, categories(name))');

    if (error) throw error;

    const categoryRevenue = new Map<string, { category: string; revenue: number }>();

    orderItems.forEach((item: any) => {
      const categoryName = item.products?.categories?.name || 'Uncategorized';
      const existing = categoryRevenue.get(categoryName) || { category: categoryName, revenue: 0 };
      existing.revenue += item.price * item.quantity;
      categoryRevenue.set(categoryName, existing);
    });

    return Array.from(categoryRevenue.values());
  },

  // Get all customers with aggregated data
  async getCustomers(searchQuery?: string) {
    let query = supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
    }

    const { data: customers, error } = await query;
    if (error) throw error;

    // Get all orders
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('user_id, final_amount, created_at, status');

    if (ordersError) throw ordersError;

    // Aggregate customer data
    const customerData = customers.map((customer: any) => {
      const customerOrders = orders.filter((order: any) => order.user_id === customer.id);
      const totalSpent = customerOrders.reduce((sum: number, order: any) => sum + order.final_amount, 0);
      const orderCount = customerOrders.length;
      const lastOrderDate = customerOrders.length > 0 
        ? new Date(Math.max(...customerOrders.map((o: any) => new Date(o.created_at).getTime())))
        : null;

      return {
        ...customer,
        totalSpent,
        orderCount,
        lastOrderDate,
      };
    });

    return customerData;
  },

  // Get customer by ID with order history
  async getCustomerById(customerId: string) {
    const { data: customer, error } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) throw error;

    // Get customer orders
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    const totalSpent = orders.reduce((sum: number, order: any) => sum + order.final_amount, 0);

    return {
      customer,
      orders,
      totalSpent,
      orderCount: orders.length,
    };
  },

  // Update customer notes
  async updateCustomerNotes(customerId: string, notes: string) {
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .update({ customer_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};