'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative w-full min-h-[95vh] flex items-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div
            className={`space-y-8 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="space-y-6">
              {/* Eyebrow Text */}
              <div className="inline-block px-6 py-3 bg-primary/20 backdrop-blur-sm rounded-full border border-primary/30">
                <span className="text-primary font-bold text-sm tracking-widest uppercase">
                  Premium Collection 2026
                </span>
              </div>

              <h1 className="font-heading font-black text-6xl md:text-7xl lg:text-8xl leading-tight text-white">
                Wear The
                <span className="block mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Cool Vibe
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 max-w-xl leading-relaxed">
                Discover <span className="font-bold text-primary">exclusive designs</span> that
                define your style. From bold graphics to artistic prints on premium quality tees.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/product-listing"
                className="group px-10 py-5 bg-primary text-white font-bold text-lg rounded-full hover:bg-primary/90 transition-all hover:scale-105 shadow-2xl hover:shadow-primary/50 flex items-center gap-3"
              >
                Shop Collection
                <span className="group-hover:translate-x-2 transition-transform text-2xl">→</span>
              </Link>
              <Link
                href="/product-listing"
                className="px-10 py-5 border-2 border-white text-white font-bold text-lg rounded-full hover:bg-white hover:text-gray-900 transition-all shadow-lg backdrop-blur-sm"
              >
                New Arrivals
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 border border-primary/30">
                  <span className="text-primary text-3xl font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-white block">Premium</span>
                <span className="text-xs text-gray-400">Quality Fabric</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 border border-primary/30">
                  <span className="text-primary text-3xl font-bold">∞</span>
                </div>
                <span className="text-sm font-bold text-white block">Unique</span>
                <span className="text-xs text-gray-400">Designs</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 border border-primary/30">
                  <span className="text-primary text-3xl font-bold">⚡</span>
                </div>
                <span className="text-sm font-bold text-white block">Fast</span>
                <span className="text-xs text-gray-400">Delivery</span>
              </div>
            </div>
          </div>

          {/* Right - 4 Boys Grid */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}
          >
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Boy 1 - Standing Confident */}
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden group hover:scale-105 transition-transform duration-500">
                <AppImage
                  src="https://images.unsplash.com/photo-1735317146081-f8671e25855c"
                  alt="Young man in confident standing posture wearing cool designed black graphic t-shirt"
                  width={400}
                  height={533}
                  className="w-full h-full object-cover"
                  priority
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-bold text-sm">Bold Graphics</p>
                </div>
              </div>

              {/* Boy 2 - Casual Lean */}
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden group hover:scale-105 transition-transform duration-500 mt-8">
                <AppImage
                  src="https://images.unsplash.com/photo-1609688937455-94a9158864a6"
                  alt="Young man in casual leaning posture wearing stylish white printed t-shirt with artistic design"
                  width={400}
                  height={533}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-bold text-sm">Artistic Prints</p>
                </div>
              </div>

              {/* Boy 3 - Arms Crossed */}
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden group hover:scale-105 transition-transform duration-500 -mt-8">
                <AppImage
                  src="https://images.unsplash.com/photo-1641645480617-215804b8cb5e"
                  alt="Young man with arms crossed wearing trendy gray t-shirt with modern geometric design"
                  width={400}
                  height={533}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-bold text-sm">Geometric Style</p>
                </div>
              </div>

              {/* Boy 4 - Dynamic Pose */}
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden group hover:scale-105 transition-transform duration-500">
                <AppImage
                  src="https://images.unsplash.com/photo-1520626337972-ebf863448db6"
                  alt="Young man in dynamic pose wearing cool navy blue t-shirt with vintage graphic print"
                  width={400}
                  height={533}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-bold text-sm">Vintage Vibes</p>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-8 py-4 rounded-2xl shadow-2xl border-4 border-primary/30 z-20">
              <div className="text-center">
                <div className="text-4xl font-black text-primary">50% OFF</div>
                <div className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Limited Time
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
}
