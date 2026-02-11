import { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ProductListingContent from './components/ProductListingContent';

export const metadata: Metadata = {
  title: 'Shop All Products | Mangaaloo',
  description: 'Browse our complete collection of trendy clothing and fashion accessories.',
};

export default function ProductListingPage() {
  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <ProductListingContent />
      </main>
      <Footer />
    </>
  );
}
