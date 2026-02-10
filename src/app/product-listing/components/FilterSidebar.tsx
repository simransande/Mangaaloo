'use client';

import { Dispatch, SetStateAction } from 'react';
import { Filters } from './ProductListingContent';

interface FilterSidebarProps {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
}

export default function FilterSidebar({ filters, setFilters }: FilterSidebarProps) {
  const categories = [
    { id: 'cat_tshirts', name: 'T-Shirts', count: 24 },
    { id: 'cat_shirts', name: 'Shirts', count: 18 },
    { id: 'cat_jeans', name: 'Jeans', count: 15 },
    { id: 'cat_dresses', name: 'Dresses', count: 12 },
    { id: 'cat_accessories', name: 'Accessories', count: 20 },
  ];

  const colors = [
    { id: 'color_black', name: 'Black', hex: '#000000' },
    { id: 'color_white', name: 'White', hex: '#FFFFFF' },
    { id: 'color_red', name: 'Red', hex: '#FF0000' },
    { id: 'color_blue', name: 'Blue', hex: '#0000FF' },
    { id: 'color_green', name: 'Green', hex: '#00FF00' },
    { id: 'color_yellow', name: 'Yellow', hex: '#FFFF00' },
  ];

  const sizes = [
    { id: 'size_xs', name: 'XS' },
    { id: 'size_s', name: 'S' },
    { id: 'size_m', name: 'M' },
    { id: 'size_l', name: 'L' },
    { id: 'size_xl', name: 'XL' },
    { id: 'size_xxl', name: 'XXL' },
  ];

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
  ];

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleColor = (color: string) => {
    setFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const toggleSize = (size: string) => {
    setFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 10000],
      colors: [],
      sizes: [],
      sortBy: 'featured',
    });
  };

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      <button
        onClick={clearFilters}
        className="w-full text-sm text-primary font-semibold hover:underline"
      >
        Clear All Filters
      </button>

      {/* Sort By */}
      <div>
        <h3 className="font-heading font-bold text-sm uppercase mb-3">Sort By</h3>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:border-primary"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-heading font-bold text-sm uppercase mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center justify-between cursor-pointer hover:bg-muted p-2 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.name)}
                  onChange={() => toggleCategory(category.name)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm">{category.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">({category.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-heading font-bold text-sm uppercase mb-3">Price Range</h3>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={filters.priceRange[1]}
            onChange={(e) =>
              setFilters({
                ...filters,
                priceRange: [0, parseInt(e.target.value)],
              })
            }
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-sm">
            <span>₹0</span>
            <span className="font-semibold">₹{filters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="font-heading font-bold text-sm uppercase mb-3">Color</h3>
        <div className="grid grid-cols-6 gap-2">
          {colors.map((color) => (
            <button
              key={color.id}
              onClick={() => toggleColor(color.hex)}
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                filters.colors.includes(color.hex)
                  ? 'border-primary scale-110'
                  : 'border-border hover:scale-105'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="font-heading font-bold text-sm uppercase mb-3">Size</h3>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <button
              key={size.id}
              onClick={() => toggleSize(size.name)}
              className={`px-4 py-2 border rounded-lg text-sm font-semibold transition-all ${
                filters.sizes.includes(size.name)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary'
              }`}
            >
              {size.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
