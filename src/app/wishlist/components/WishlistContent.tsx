'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

export default function WishlistContent() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  useEffect(() => {
    const loadWishlist = () => {
      const stored = localStorage.getItem('wishlist');
      if (stored) {
        setWishlistItems(JSON.parse(stored));
      }
    };
    loadWishlist();
  }, []);

  const removeFromWishlist = (productId: string) => {
    const updated = wishlistItems.filter(item => item.id !== productId);
    setWishlistItems(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Icon name="HeartIcon" size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h1>
          <p className="text-gray-600 mb-8">Save items you love to your wishlist</p>
          <Link
            href="/product-listing"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist ({wishlistItems.length})</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative">
              <AppImage
                src={item.image_url || '/assets/images/placeholder.jpg'}
                alt={item.name}
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => removeFromWishlist(item.id)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
              >
                <Icon name="HeartIcon" size={20} className="text-red-500 fill-current" />
              </button>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
              <p className="text-primary font-bold text-lg mb-3">₹{item.price}</p>
              
              <div className="flex gap-2">
                <Link
                  href={`/product-detail/${item.id}`}
                  className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-center hover:bg-gray-200 transition-colors"
                >
                  View Details
                </Link>
                <button className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}