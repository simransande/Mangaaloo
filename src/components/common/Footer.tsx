import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function Footer() {
  const shopLinks = [
    { id: 'footer_shop_new', label: 'New Arrivals', href: '/product-listing' },
    { id: 'footer_shop_men', label: 'Men', href: '/product-listing' },
    { id: 'footer_shop_women', label: 'Women', href: '/product-listing' },
    { id: 'footer_shop_sale', label: 'Sale', href: '/product-listing' },
  ];

  const supportLinks = [
    { id: 'footer_support_contact', label: 'Contact Us', href: '/homepage' },
    { id: 'footer_support_faq', label: 'FAQ', href: '/homepage' },
    { id: 'footer_support_shipping', label: 'Shipping Info', href: '/homepage' },
    { id: 'footer_support_returns', label: 'Returns', href: '/homepage' },
  ];

  const companyLinks = [
    { id: 'footer_company_about', label: 'About Us', href: '/homepage' },
    { id: 'footer_company_careers', label: 'Careers', href: '/homepage' },
    { id: 'footer_company_blog', label: 'Blog', href: '/homepage' },
  ];

  const legalLinks = [
    { id: 'footer_legal_privacy', label: 'Privacy Policy', href: '/homepage' },
    { id: 'footer_legal_terms', label: 'Terms of Service', href: '/homepage' },
  ];

  const socialLinks = [
    { id: 'social_instagram', icon: 'instagram', href: 'https://instagram.com', label: 'Instagram' },
    { id: 'social_youtube', icon: 'youtube', href: 'https://youtube.com', label: 'YouTube' },
    { id: 'social_twitter', icon: 'twitter', href: 'https://twitter.com', label: 'Twitter' },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Shop Links */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase mb-4">
              Shop
            </h3>
            <ul className="space-y-2">
              {shopLinks?.map((link) => (
                <li key={link?.id}>
                  <Link
                    href={link?.href}
                    className="text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors"
                  >
                    {link?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              {supportLinks?.map((link) => (
                <li key={link?.id}>
                  <Link
                    href={link?.href}
                    className="text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors"
                  >
                    {link?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              {companyLinks?.map((link) => (
                <li key={link?.id}>
                  <Link
                    href={link?.href}
                    className="text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors"
                  >
                    {link?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase mb-4">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li className="flex items-center space-x-2">
                <Icon name="PhoneIcon" size={16} />
                <span>9970522363</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="EnvelopeIcon" size={16} />
                <span>mangaaloo@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="MapPinIcon" size={16} />
                <span>Pune, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-secondary-foreground/20 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Social Links */}
          <div className="flex items-center space-x-4">
            {socialLinks?.map((social) => (
              <a
                key={social?.id}
                href={social?.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-secondary-foreground/10 hover:bg-secondary-foreground/20 rounded-full transition-colors"
                aria-label={social?.label}
              >
                <Icon name="GlobeAltIcon" size={18} />
              </a>
            ))}
          </div>

          {/* Legal Links */}
          <div className="flex items-center space-x-4 text-xs">
            {legalLinks?.map((link, index) => (
              <span key={link?.id} className="flex items-center">
                <Link
                  href={link?.href}
                  className="text-secondary-foreground/60 hover:text-secondary-foreground transition-colors"
                >
                  {link?.label}
                </Link>
                {index < legalLinks?.length - 1 && (
                  <span className="mx-2 text-secondary-foreground/40">·</span>
                )}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-xs text-secondary-foreground/60">
            © 2026 Mangaaloo. All rights reserved.
          </div>
        </div>

        {/* Payment Icons */}
        <div className="mt-6 flex justify-center items-center space-x-4 opacity-60">
          <span className="text-xs">We accept:</span>
          <div className="flex space-x-2">
            <div className="w-10 h-6 bg-secondary-foreground/20 rounded"></div>
            <div className="w-10 h-6 bg-secondary-foreground/20 rounded"></div>
            <div className="w-10 h-6 bg-secondary-foreground/20 rounded"></div>
            <div className="w-10 h-6 bg-secondary-foreground/20 rounded"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}