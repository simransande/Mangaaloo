import { Metadata } from 'next';
import CheckoutContent from './components/CheckoutContent';

export const metadata: Metadata = {
  title: 'Checkout | Mangaaloo',
  description: 'Complete your order with Cash on Delivery payment option.',
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
