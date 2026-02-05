import { supabaseClient } from '../client';
import type { Design } from '../types';

export const designService = {
  // Get all active designs
  async getActive() {
    const { data, error } = await supabaseClient
      .from('designs')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data as Design[];
  },

  // Get all designs (admin)
  async getAll() {
    const { data, error } = await supabaseClient
      .from('designs')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data as Design[];
  },

  // Create design (admin only)
  async create(design: Omit<Design, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseClient
      .from('designs')
      .insert(design)
      .select()
      .single();

    if (error) throw error;
    return data as Design;
  },

  // Update design (admin only)
  async update(id: string, updates: Partial<Design>) {
    const { data, error } = await supabaseClient
      .from('designs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Design;
  },

  // Delete design (admin only)
  async delete(id: string) {
    const { error } = await supabaseClient
      .from('designs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};