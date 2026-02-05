'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export default function SocialProof() {
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

    const section = document.getElementById('social-proof');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const testimonials: Testimonial[] = [
    {
      id: 'test_1',
      name: 'Priya Sharma',
      rating: 5,
      comment:
        'Amazing quality and fast delivery! The clothes fit perfectly and the colors are vibrant. Will definitely order again.',
      date: 'Jan 28, 2026',
    },
    {
      id: 'test_2',
      name: 'Rahul Patel',
      rating: 5,
      comment:
        'Great collection and affordable prices. Customer service was very helpful in choosing the right size.',
      date: 'Jan 25, 2026',
    },
    {
      id: 'test_3',
      name: 'Sneha Desai',
      rating: 4,
      comment:
        'Love the variety! Found exactly what I was looking for. Packaging was excellent too.',
      date: 'Jan 22, 2026',
    },
  ];

  return (
    <section id="social-proof" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2
            className={`font-heading font-bold text-4xl md:text-5xl mb-4 transition-all duration-1000 ${
              isVisible
                ? 'opacity-100 translate-y-0' :'opacity-0 translate-y-10'
            }`}
          >
            What Our Customers Say
          </h2>
          <p
            className={`text-muted-foreground max-w-2xl mx-auto transition-all duration-1000 delay-100 ${
              isVisible
                ? 'opacity-100 translate-y-0' :'opacity-0 translate-y-10'
            }`}
          >
            Join thousands of happy customers
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`glass-panel p-6 rounded-2xl transition-all duration-1000 ${
                isVisible
                  ? 'opacity-100 translate-y-0' :'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${(index + 2) * 150}ms` }}
            >
              {/* Rating */}
              <div className="flex space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Icon
                    key={`${testimonial.id}_star_${i}`}
                    name="StarIcon"
                    size={18}
                    variant="solid"
                    className="text-accent"
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-foreground mb-4 leading-relaxed">
                "{testimonial.comment}"
              </p>

              {/* Author */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.date}
                  </div>
                </div>
                <Icon name="CheckBadgeIcon" size={24} variant="solid" className="text-success" />
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-1000 delay-500 ${
            isVisible
              ? 'opacity-100 translate-y-0' :'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">10K+</div>
            <div className="text-sm text-muted-foreground">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-sm text-muted-foreground">Products</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">4.8</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Support</div>
          </div>
        </div>
      </div>
    </section>
  );
}