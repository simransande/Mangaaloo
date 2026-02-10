export const wishlistUtils = {
  // Add item to wishlist
  addToWishlist: (product: any) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const exists = wishlist.find((item: any) => item.id === product.id);

    if (!exists) {
      wishlist.push(product);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      window.dispatchEvent(new Event('wishlistUpdated'));
      return true;
    }
    return false;
  },

  // Remove item from wishlist
  removeFromWishlist: (productId: string) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const updated = wishlist.filter((item: any) => item.id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    window.dispatchEvent(new Event('wishlistUpdated'));
  },

  // Check if item is in wishlist
  isInWishlist: (productId: string) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    return wishlist.some((item: any) => item.id === productId);
  },

  // Get current wishlist
  getWishlist: () => {
    return JSON.parse(localStorage.getItem('wishlist') || '[]');
  },

  // Toggle wishlist item
  toggleWishlist: (product: any) => {
    if (wishlistUtils.isInWishlist(product.id)) {
      wishlistUtils.removeFromWishlist(product.id);
      return false;
    } else {
      wishlistUtils.addToWishlist(product);
      return true;
    }
  },
};
