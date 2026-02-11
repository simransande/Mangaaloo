import { Metadata } from 'next';
import { Suspense } from 'react';
import AdminLoginForm from './components/AdminLoginForm';

export const metadata: Metadata = {
  title: 'Admin Login - Mangaaloo',
  description: 'Admin dashboard login',
};

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
