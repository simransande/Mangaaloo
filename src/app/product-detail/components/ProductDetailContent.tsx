'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import ImageGallery from './ImageGallery';
import ProductInfo from './ProductInfo';
import ProductTabs from './ProductTabs';
import RelatedProducts from './RelatedProducts';
import { productService } from '@/lib/supabase/services/products';
import type { Product } from '@/lib/supabase/types';
import { ecommerceTracking } from '@/lib/analytics';

function ProductDetailInner() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const products = await productService.getAll();
      
      if (products && products.length > 0) {
        // If productId is provided, find that specific product
        const selectedProduct = productId 
          ? products.find(p => p.id === productId) 
          : products[0];
        
        if (selectedProduct) {
          setProduct(selectedProduct);
          // Track product view
          ecommerceTracking.viewItem({
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.discounted_price || selectedProduct.price,
            category: selectedProduct.category_id,
          });
        } else {
          setError('Product not found');
        }
      } else {
        setError('No products available');
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
        <Link href="/product-listing" className="text-primary hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/homepage" className="hover:text-foreground">
            Home
          </Link>
          <Icon name="ChevronRightIcon" size={16} />
          <Link href="/product-listing" className="hover:text-foreground">
            Products
          </Link>
          <Icon name="ChevronRightIcon" size={16} />
          <span className="text-foreground font-medium">
            {product.name}
          </span>
        </div>
      </div>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <ImageGallery product={product} />
          <ProductInfo productId={product.id} />
        </div>

        <ProductTabs productId={product.id} />
        <RelatedProducts currentProductId={product.id} />
      </div>
    </div>
  );
}

export default function ProductDetailContent() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <ProductDetailInner />
    </Suspense>
  );
}