'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import ReviewsSection from './ReviewsSection';

interface ProductTabsProps {
  productId: string;
}

export default function ProductTabs({ productId }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState('description');

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'size-guide', label: 'Size Guide' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'delivery', label: 'Delivery Info' },
  ];

  return (
    <div className="border-t border-border pt-12 mb-16">
      {/* Tab Headers */}
      <div className="flex space-x-6 border-b border-border mb-6 overflow-x-auto">
        {tabs?.map((tab) => (
          <button
            key={tab?.id}
            onClick={() => setActiveTab(tab?.id)}
            className={`pb-4 font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab?.id
                ? 'text-primary border-b-2 border-primary' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab?.label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div className="prose max-w-none">
        {activeTab === 'description' && (
          <div className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Experience ultimate comfort with our Classic Cotton T-Shirt. Made
              from 100% premium cotton, this t-shirt offers a soft, breathable
              feel perfect for everyday wear.
            </p>
            <h3 className="font-heading font-bold text-xl mt-6 mb-3">
              Features:
            </h3>
            <ul className="space-y-2 text-foreground">
              <li className="flex items-start space-x-2">
                <Icon name="CheckIcon" size={20} className="text-success mt-0.5" />
                <span>100% premium cotton fabric</span>
              </li>
              <li className="flex items-start space-x-2">
                <Icon name="CheckIcon" size={20} className="text-success mt-0.5" />
                <span>Pre-shrunk for perfect fit</span>
              </li>
              <li className="flex items-start space-x-2">
                <Icon name="CheckIcon" size={20} className="text-success mt-0.5" />
                <span>Reinforced double stitching</span>
              </li>
              <li className="flex items-start space-x-2">
                <Icon name="CheckIcon" size={20} className="text-success mt-0.5" />
                <span>Machine washable</span>
              </li>
              <li className="flex items-start space-x-2">
                <Icon name="CheckIcon" size={20} className="text-success mt-0.5" />
                <span>Available in multiple colors</span>
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'size-guide' && (
          <div>
            <h3 className="font-heading font-bold text-xl mb-4">
              Size Chart (in inches)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="border border-border px-4 py-3 text-left font-semibold">
                      Size
                    </th>
                    <th className="border border-border px-4 py-3 text-left font-semibold">
                      Chest
                    </th>
                    <th className="border border-border px-4 py-3 text-left font-semibold">
                      Length
                    </th>
                    <th className="border border-border px-4 py-3 text-left font-semibold">
                      Shoulder
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-3 font-semibold">
                      XS
                    </td>
                    <td className="border border-border px-4 py-3">34-36</td>
                    <td className="border border-border px-4 py-3">26</td>
                    <td className="border border-border px-4 py-3">15.5</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border border-border px-4 py-3 font-semibold">
                      S
                    </td>
                    <td className="border border-border px-4 py-3">36-38</td>
                    <td className="border border-border px-4 py-3">27</td>
                    <td className="border border-border px-4 py-3">16</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-3 font-semibold">
                      M
                    </td>
                    <td className="border border-border px-4 py-3">38-40</td>
                    <td className="border border-border px-4 py-3">28</td>
                    <td className="border border-border px-4 py-3">17</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border border-border px-4 py-3 font-semibold">
                      L
                    </td>
                    <td className="border border-border px-4 py-3">40-42</td>
                    <td className="border border-border px-4 py-3">29</td>
                    <td className="border border-border px-4 py-3">18</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-3 font-semibold">
                      XL
                    </td>
                    <td className="border border-border px-4 py-3">42-44</td>
                    <td className="border border-border px-4 py-3">30</td>
                    <td className="border border-border px-4 py-3">19</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border border-border px-4 py-3 font-semibold">
                      XXL
                    </td>
                    <td className="border border-border px-4 py-3">44-46</td>
                    <td className="border border-border px-4 py-3">31</td>
                    <td className="border border-border px-4 py-3">20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <ReviewsSection productId={productId} />
        )}

        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Icon name="TruckIcon" size={24} className="text-primary mt-1" />
              <div>
                <h4 className="font-semibold mb-2">Standard Delivery</h4>
                <p className="text-foreground">
                  Delivered in 3-5 business days. Free delivery on orders above
                  ₹999.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Icon
                name="BoltIcon"
                size={24}
                className="text-accent mt-1"
              />
              <div>
                <h4 className="font-semibold mb-2">Express Delivery</h4>
                <p className="text-foreground">
                  Get it delivered within 24 hours. Additional charges apply.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Icon
                name="ArrowPathIcon"
                size={24}
                className="text-success mt-1"
              />
              <div>
                <h4 className="font-semibold mb-2">Easy Returns</h4>
                <p className="text-foreground">
                  7-day return and exchange policy. No questions asked.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}