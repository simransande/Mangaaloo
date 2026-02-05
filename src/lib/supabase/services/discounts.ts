import { supabaseClient } from '../client';
import type { Discount } from '../types';

export const discountService = {
  // Get active discounts
  async getActive() {
    const { data, error } = await supabaseClient
      .from('discounts')
      .select('*')
      .eq('is_active', true)
      .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`);

    if (error) throw error;
    return data as Discount[];
  },

  // Validate discount code
  async validateCode(code: string) {
    const { data, error } = await supabaseClient
      .from('discounts')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Invalid discount code');
      }
      throw error;
    }

    // Check if expired
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      throw new Error('Discount code has expired');
    }

    // Check usage limit
    if (data.usage_limit && data.usage_count >= data.usage_limit) {
      throw new Error('Discount code usage limit reached');
    }

    return data as Discount;
  },

  // Apply discount
  async applyDiscount(code: string, orderAmount: number) {
    const discount = await this.validateCode(code);

    // Check minimum purchase amount
    if (discount.min_purchase_amount && orderAmount < discount.min_purchase_amount) {
      throw new Error(`Minimum purchase amount of ₹${discount.min_purchase_amount} required`);
    }

    let discountAmount = 0;
    if (discount.discount_type === 'percentage') {
      discountAmount = (orderAmount * discount.discount_value) / 100;
      if (discount.max_discount_amount) {
        discountAmount = Math.min(discountAmount, discount.max_discount_amount);
      }
    } else {
      discountAmount = discount.discount_value;
    }

    return {
      discount,
      discountAmount,
      finalAmount: orderAmount - discountAmount,
    };
  },

  // Increment usage count
  async incrementUsage(id: string) {
    const { data, error } = await supabaseClient
      .from('discounts')
      .update({ usage_count: supabaseClient.rpc('increment', { row_id: id }) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Discount;
  },

  // Get all discounts (admin)
  async getAll() {
    const { data, error } = await supabaseClient
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Discount[];
  },

  // Create discount (admin only)
  async create(discount: Omit<Discount, 'id' | 'usage_count' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseClient
      .from('discounts')
      .insert(discount)
      .select()
      .single();

    if (error) throw error;
    return data as Discount;
  },

  // Update discount (admin only)
  async update(id: string, updates: Partial<Discount>) {
    const { data, error } = await supabaseClient
      .from('discounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Discount;
  },

  // Delete discount (admin only)
  async delete(id: string) {
    const { error } = await supabaseClient
      .from('discounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};