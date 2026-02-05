import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Next.js with Tailwind CSS',
  description: 'A boilerplate project with Next.js and Tailwind CSS',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
  },
};

import { ToastProvider } from '@/lib/contexts/ToastContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GoogleAnalytics />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
