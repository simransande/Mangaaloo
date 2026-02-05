import { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import CartContent from './components/CartContent';

export const metadata: Metadata = {
  title: 'Shopping Cart | Mangaaloo',
  description: 'Review your cart items and proceed to checkout.',
};

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <CartContent />
      </main>
      <Footer />
    </>
  );
}