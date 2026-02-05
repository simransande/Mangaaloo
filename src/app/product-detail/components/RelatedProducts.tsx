'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { productService } from '@/lib/supabase/services/products';
import type { Product } from '@/lib/supabase/types';

interface RelatedProductsProps {
  currentProductId?: string;
}

export default function RelatedProducts({ currentProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedProducts();
  }, [currentProductId]);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await productService.getAll();
      // Filter out current product and limit to 4
      const related = allProducts
        .filter(p => p.id !== currentProductId)
        .slice(0, 4);
      setProducts(related);
    } catch (err) {
      console.error('Error fetching related products:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <h2 className="font-heading font-bold text-2xl md:text-3xl mb-8">You May Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-xl mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-12">
      <h2 className="font-heading font-bold text-2xl md:text-3xl mb-8">You May Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => {
          const discountPercent = product.discounted_price
            ? Math.round(((product.price - product.discounted_price) / product.price) * 100)
            : 0;

          return (
            <Link
              key={product.id}
              href={`/product-detail?id=${product.id}`}
              className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
            >
              <div className="relative aspect-square bg-muted overflow-hidden">
                <AppImage
                  src={product.image_url}
                  alt={product.image_alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {product.badge && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {product.badge}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2">
                  {product.discounted_price ? (
                    <>
                      <span className="font-bold text-primary">₹{product.discounted_price}</span>
                      <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
                    </>
                  ) : (
                    <span className="font-bold text-gray-900">₹{product.price}</span>
                  )}
                </div>
                {discountPercent > 0 && (
                  <span className="text-xs text-green-600 font-semibold">{discountPercent}% OFF</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}