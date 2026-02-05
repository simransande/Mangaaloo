'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { Icon } from '@iconify/react';

interface Category {
  id: string;
  name: string;
  image: string;
  imageAlt: string;
  link: string;
}

export default function CategoryShowcase() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('category-showcase');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const categories: Category[] = [
  {
    id: 'cat_fancy_tshirts',
    name: "Fancy T-Shirts",
    image: "https://images.unsplash.com/photo-1669024728286-79e1cef4c8f6",
    imageAlt: 'Collection of fancy t-shirts with creative and bold graphic designs',
    link: '/product-listing'
  },
  {
    id: 'cat_shirts',
    name: "Premium Shirts",
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_16c447891-1770102022771.png",
    imageAlt: 'Premium casual and formal shirts collection for all occasions',
    link: '/product-listing'
  },
  {
    id: 'cat_trousers',
    name: 'Stylish Trousers',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_13c375630-1770213340243.png",
    imageAlt: 'Stylish trousers and pants collection with modern fits',
    link: '/product-listing'
  },
  {
    id: 'cat_gymwear',
    name: 'Gym & Activewear',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_13fec5101-1770213339406.png",
    imageAlt: 'High-performance gym wear and athletic clothing for fitness enthusiasts',
    link: '/product-listing'
  }];



  return (
    <section id="category-showcase" className="py-20 md:py-32 bg-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div
            className={`inline-block px-4 py-2 bg-primary/10 rounded-full mb-6 transition-all duration-1000 ${
            isVisible ?
            'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`
            }>
            <span className="text-primary font-semibold text-sm tracking-wide uppercase">Design Styles</span>
          </div>
          <h2
            className={`font-heading font-bold text-5xl md:text-6xl mb-6 text-gray-900 transition-all duration-1000 delay-100 ${
            isVisible ?
            'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`
            }>
            Find Your <span className="text-primary">Style</span>
          </h2>
          <p
            className={`text-xl text-gray-600 max-w-2xl mx-auto transition-all duration-1000 delay-200 ${
            isVisible ?
            'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`
            }>
            Every design tells a story. Choose from bold graphics, artistic masterpieces, or minimalist elegance.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) =>
          <Link
            key={category.id}
            href={category.link}
            className={`group relative h-[500px] rounded-3xl overflow-hidden transition-all duration-1000 hover:scale-105 hover:shadow-2xl ${
            isVisible ?
            'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`
            }
            style={{ transitionDelay: `${(index + 2) * 150}ms` }}>

              <AppImage
              src={category.image}
              alt={category.imageAlt}
              width={600}
              height={800}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />


              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
              
              {/* Decorative Border */}
              <div className="absolute inset-0 border-4 border-white/0 group-hover:border-primary/50 transition-colors rounded-3xl"></div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
                <div className="mb-4">
                  <div className="w-16 h-1 bg-primary rounded-full group-hover:w-24 transition-all"></div>
                </div>
                <h3 className="font-heading font-bold text-4xl mb-4 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <div className="flex items-center space-x-3 text-lg font-semibold group-hover:translate-x-2 transition-transform">
                  <span>Explore Collection</span>
                  <span className="text-primary">→</span>
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors"></div>
            </Link>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6 text-lg">Can't decide? Browse our entire collection</p>
          <Link
            href="/product-listing"
            className="inline-flex items-center space-x-2 px-8 py-4 border-2 border-gray-900 text-gray-900 font-bold rounded-full hover:bg-gray-900 hover:text-white transition-all hover:scale-105">
            <span>View All T-Shirts</span>
            <Icon name="ArrowRightIcon" size={20} />
          </Link>
        </div>
      </div>
    </section>);

}