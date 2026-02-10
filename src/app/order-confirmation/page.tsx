import { Metadata } from 'next';
import { Suspense } from 'react';
import OrderConfirmationContent from './components/OrderConfirmationContent';

export const metadata: Metadata = {
  title: 'Order Confirmation | Mangaaloo',
  description: 'Your order has been placed successfully.',
};

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
