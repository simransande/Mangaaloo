import { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ProductDetailContent from './components/ProductDetailContent';

export const metadata: Metadata = {
  title: 'Product Details | Mangaaloo',
  description: 'View detailed product information, available colors, sizes, and add to cart.',
};

export default function ProductDetailPage() {
  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <ProductDetailContent />
      </main>
      <Footer />
    </>
  );
}