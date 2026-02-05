import { Metadata } from 'next';
import OrderConfirmationContent from './components/OrderConfirmationContent';

export const metadata: Metadata = {
  title: 'Order Confirmation | Mangaaloo',
  description: 'Your order has been placed successfully.',
};

export default function OrderConfirmationPage() {
  return <OrderConfirmationContent />;
}