'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function Newsletter() {
  const [email, setEmail]= useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6">
            <Icon name="EnvelopeIcon" size={48} className="mx-auto text-primary" />
          </div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            Stay Updated
          </h2>
          <p className="text-muted-foreground mb-8">
            Subscribe to our newsletter for exclusive offers, new arrivals, and
            fashion tips delivered to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-4 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all hover-lift whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>

          {isSubmitted && (
            <div className="mt-4 text-success font-semibold animate-fadeIn">
              Thank you for subscribing! Check your email for confirmation.
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}