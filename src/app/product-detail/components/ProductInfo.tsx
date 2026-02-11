'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { ecommerceTracking } from '@/lib/analytics';
import { productService } from '@/lib/supabase/services/products';
import { cartService } from '@/lib/supabase/services/cart';
import { authService } from '@/lib/supabase/services/auth';
import type { Product } from '@/lib/supabase/types';
import { useToast } from '@/lib/contexts/ToastContext';

interface ProductInfoProps {
  productId?: string;
}

export default function ProductInfo({ productId }: ProductInfoProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const products = await productService.getAll();
      if (products && products.length > 0) {
        const prod = productId ? products.find((p) => p.id === productId) : products[0];
        if (prod) {
          setProduct(prod);
          // Set default selections
          if (prod.colors && prod.colors.length > 0) {
            setSelectedColor(prod.colors[0]);
          }
          if (prod.sizes && prod.sizes.length > 0) {
            setSelectedSize(prod.sizes[0]);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Validate selections
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showToast('Please select a size', 'warning');
      return;
    }

    try {
      setAddingToCart(true);

      // Check if user is logged in
      let user = null;
      try {
        user = await authService.getCurrentUser();
      } catch (err) {
        console.log('User not logged in');
      }

      if (user) {
        // Add to database cart
        await cartService.addItem(
          user.id,
          product.id,
          quantity,
          selectedColor || undefined,
          selectedSize || undefined
        );
      } else {
        // Add to local storage cart
        const localCart = localStorage.getItem('cart');
        const cartItems = localCart ? JSON.parse(localCart) : [];

        const existingItemIndex = cartItems.findIndex(
          (item: any) =>
            item.id === product.id && item.color === selectedColor && item.size === selectedSize
        );

        if (existingItemIndex !== -1) {
          cartItems[existingItemIndex].quantity += quantity;
        } else {
          cartItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            discountedPrice: product.discounted_price,
            image: product.image_url,
            imageAlt: product.image_alt,
            color: selectedColor,
            size: selectedSize,
            quantity: quantity,
            stock: product.stock_quantity,
          });
        }

        localStorage.setItem('cart', JSON.stringify(cartItems));
      }

      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'));

      // Track add to cart event
      ecommerceTracking?.addToCart({
        id: product.id,
        name: product.name,
        price: product.discounted_price || product.price,
        quantity: quantity,
        category: product.category_id || 'Uncategorized',
      });

      showToast(`Added ${quantity} item(s) to cart!`, 'success');
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      showToast(`Failed to add to cart: ${err.message}`, 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    // Validate selections
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showToast('Please select a size', 'warning');
      return;
    }

    // Check if user is logged in
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        // Save product to cart first
        await handleAddToCart();
        // Redirect to login with checkout redirect
        router.push('/login?redirect=/checkout');
        return;
      }

      // User is logged in, add to cart and go to checkout
      await handleAddToCart();
      router.push('/checkout');
    } catch (err) {
      // User not logged in
      await handleAddToCart();
      router.push('/login?redirect=/checkout');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-12">Product not found</div>;
  }

  const discountPercentage = product.discounted_price
    ? Math.round(((product.price - product.discounted_price) / product.price) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Product Title */}
      <div>
        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">{product.name}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Icon
                key={`star_${i}`}
                name="StarIcon"
                size={18}
                variant="solid"
                className="text-accent"
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">(124 reviews)</span>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center space-x-4">
        <span className="text-4xl font-bold text-primary">
          ₹{product.discounted_price || product.price}
        </span>
        {product.discounted_price && (
          <>
            <span className="text-2xl text-muted-foreground line-through">₹{product.price}</span>
            <span className="px-3 py-1 bg-error text-error-foreground text-sm font-bold rounded-full">
              {discountPercentage}% OFF
            </span>
          </>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full animate-pulse ${
            product.stock_status === 'in-stock'
              ? 'bg-success'
              : product.stock_status === 'low-stock'
                ? 'bg-yellow-500'
                : 'bg-red-500'
          }`}
        ></div>
        <span
          className={`text-sm font-semibold ${
            product.stock_status === 'in-stock'
              ? 'text-success'
              : product.stock_status === 'low-stock'
                ? 'text-yellow-600'
                : 'text-red-600'
          }`}
        >
          {product.stock_status === 'in-stock'
            ? 'In Stock - Ships in 24 hours'
            : product.stock_status === 'low-stock'
              ? `Low Stock - Only ${product.stock_quantity} left`
              : 'Out of Stock'}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-border"></div>

      {/* Color Selection - Only show if colors exist */}
      {product.colors && product.colors.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="font-semibold text-sm">
              Color: {selectedColor || 'Select a color'}
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((color, index) => (
              <button
                key={`color_${index}`}
                onClick={() => setSelectedColor(color)}
                className={`px-4 py-2 border-2 rounded-lg transition-all hover:scale-105 ${
                  selectedColor === color
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-primary'
                }`}
              >
                <span className="font-medium">{color}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {product.sizes && product.sizes.length > 0 && (
        <div>
          <label className="font-semibold text-sm block mb-3">
            Size: {selectedSize || 'Select a size'}
          </label>
          <div className="grid grid-cols-6 gap-2">
            {product.sizes.map((size, index) => (
              <button
                key={`size_${index}`}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-3 border rounded-lg text-sm font-semibold transition-all ${
                  selectedSize === size
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="font-semibold text-sm block mb-3">Quantity</label>
        <div className="flex items-center space-x-4">
          <div className="flex items-center border border-border rounded-lg">
            <button
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              className="px-4 py-3 hover:bg-muted transition-colors"
            >
              <Icon name="MinusIcon" size={18} />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1))
                )
              }
              className="w-16 text-center font-semibold outline-none"
            />
            <button
              onClick={() => setQuantity((prev) => Math.min(product.stock_quantity, prev + 1))}
              className="px-4 py-3 hover:bg-muted transition-colors"
            >
              <Icon name="PlusIcon" size={18} />
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {product.stock_quantity} items available
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border"></div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          disabled={addingToCart || product.stock_status === 'out-of-stock'}
          className="w-full px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all hover-lift flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="ShoppingBagIcon" size={20} />
          <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleBuyNow}
            disabled={addingToCart || product.stock_status === 'out-of-stock'}
            className="px-4 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buy Now
          </button>
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`px-4 py-3 border-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
              isWishlisted
                ? 'border-error bg-error text-error-foreground'
                : 'border-border hover:border-error'
            }`}
          >
            <Icon name="HeartIcon" size={20} variant={isWishlisted ? 'solid' : 'outline'} />
            <span>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="glass-panel p-4 rounded-lg space-y-3">
        <div className="flex items-center space-x-3">
          <Icon name="TruckIcon" size={20} className="text-primary" />
          <span className="text-sm">Free delivery on orders above ₹999</span>
        </div>
        <div className="flex items-center space-x-3">
          <Icon name="ArrowPathIcon" size={20} className="text-primary" />
          <span className="text-sm">Easy 7-day return & exchange</span>
        </div>
        <div className="flex items-center space-x-3">
          <Icon name="ShieldCheckIcon" size={20} className="text-primary" />
          <span className="text-sm">100% authentic products</span>
        </div>
      </div>

      {/* Share */}
      <div>
        <label className="font-semibold text-sm block mb-3">Share</label>
        <div className="flex space-x-2">
          <button className="p-3 border border-border rounded-lg hover:bg-muted transition-colors">
            <Icon name="ShareIcon" size={20} />
          </button>
          <button className="p-3 border border-border rounded-lg hover:bg-muted transition-colors">
            <Icon name="LinkIcon" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
