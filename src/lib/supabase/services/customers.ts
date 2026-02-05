import { supabaseClient } from '../client';

export interface Customer {
  id: string;
  user_id?: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export const customerService = {
  // Get all customers (admin only)
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabaseClient
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get customer by ID
  async getById(id: string): Promise<Customer> {
    const { data, error } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get customer by email
  async getByEmail(email: string): Promise<Customer | null> {
    const { data, error } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  // Get customer by user ID
  async getByUserId(userId: string): Promise<Customer | null> {
    const { data, error } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  // Create or update customer
  async upsert(customerData: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabaseClient
      .from('customers')
      .upsert(customerData, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update customer
  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabaseClient
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get customer orders
  async getOrders(customerId: string) {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get customer stats
  async getStats() {
    const { data, error } = await supabaseClient
      .from('customers')
      .select('total_orders, total_spent');

    if (error) throw error;

    const stats = {
      totalCustomers: data?.length || 0,
      totalRevenue: data?.reduce((sum, c) => sum + Number(c.total_spent), 0) || 0,
      totalOrders: data?.reduce((sum, c) => sum + c.total_orders, 0) || 0,
      averageOrderValue: 0,
    };

    stats.averageOrderValue = stats.totalOrders > 0 
      ? stats.totalRevenue / stats.totalOrders 
      : 0;

    return stats;
  },
};