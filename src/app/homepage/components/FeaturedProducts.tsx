'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { productService } from '@/lib/supabase/services/products';
import { wishlistUtils } from '@/lib/wishlist';
import type { Product } from '@/lib/supabase/types';

export default function FeaturedProducts() {
  const [isVisible, setIsVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('featured-products');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Use getTrending with a limit to optimize load time
        const data = await productService.getTrending(8);
        setProducts(data);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Load wishlist items
  useEffect(() => {
    const loadWishlist = () => {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlistItems(wishlist.map((item: any) => item.id));
    };

    loadWishlist();

    const handleWishlistUpdate = () => {
      loadWishlist();
    };

    // Listen for both custom event and storage changes
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    window.addEventListener('storage', handleWishlistUpdate);

    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
      window.removeEventListener('storage', handleWishlistUpdate);
    };
  }, []);

  return (
    <section id="featured-products" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Trending Designs
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover our latest collection of fancy t-shirts, premium shirts, stylish trousers, and
            performance gymwear
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-10">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <div
                key={product.id}
                className={`group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                {/* Product Image */}
                <div className="relative overflow-hidden aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                  <AppImage
                    src={product.image_url}
                    alt={product.image_alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Badge */}
                  {product.badge && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      {product.badge}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        wishlistUtils.toggleWishlist(product);
                      }}
                      className={`p-2 rounded-full shadow-lg transition-colors !cursor-pointer ${
                        wishlistItems.includes(product.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white hover:bg-primary hover:text-white'
                      }`}
                    >
                      <Icon
                        name="HeartIcon"
                        size={20}
                        className={wishlistItems.includes(product.id) ? 'fill-current' : ''}
                      />
                    </button>
                    <button className="bg-white p-2 rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors">
                      <Icon name="EyeIcon" size={20} />
                    </button>
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-4">
                    {product.discounted_price ? (
                      <>
                        <span className="text-2xl font-bold text-primary">
                          ₹{product.discounted_price}
                        </span>
                        <span className="text-lg text-gray-400 line-through">₹{product.price}</span>
                        <span className="text-sm text-green-600 font-semibold">
                          {Math.round(
                            ((product.price - product.discounted_price) / product.price) * 100
                          )}
                          % OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                    )}
                  </div>

                  {/* Colors */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600">Colors:</span>
                    <div className="flex gap-1">
                      {product.colors?.slice(0, 4).map((color, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-primary transition-colors cursor-pointer"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                      {product.colors && product.colors.length > 4 && (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs text-gray-600">
                          +{product.colors.length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={`/product-detail?id=${product.id}`}
                    className="block w-full bg-gradient-to-r from-primary to-purple-600 text-white text-center py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        {!loading && !error && products.length > 0 && (
          <div className="text-center mt-12">
            <Link
              href="/product-listing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              View All Products
              <Icon name="ArrowRightIcon" size={20} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
