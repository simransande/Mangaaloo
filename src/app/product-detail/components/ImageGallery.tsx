'use client';

import { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import type { Product } from '@/lib/supabase/types';

interface ImageGalleryProps {
  product: Product | null;
}

export default function ImageGallery({ product }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  // Use product image or fallback
  const images = product?.image_url ? [
    {
      id: 'img_1',
      src: product.image_url,
      alt: product.image_alt || product.name
    }
  ] : [
    {
      id: 'img_fallback',
      src: '/assets/images/no_image.png',
      alt: 'No image available'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden group">
        <AppImage
          src={images[selectedImage]?.src}
          alt={images[selectedImage]?.alt}
          width={800}
          height={800}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          priority
        />
      </div>

      {/* Thumbnail Strip - Only show if multiple images */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-square bg-muted rounded-lg overflow-hidden transition-all ${
                selectedImage === index
                  ? 'ring-2 ring-primary' :'hover:ring-2 hover:ring-border'
              }`}
            >
              <AppImage
                src={image.src}
                alt={image.alt}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}