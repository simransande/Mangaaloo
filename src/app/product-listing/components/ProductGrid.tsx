'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { Filters } from './ProductListingContent';
import { productService } from '@/lib/supabase/services/products';
import { wishlistUtils } from '@/lib/wishlist';
import type { Product } from '@/lib/supabase/types';

interface ProductGridProps {
  filters: Filters;
}

export default function ProductGrid({ filters }: ProductGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const productsPerPage = 12;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getAll();
        setAllProducts(data);
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

  // Filter products based on selected filters
  const filteredProducts = allProducts.filter((product) => {
    // Category filter
    if (filters.categories.length > 0) {
      const categoryMatch = filters.categories.some(cat => {
        return product.category_id;
      });
      if (!categoryMatch) return false;
    }

    // Color filter
    if (filters.colors.length > 0) {
      const colorMatch = filters.colors.some(filterColor =>
        product.colors?.some(productColor => productColor.toLowerCase() === filterColor.toLowerCase())
      );
      if (!colorMatch) return false;
    }

    // Size filter
    if (filters.sizes.length > 0) {
      const sizeMatch = filters.sizes.some(filterSize =>
        product.sizes?.includes(filterSize)
      );
      if (!sizeMatch) return false;
    }

    // Price filter
    const price = product.discounted_price || product.price;
    if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
      return false;
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.discounted_price || a.price;
    const priceB = b.discounted_price || b.price;

    switch (filters.sortBy) {
      case 'price-low':
        return priceA - priceB;
      case 'price-high':
        return priceB - priceA;
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'popular':
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
          <p className="text-gray-600 mt-1">
            {loading ? 'Loading...' : `Showing ${startIndex + 1}-${Math.min(endIndex, sortedProducts.length)} of ${sortedProducts.length} products`}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon name="Squares2X2Icon" size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon name="ListBulletIcon" size={20} />
          </button>
        </div>
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

      {/* No Products */}
      {!loading && !error && currentProducts.length === 0 && (
        <div className="text-center py-20">
          <Icon name="ShoppingBagIcon" size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your filters</p>
        </div>
      )}

      {/* Products Grid/List */}
      {!loading && !error && currentProducts.length > 0 && (
        <>
          <div
            className={`grid gap-6 ${
              viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            }`}
          >
            {currentProducts.map((product) => {
              const finalPrice = product.discounted_price || product.price;
              const discountPercent = product.discounted_price
                ? Math.round(((product.price - product.discounted_price) / product.price) * 100)
                : 0;

              return (
                <Link
                  key={product.id}
                  href={`/product-detail?id=${product.id}`}
                  className={`group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  {/* Product Image */}
                  <div
                    className={`relative overflow-hidden bg-gray-100 ${
                      viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-square'
                    }`}
                  >
                    <AppImage
                      src={product.image_url}
                      alt={product.image_alt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Badge */}
                    {product.badge && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {product.badge}
                      </div>
                    )}

                    {/* Stock Status */}
                    <div
                      className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                        product.stock_status === 'in-stock' ? 'bg-green-500 text-white'
                          : product.stock_status === 'low-stock' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                      }`}
                    >
                      {product.stock_status === 'in-stock' ? 'In Stock'
                        : product.stock_status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          wishlistUtils.toggleWishlist(product);
                        }}
                        className={`p-2 rounded-full shadow-lg transition-colors ${
                          wishlistItems.includes(product.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white hover:bg-primary hover:text-white'
                        }`}
                      >
                        <Icon 
                          name="HeartIcon" 
                          size={18} 
                          className={wishlistItems.includes(product.id) ? 'fill-current' : ''}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>

                    {/* Description - only in list view */}
                    {viewMode === 'list' && product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                      {product.discounted_price ? (
                        <>
                          <span className="text-xl font-bold text-primary">₹{product.discounted_price}</span>
                          <span className="text-sm text-gray-400 line-through">₹{product.price}</span>
                          <span className="text-xs text-green-600 font-semibold">{discountPercent}% OFF</span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                      )}
                    </div>

                    {/* Colors & Sizes */}
                    <div className="flex items-center gap-4 mb-4">
                      {/* Colors */}
                      {product.colors && product.colors.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">Colors:</span>
                          <div className="flex gap-1">
                            {product.colors.slice(0, 3).map((color, idx) => (
                              <div
                                key={idx}
                                className="w-4 h-4 rounded-full border border-gray-300"
                                title={color}
                                style={{ backgroundColor: color.toLowerCase() }}
                              />
                            ))}
                            {product.colors.length > 3 && (
                              <span className="text-xs text-gray-500">+{product.colors.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sizes */}
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">Sizes:</span>
                          <span className="text-xs text-gray-900 font-medium">
                            {product.sizes.slice(0, 3).join(', ')}
                            {product.sizes.length > 3 && ` +${product.sizes.length - 3}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stock Info */}
                    <div className="text-sm text-gray-600">
                      {product.stock_quantity > 0 ? (
                        <span>
                          {product.stock_quantity} {product.stock_quantity === 1 ? 'item' : 'items'} available
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">Out of stock</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icon name="ChevronLeftIcon" size={20} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    currentPage === page
                      ? 'bg-primary text-white' : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icon name="ChevronRightIcon" size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}