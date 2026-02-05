import { supabaseClient } from '../client';
import type { CartItem } from '../types';

export const cartService = {
  // Get user's cart items
  async getCartItems(userId: string) {
    const { data, error } = await supabaseClient
      .from('cart_items').select(`id,product_id,quantity,color,size,created_at,updated_at,products:product_id (id,name,price,discounted_price,image_url,image_alt,stock_quantity,stock_status)`).eq('user_id', userId);

    if (error) throw error;

    // Transform data to match CartItem interface
    return data.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      name: item.products.name,
      price: item.products.price,
      discountedPrice: item.products.discounted_price,
      quantity: item.quantity,
      image: item.products.image_url,
      imageAlt: item.products.image_alt,
      color: item.color,
      size: item.size,
      stock: item.products.stock_quantity,
    }));
  },

  // Add item to cart
  async addItem(userId: string, productId: string, quantity: number, color?: string, size?: string) {
    const { data, error } = await supabaseClient
      .from('cart_items')
      .upsert({
        user_id: userId,
        product_id: productId,
        quantity,
        color,
        size,
      }, {
        onConflict: 'user_id,product_id,color,size',
      })
      .select()
      .single();

    if (error) throw error;
    return data as CartItem;
  },

  // Update cart item quantity
  async updateQuantity(id: string, quantity: number) {
    const { data, error } = await supabaseClient
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CartItem;
  },

  // Remove item from cart
  async removeItem(id: string) {
    const { error } = await supabaseClient
      .from('cart_items').delete().eq('id', id);

    if (error) throw error;
  },

  // Clear user's cart
  async clearCart(userId: string) {
    const { error } = await supabaseClient
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },
};