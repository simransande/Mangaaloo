'use client';

import { Dispatch, SetStateAction } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { CartItem } from './CartContent';
import { cartService } from '@/lib/supabase/services/cart';
import { authService } from '@/lib/supabase/services/auth';

interface CartItemsProps {
  items: CartItem[];
  onUpdateCart: Dispatch<SetStateAction<CartItem[]>>;
}

export default function CartItems({ items, onUpdateCart }: CartItemsProps) {
  const updateQuantity = async (cartItemId: string, productId: string, newQuantity: number, color: string, size: string) => {
    // Ensure quantity is valid
    if (newQuantity < 1) {
      console.warn('Invalid quantity:', newQuantity);
      return;
    }

    try {
      // Check if user is logged in
      let user = null;
      try {
        user = await authService.getCurrentUser();
      } catch (err) {
        console.log('User not logged in');
      }

      if (user) {
        // Update in database
        await cartService.updateQuantity(cartItemId, newQuantity);
      } else {
        // Update in local storage
        const localCart = localStorage.getItem('cart');
        if (localCart) {
          const cartItems = JSON.parse(localCart);
          const updatedCart = cartItems.map((item: any) => {
            if (item.id === productId && item.color === color && item.size === size) {
              return { ...item, quantity: newQuantity };
            }
            return item;
          });
          localStorage.setItem('cart', JSON.stringify(updatedCart));
        }
      }

      // Update UI with validated quantity
      onUpdateCart((prevItems) =>
        prevItems.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: Math.max(1, Math.min(newQuantity, item.stock || 999)) }
            : item
        )
      );
      
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err: any) {
      console.error('Error updating quantity:', err);
      alert(`Failed to update quantity: ${err.message}`);
    }
  };

  const removeItem = async (cartItemId: string, productId: string, color: string, size: string) => {
    if (!confirm('Remove this item from cart?')) return;

    try {
      // Check if user is logged in
      let user = null;
      try {
        user = await authService.getCurrentUser();
      } catch (err) {
        console.log('User not logged in');
      }

      if (user) {
        // Remove from database
        await cartService.removeItem(cartItemId);
      } else {
        // Remove from local storage
        const localCart = localStorage.getItem('cart');
        if (localCart) {
          const cartItems = JSON.parse(localCart);
          const updatedCart = cartItems.filter(
            (item: any) => !(item.id === productId && item.color === color && item.size === size)
          );
          localStorage.setItem('cart', JSON.stringify(updatedCart));
        }
      }

      // Update UI
      onUpdateCart((prevItems) => prevItems.filter((item) => item.id !== cartItemId));
      
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err: any) {
      console.error('Error removing item:', err);
      alert(`Failed to remove item: ${err.message}`);
    }
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    onUpdateCart(updatedItems);
    
    // Dispatch cart update event
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleRemove = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id);
    onUpdateCart(updatedItems);
    
    // Dispatch cart update event
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const finalPrice = item.discountedPrice || item.price;
        const itemTotal = finalPrice * item.quantity;

        return (
          <div
            key={`${item.id}-${item.color}-${item.size}`}
            className="glass-panel p-4 md:p-6 rounded-2xl flex gap-4"
          >
            {/* Product Image */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              <AppImage
                src={item.image}
                alt={item.imageAlt}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                  {item.color && <span>Color: {item.color}</span>}
                  {item.size && <span>Size: {item.size}</span>}
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  {item.discountedPrice ? (
                    <>
                      <span className="font-bold text-primary text-lg">
                        ₹{item.discountedPrice}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{item.price}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-lg">₹{item.price}</span>
                  )}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  Subtotal: ₹{itemTotal.toFixed(2)}
                </div>
              </div>

              {/* Quantity & Remove */}
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.id, item.id, item.quantity - 1, item.color, item.size)}
                    className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-50"
                    disabled={item.quantity <= 1}
                  >
                    <Icon name="MinusIcon" size={16} />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newQty = parseInt(e.target.value) || 1;
                      updateQuantity(item.id, item.id, newQty, item.color, item.size);
                    }}
                    className="w-12 text-center font-semibold outline-none bg-transparent"
                    min="1"
                    max={item.stock}
                  />
                  <button
                    onClick={() => updateQuantity(item.id, item.id, item.quantity + 1, item.color, item.size)}
                    className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-50"
                    disabled={item.quantity >= item.stock}
                  >
                    <Icon name="PlusIcon" size={16} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id, item.id, item.color, item.size)}
                  className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <Icon name="TrashIcon" size={20} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}