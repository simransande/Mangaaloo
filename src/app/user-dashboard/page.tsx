import { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import DashboardContent from './components/DashboardContent';

export const metadata: Metadata = {
  title: 'My Dashboard - Mangaaloo',
  description: 'Manage your account and orders',
};

export default function UserDashboardPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-gray-50">
        <DashboardContent />
      </main>
      <Footer />
    </>
  );
}