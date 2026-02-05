import { supabaseClient } from '../client';
import type { Review, ReviewWithUser } from '../types';

export const reviewService = {
  // Get approved reviews for a product
  async getByProduct(productId: string) {
    const { data, error } = await supabaseClient
      .from('reviews')
      .select(`
        *,
        user_profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ReviewWithUser[];
  },

  // Get user's review for a product
  async getUserReview(productId: string, userId: string) {
    const { data, error } = await supabaseClient
      .from('reviews').select('*').eq('product_id', productId).eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data as Review | null;
  },

  // Create a review
  async create(review: Omit<Review, 'id' | 'status' | 'is_verified_purchase' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseClient
      .from('reviews')
      .insert(review)
      .select()
      .single();

    if (error) throw error;
    return data as Review;
  },

  // Update a review (only pending reviews)
  async update(id: string, updates: Partial<Pick<Review, 'rating' | 'title' | 'content'>>) {
    const { data, error } = await supabaseClient
      .from('reviews').update(updates).eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Review;
  },

  // Delete a review (only pending reviews)
  async delete(id: string) {
    const { error } = await supabaseClient
      .from('reviews').delete().eq('id', id);

    if (error) throw error;
  },

  // Get all reviews for moderation (admin only)
  async getAllForModeration() {
    const { data, error } = await supabaseClient
      .from('reviews').select(`*,user_profiles (full_name,email),products (name,image_url)`).order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get pending reviews count (admin only)
  async getPendingCount() {
    const { count, error } = await supabaseClient
      .from('reviews').select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  },

  // Moderate a review (admin only)
  async moderate(reviewId: string, status: 'approved' | 'rejected', moderatorId: string, reason?: string) {
    // Get current review status
    const { data: currentReview, error: fetchError } = await supabaseClient
      .from('reviews')
      .select('status')
      .eq('id', reviewId)
      .single();

    if (fetchError) throw fetchError;

    // Update review status
    const { data: updatedReview, error: updateError } = await supabaseClient
      .from('reviews')
      .update({ status })
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log moderation action
    const { error: logError } = await supabaseClient
      .from('review_moderation_logs')
      .insert({
        review_id: reviewId,
        moderator_id: moderatorId,
        action: status,
        previous_status: currentReview.status,
        new_status: status,
        reason,
      });

    if (logError) throw logError;

    return updatedReview as Review;
  },

  // Get average rating for a product
  async getAverageRating(productId: string) {
    const { data, error } = await supabaseClient
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('status', 'approved');

    if (error) throw error;

    if (!data || data.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = data.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / data.length;

    return { average: Math.round(average * 10) / 10, count: data.length };
  },
};