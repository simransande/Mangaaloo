'use client';

import { useState } from 'react';
import FilterSidebar from './FilterSidebar';
import ProductGrid from './ProductGrid';
import Icon from '@/components/ui/AppIcon';

export interface Filters {
  categories: string[];
  priceRange: [number, number];
  colors: string[];
  sizes: string[];
  sortBy: string;
}

export default function ProductListingContent() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    priceRange: [0, 10000],
    colors: [],
    sizes: [],
    sortBy: 'featured',
  });

  const activeFilterCount =
    filters.categories.length +
    filters.colors.length +
    filters.sizes.length +
    (filters.sortBy !== 'featured' ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Home</span>
          <Icon name="ChevronRightIcon" size={16} />
          <span className="text-foreground font-medium">All Products</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">All Products</h1>
              <p className="text-muted-foreground">Showing 48 products</p>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center space-x-2 px-4 py-2 border border-border rounded-lg"
            >
              <Icon name="AdjustmentsHorizontalIcon" size={20} />
              <span className="font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>

          {/* Mobile Sidebar Overlay */}
          {showFilters && (
            <div className="md:hidden fixed inset-0 z-50 bg-black/50 animate-fadeIn">
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white overflow-y-auto animate-slideUp">
                <div className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-white z-10">
                  <h2 className="font-heading font-bold text-xl">Filters</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-muted rounded-full"
                  >
                    <Icon name="XMarkIcon" size={24} />
                  </button>
                </div>
                <div className="p-4">
                  <FilterSidebar filters={filters} setFilters={setFilters} />
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            <ProductGrid filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
