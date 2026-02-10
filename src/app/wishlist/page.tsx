import { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import WishlistContent from './components/WishlistContent';

export const metadata: Metadata = {
  title: 'My Wishlist | Mangaaloo',
  description: 'Your saved favorite products',
};

export default function WishlistPage() {
  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <WishlistContent />
      </main>
      <Footer />
    </>
  );
}
