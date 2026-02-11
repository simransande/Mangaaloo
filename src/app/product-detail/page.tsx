import { Metadata } from 'next';
import { Suspense } from 'react';
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
        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }
        >
          <ProductDetailContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
