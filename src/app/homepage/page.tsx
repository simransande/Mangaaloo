import { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import HeroSection from './components/HeroSection';
import OffersSection from './components/OffersSection';
import FeaturedProducts from './components/FeaturedProducts';
import CategoryShowcase from './components/CategoryShowcase';
import SocialProof from './components/SocialProof';
import Newsletter from './components/Newsletter';

export const metadata: Metadata = {
  title: 'Mangaaloo - Premium Printed T-Shirts | 200+ Unique Designs',
  description: 'Shop exclusive printed t-shirts with 200+ unique designs. From bold graphics to artistic prints - premium quality t-shirts with stunning front designs.',
};

export default function Homepage() {
  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <HeroSection />
        <OffersSection />
        <FeaturedProducts />
        <CategoryShowcase />
        <SocialProof />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}