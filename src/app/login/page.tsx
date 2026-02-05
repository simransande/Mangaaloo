import { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import LoginForm from './components/LoginForm';

export const metadata: Metadata = {
  title: 'Login | Mangaaloo',
  description: 'Login to your Mangaaloo account',
};

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <Suspense fallback={
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}