'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Declare gtag types
declare global {
  interface Window {
    gtag?: (command: string, targetId: string | Date, config?: Record<string, any>) => void;
    dataLayer?: any[];
  }
}

export function useGoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!measurementId || measurementId === 'your-google-analytics-id-here') return;

    if (!window.dataLayer) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = [];
      window.gtag = function () {
        window.dataLayer?.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', measurementId);
    }

    const url = pathname + (searchParams.toString() ? `?${searchParams}` : '');
    window.gtag?.('event', 'page_view', { page_path: url });
  }, [pathname, searchParams]);
}

export function trackEvent(eventName: string, eventParams: Record<string, any> = {}) {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

// E-commerce tracking functions
export const ecommerceTracking = {
  // Track product view
  viewItem(product: {
    id: string;
    name: string;
    price: number;
    category?: string;
    brand?: string;
  }) {
    trackEvent('view_item', {
      currency: 'USD',
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          item_category: product.category || 'Uncategorized',
          item_brand: product.brand || 'Unknown',
        },
      ],
    });
  },

  // Track add to cart
  addToCart(product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }) {
    trackEvent('add_to_cart', {
      currency: 'USD',
      value: product.price * product.quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity,
          item_category: product.category || 'Uncategorized',
        },
      ],
    });
  },

  // Track remove from cart
  removeFromCart(product: { id: string; name: string; price: number; quantity: number }) {
    trackEvent('remove_from_cart', {
      currency: 'USD',
      value: product.price * product.quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity,
        },
      ],
    });
  },

  // Track begin checkout
  beginCheckout(
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>,
    totalValue: number
  ) {
    trackEvent('begin_checkout', {
      currency: 'USD',
      value: totalValue,
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  },

  // Track purchase
  purchase(transaction: {
    transactionId: string;
    value: number;
    tax?: number;
    shipping?: number;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  }) {
    trackEvent('purchase', {
      transaction_id: transaction.transactionId,
      currency: 'USD',
      value: transaction.value,
      tax: transaction.tax || 0,
      shipping: transaction.shipping || 0,
      items: transaction.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  },

  // Track search
  search(searchTerm: string) {
    trackEvent('search', {
      search_term: searchTerm,
    });
  },

  // Track view cart
  viewCart(
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>,
    totalValue: number
  ) {
    trackEvent('view_cart', {
      currency: 'USD',
      value: totalValue,
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  },
};

// Conversion funnel tracking
export const funnelTracking = {
  // User registration funnel
  registrationStart() {
    trackEvent('registration_start', {
      funnel_step: 'registration_form_view',
    });
  },

  registrationComplete(userId: string) {
    trackEvent('sign_up', {
      method: 'email',
      user_id: userId,
    });
  },

  // Login funnel
  loginStart() {
    trackEvent('login_start', {
      funnel_step: 'login_form_view',
    });
  },

  loginComplete(userId: string) {
    trackEvent('login', {
      method: 'email',
      user_id: userId,
    });
  },

  // Checkout funnel
  checkoutStep(step: number, stepName: string) {
    trackEvent('checkout_progress', {
      checkout_step: step,
      checkout_step_name: stepName,
    });
  },

  // Product listing engagement
  filterApplied(filterType: string, filterValue: string) {
    trackEvent('filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
    });
  },

  sortApplied(sortOption: string) {
    trackEvent('sort_applied', {
      sort_option: sortOption,
    });
  },
};
