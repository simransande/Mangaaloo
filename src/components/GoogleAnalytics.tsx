'use client';
import { Suspense } from 'react';
import { useGoogleAnalytics } from '@/lib/analytics';

function GoogleAnalyticsInner() {
  useGoogleAnalytics();
  return null;
}

export default function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  );
}
