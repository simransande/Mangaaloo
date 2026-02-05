import { supabaseClient } from './supabase/client';
import { authService } from './supabase/services/auth';

export const wishlistService = {
  // Add to wishlist (database for logged users, localStorage for guests)
  async addToWishlist(product: any) {
    try {
      const user = await authService.getCurrentUser();
      
      if (user) {
        // Logged in user - save to database
        const { error } = await supabaseClient
          .from('wishlists')
          .insert({
            user_id: user.id,
            product_id: product.id,
            product_data: product
          });
        
        if (error && error.code !== '23505') throw error; // Ignore duplicate key error
      } else {
        // Guest user - save to localStorage
        const wishlist = JSON.parse(localStorage.getItem('wishlist_guest') || '[]');
        const exists = wishlist.find((item: any) => item.id === product.id);
        
        if (!exists) {
          wishlist.push(product);
          localStorage.setItem('wishlist_guest', JSON.stringify(wishlist));
        }
      }
      
      window.dispatchEvent(new Event('wishlistUpdated'));
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return false;
    }
  },

  // Remove from wishlist
  async removeFromWishlist(productId: string) {
    try {
      const user = await authService.getCurrentUser();
      
      if (user) {
        // Logged in user - remove from database
        await supabaseClient
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
      } else {
        // Guest user - remove from localStorage
        const wishlist = JSON.parse(localStorage.getItem('wishlist_guest') || '[]');
        const updated = wishlist.filter((item: any) => item.id !== productId);
        localStorage.setItem('wishlist_guest', JSON.stringify(updated));
      }
      
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  },

  // Get wishlist items
  async getWishlist() {
    try {
      const user = await authService.getCurrentUser();
      
      if (user) {
        // Logged in user - get from database
        const { data, error } = await supabaseClient
          .from('wishlists')
          .select('product_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data?.map(item => item.product_data) || [];
      } else {
        // Guest user - get from localStorage
        return JSON.parse(localStorage.getItem('wishlist_guest') || '[]');
      }
    } catch (error) {
      console.error('Error getting wishlist:', error);
      return [];
    }
  },

  // Check if item is in wishlist
  async isInWishlist(productId: string) {
    try {
      const user = await authService.getCurrentUser();
      
      if (user) {
        // Logged in user - check database
        const { data, error } = await supabaseClient
          .from('wishlists')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .single();
        
        return !error && data;
      } else {
        // Guest user - check localStorage
        const wishlist = JSON.parse(localStorage.getItem('wishlist_guest') || '[]');
        return wishlist.some((item: any) => item.id === productId);
      }
    } catch (error) {
      return false;
    }
  },

  // Toggle wishlist item
  async toggleWishlist(product: any) {
    const isInWishlist = await this.isInWishlist(product.id);
    if (isInWishlist) {
      await this.removeFromWishlist(product.id);
      return false;
    } else {
      await this.addToWishlist(product);
      return true;
    }
  },

  // Sync guest wishlist to user account on login
  async syncGuestWishlist(userId: string) {
    try {
      const guestWishlist = JSON.parse(localStorage.getItem('wishlist_guest') || '[]');
      
      if (guestWishlist.length > 0) {
        // Get existing user wishlist
        const { data: existing } = await supabaseClient
          .from('wishlists')
          .select('product_id')
          .eq('user_id', userId);
        
        const existingIds = existing?.map(item => item.product_id) || [];
        
        // Insert only new items
        const newItems = guestWishlist
          .filter((item: any) => !existingIds.includes(item.id))
          .map((item: any) => ({
            user_id: userId,
            product_id: item.id,
            product_data: item
          }));
        
        if (newItems.length > 0) {
          await supabaseClient.from('wishlists').insert(newItems);
        }
        
        // Clear guest wishlist
        localStorage.removeItem('wishlist_guest');
        window.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (error) {
      console.error('Error syncing guest wishlist:', error);
    }
  }
};