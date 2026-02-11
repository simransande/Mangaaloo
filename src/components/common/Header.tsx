'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { authService } from '@/lib/supabase/services/auth';
import { cartService } from '@/lib/supabase/services/cart';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const currentUser = await authService?.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          const adminStatus = await authService?.isAdmin(currentUser.id);
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.log('Not authenticated or error checking auth status');
      }
    };
    checkAuthStatus();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = authService.supabaseClient.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
        const adminStatus = await authService.isAdmin(session.user.id);
        setIsAdmin(adminStatus);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch cart count dynamically
  useEffect(() => {
    const updateCartCount = async () => {
      try {
        let user = null;
        try {
          user = await authService.getCurrentUser();
        } catch (err) {
          // User not logged in
        }

        if (user) {
          // Get cart from database
          const cartItems = await cartService.getCartItems(user.id);
          const totalCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartCount(totalCount);
        } else {
          // Get cart from local storage
          const localCart = localStorage.getItem('cart');
          if (localCart) {
            const cartItems = JSON.parse(localCart);
            const totalCount = cartItems.reduce(
              (sum: number, item: any) => sum + (item.quantity || 0),
              0
            );
            setCartCount(totalCount);
          } else {
            setCartCount(0);
          }
        }
      } catch (err) {
        console.error('Error updating cart count:', err);
        setCartCount(0);
      }
    };

    updateCartCount();

    // Listen for cart updates
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Fetch wishlist count
  useEffect(() => {
    const updateWishlistCount = () => {
      const wishlist = localStorage.getItem('wishlist');
      if (wishlist) {
        const items = JSON.parse(wishlist);
        setWishlistCount(items.length);
      } else {
        setWishlistCount(0);
      }
    };

    updateWishlistCount();

    const handleWishlistUpdate = () => {
      updateWishlistCount();
    };

    // Listen for both custom event and storage changes
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    window.addEventListener('storage', handleWishlistUpdate);

    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
      window.removeEventListener('storage', handleWishlistUpdate);
    };
  }, []);

  const navLinks = [
    { id: 'nav_shop', label: 'Shop', href: '/product-listing' },
    { id: 'nav_categories', label: 'Categories', href: '/product-listing' },
    { id: 'nav_offers', label: 'Offers', href: '/homepage' },
    { id: 'nav_about', label: 'About', href: '/homepage' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/homepage" className="flex items-center space-x-2">
            <AppImage
              src="/assets/images/Screenshot_2026-02-02_at_10.48.11_AM-1770016852639.png"
              alt="Mangaaloo logo with colorful brand identity"
              width={140}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            {navLinks?.map((link) => (
              <Link
                key={link?.id}
                href={link?.href}
                className="text-base font-medium text-gray-900 hover:text-primary transition-colors"
              >
                {link?.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-6">
            {/* Search Icon */}
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Search"
            >
              <Icon name="MagnifyingGlassIcon" size={22} />
            </button>

            {/* Wishlist Icon with Badge */}
            <Link
              href="/wishlist"
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Wishlist"
            >
              <Icon name="HeartIcon" size={22} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon with Badge */}
            <Link
              href="/cart"
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Shopping cart"
            >
              <Icon name="ShoppingBagIcon" size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin Dashboard Link (only for admin users) */}
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Admin dashboard"
                title="Admin Dashboard"
              >
                <Icon name="ShieldCheckIcon" size={22} />
              </Link>
            )}

            {/* User Icon */}
            <Link
              href={user ? '/user-dashboard' : '/login'}
              className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={user ? 'Account Dashboard' : 'Login'}
              title={user ? 'My Dashboard' : 'Login'}
            >
              <Icon name="UserIcon" size={22} className={user ? 'text-primary' : 'text-gray-900'} />
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-slideUp">
            <nav className="flex flex-col space-y-4">
              {navLinks?.map((link) => (
                <Link
                  key={link?.id}
                  href={link?.href}
                  className="text-base font-medium text-gray-900 hover:text-primary transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link?.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="text-base font-medium text-gray-900 hover:text-primary transition-colors py-2 flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="ShieldCheckIcon" size={20} className="mr-2" />
                  Admin Dashboard
                </Link>
              )}
              <Link
                href={user ? '/user-dashboard' : '/login'}
                className="text-base font-medium text-gray-900 hover:text-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {user ? 'My Dashboard' : 'Login / Register'}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
