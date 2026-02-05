import { supabaseClient } from '../client';
import type { Order, OrderItem } from '../types';
import { ecommerceTracking } from '@/lib/analytics';

export const orderService = {
  // Get all orders (admin) or user's orders
  async getAll(userId?: string) {
    let query = supabaseClient
      .from('orders').select('*').order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Order[];
  },

  // Get order by ID with items
  async getById(id: string) {
    const { data: order, error: orderError } = await supabaseClient
      .from('orders').select('*').eq('id', id)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabaseClient
      .from('order_items').select('*').eq('order_id', id);

    if (itemsError) throw itemsError;

    return { order: order as Order, items: items as OrderItem[] };
  },

  // Create order
  async create(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>, items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]) {
    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { data: createdItems, error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) throw itemsError;

    // Track purchase event
    ecommerceTracking.purchase({
      transactionId: order.id,
      value: order.total_amount,
      tax: 0,
      shipping: order.shipping_cost || 0,
      items: createdItems.map((item: any) => ({
        id: item.product_id,
        name: item.product_name || 'Product',
        price: item.price,
        quantity: item.quantity,
      })),
    });

    return { order: order as Order, items: createdItems as OrderItem[] };
  },

  // Update order status (admin only)
  async updateStatus(id: string, status: Order['status']) {
    const { data, error } = await supabaseClient
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  },

  // Get recent orders for dashboard
  async getRecent(limit: number = 10) {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Order[];
  },

  // Subscribe to real-time order updates
  subscribeToOrderUpdates(callback: (order: Order) => void, userId?: string) {
    const channel = supabaseClient
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: userId ? `user_id=eq.${userId}` : undefined,
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as Order);
          }
        }
      )
      .subscribe();

    return channel;
  },

  // Subscribe to specific order updates
  subscribeToOrder(orderId: string, callback: (order: Order) => void) {
    const channel = supabaseClient
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as Order);
          }
        }
      )
      .subscribe();

    return channel;
  },

  // Unsubscribe from real-time updates
  unsubscribe(channel: any) {
    if (channel) {
      supabaseClient.removeChannel(channel);
    }
  },
};