'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { reviewService } from '@/lib/supabase/services/reviews';
import { authService } from '@/lib/supabase/services/auth';
import type { ReviewWithUser } from '@/lib/supabase/types';
import { useToast } from '@/lib/contexts/ToastContext';

interface ReviewsSectionProps {
  productId: string;
}

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userReview, setUserReview] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [averageRating, setAverageRating] = useState({ average: 0, count: 0 });

  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkCurrentUser();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const [reviewsData, ratingData] = await Promise.all([
        reviewService.getByProduct(productId),
        reviewService.getAverageRating(productId),
      ]);
      setReviews(reviewsData);
      setAverageRating(ratingData);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const existingReview = await reviewService.getUserReview(productId, user.id);
        setUserReview(existingReview);
      }
    } catch (err) {
      console.error('Error checking user:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      showToast('Please login to submit a review', 'warning');
      return;
    }

    if (!title.trim() || !content.trim()) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await reviewService.create({
        product_id: productId,
        user_id: currentUser.id,
        rating,
        title: title.trim(),
        content: content.trim(),
      });

      // Reset form
      setTitle('');
      setContent('');
      setRating(5);
      setShowForm(false);

      // Refresh reviews and user review
      await fetchReviews();
      const newUserReview = await reviewService.getUserReview(productId, currentUser.id);
      setUserReview(newUserReview);

      showToast(
        'Review submitted successfully! It will be visible after admin approval.',
        'success'
      );
    } catch (err: any) {
      console.error('Error submitting review:', err);
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (
    count: number,
    size: number = 16,
    interactive: boolean = false,
    onRate?: (rating: number) => void
  ) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate?.(star)}
            disabled={!interactive}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
          >
            <Icon
              name="StarIcon"
              size={size}
              variant={star <= count ? 'solid' : 'outline'}
              className={star <= count ? 'text-accent' : 'text-muted-foreground'}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="glass-panel p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-4xl font-bold">{averageRating.average.toFixed(1)}</span>
              {renderStars(Math.round(averageRating.average), 20)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on {averageRating.count} {averageRating.count === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {currentUser && !userReview && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all"
            >
              Write a Review
            </button>
          )}
        </div>
      </div>

      {/* User's Existing Review Status */}
      {userReview && (
        <div className="glass-panel p-4 rounded-lg border-l-4 border-accent">
          <div className="flex items-start space-x-3">
            <Icon name="InformationCircleIcon" size={20} className="text-accent mt-0.5" />
            <div>
              <p className="font-semibold">Your Review Status: {userReview.status}</p>
              <p className="text-sm text-muted-foreground">
                {userReview.status === 'pending' && 'Your review is awaiting admin approval.'}
                {userReview.status === 'approved' && 'Your review has been published.'}
                {userReview.status === 'rejected' && 'Your review was not approved.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && currentUser && !userReview && (
        <form onSubmit={handleSubmitReview} className="glass-panel p-6 rounded-lg space-y-4">
          <h3 className="font-heading font-bold text-xl">Write Your Review</h3>

          <div>
            <label className="block text-sm font-semibold mb-2">Rating</label>
            {renderStars(rating, 24, true, setRating)}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Review Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Your Review</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts about this product"
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {error && (
        <div className="glass-panel p-4 rounded-lg border-l-4 border-destructive">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {reviews.length === 0 && !loading && (
        <div className="text-center py-12">
          <Icon
            name="ChatBubbleLeftRightIcon"
            size={48}
            className="text-muted-foreground mx-auto mb-4"
          />
          <p className="text-muted-foreground">
            No reviews yet. Be the first to review this product!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="glass-panel p-6 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">
                    {review.user_profiles?.full_name || 'Anonymous'}
                  </span>
                  {review.is_verified_purchase && (
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-success/10 text-success text-xs font-semibold rounded">
                      <Icon name="CheckBadgeIcon" size={14} />
                      <span>Verified Purchase</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {renderStars(review.rating, 14)}
                  <span className="text-sm font-semibold">{review.title}</span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <p className="text-foreground leading-relaxed">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
