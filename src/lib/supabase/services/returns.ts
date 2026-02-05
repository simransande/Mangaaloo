import { supabaseClient } from '../client';
import type { Return, ReturnItem } from '../types';

export const returnService = {
  // Get all returns (admin) or user's returns
  async getAll(userId?: string) {
    let query = supabaseClient
      .from('returns').select('*').order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Return[];
  },

  // Get return by ID with items
  async getById(id: string) {
    const { data: returnData, error: returnError } = await supabaseClient
      .from('returns').select('*').eq('id', id)
      .single();

    if (returnError) throw returnError;

    const { data: items, error: itemsError } = await supabaseClient
      .from('return_items').select('*').eq('return_id', id);

    if (itemsError) throw itemsError;

    return { return: returnData as Return, items: items as ReturnItem[] };
  },

  // Create return request
  async create(
    returnData: Omit<Return, 'id' | 'created_at' | 'updated_at' | 'return_number'>,
    items: Omit<ReturnItem, 'id' | 'return_id' | 'created_at'>[]
  ) {
    // Create return
    const { data: returnRecord, error: returnError } = await supabaseClient
      .from('returns')
      .insert(returnData)
      .select()
      .single();

    if (returnError) throw returnError;

    // Create return items
    const returnItems = items.map((item) => ({
      ...item,
      return_id: returnRecord.id,
    }));

    const { data: createdItems, error: itemsError } = await supabaseClient
      .from('return_items')
      .insert(returnItems)
      .select();

    if (itemsError) throw itemsError;

    return { return: returnRecord as Return, items: createdItems as ReturnItem[] };
  },

  // Update return status (admin only)
  async updateStatus(
    id: string,
    status: Return['status'],
    adminId: string,
    adminNotes?: string
  ) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      processed_by: adminId,
    };

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    // If status is refunded, set refund_processed_at
    if (status === 'refunded') {
      updateData.refund_processed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseClient
      .from('returns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Return;
  },

  // Process refund (admin only)
  async processRefund(id: string, adminId: string, adminNotes?: string) {
    return this.updateStatus(id, 'refunded', adminId, adminNotes);
  },

  // Get pending returns count
  async getPendingCount() {
    const { count, error } = await supabaseClient
      .from('returns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  },

  // Get returns statistics
  async getStats() {
    const { data, error } = await supabaseClient.from('returns').select('*');

    if (error) throw error;

    const returns = data as Return[];
    const totalRefundAmount = returns
      .filter((r) => r.status === 'refunded')
      .reduce((sum, r) => sum + r.refund_amount, 0);

    return {
      total: returns.length,
      pending: returns.filter((r) => r.status === 'pending').length,
      approved: returns.filter((r) => r.status === 'approved').length,
      refunded: returns.filter((r) => r.status === 'refunded').length,
      rejected: returns.filter((r) => r.status === 'rejected').length,
      totalRefundAmount,
    };
  },

  // Subscribe to real-time return updates
  subscribeToReturnUpdates(callback: (returnData: Return) => void, userId?: string) {
    const channel = supabaseClient
      .channel('returns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
          filter: userId ? `user_id=eq.${userId}` : undefined,
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as Return);
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