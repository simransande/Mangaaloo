import { Metadata } from 'next';
import AdminDashboardContent from './components/AdminDashboardContent';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Mangaaloo',
  description: 'Manage your Mangaaloo store',
};

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}
