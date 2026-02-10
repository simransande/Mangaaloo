import { supabaseClient } from '../client';
import type { Product } from '../types';

export const productService = {
  // Get all products
  async getAll() {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Product[];
  },

  // Get trending products (limited)
  async getTrending(limit: number = 8) {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Product[];
  },

  // Get product by ID
  async getById(id: string) {
    const { data, error } = await supabaseClient.from('products').select('*').eq('id', id).single();

    if (error) throw error;
    return data as Product;
  },

  // Get products by category
  async getByCategory(categoryId: string) {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Product[];
  },

  // Create product (admin only)
  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseClient.from('products').insert(product).select().single();

    if (error) {
      console.error('Supabase create product error:', error);
      throw error;
    }
    return data as Product;
  },

  // Update product (admin only)
  async update(id: string, updates: Partial<Product>) {
    const { data, error } = await supabaseClient
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  // Delete product (admin only)
  async delete(id: string) {
    const { error } = await supabaseClient.from('products').delete().eq('id', id);

    if (error) throw error;
  },

  // Update stock
  async updateStock(id: string, quantity: number) {
    const stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' =
      quantity === 0 ? 'out-of-stock' : quantity < 10 ? 'low-stock' : 'in-stock';

    const { data, error } = await supabaseClient
      .from('products')
      .update({
        stock_quantity: quantity,
        stock_status: stockStatus,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  // Get product images
  async getImages(productId: string) {
    const { data, error } = await supabaseClient
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Add product images
  async addImages(productId: string, imageUrls: string[], imageAlt?: string) {
    const images = imageUrls.map((url, index) => ({
      product_id: productId,
      image_url: url,
      image_alt: imageAlt || 'Product image',
      display_order: index,
    }));

    const { data, error } = await supabaseClient.from('product_images').insert(images).select();

    if (error) throw error;
    return data;
  },

  // Delete product image
  async deleteImage(imageId: string) {
    const { error } = await supabaseClient.from('product_images').delete().eq('id', imageId);

    if (error) throw error;
  },
};
