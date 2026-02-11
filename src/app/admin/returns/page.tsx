import { Metadata } from 'next';
import AdminReturnsContent from './components/AdminReturnsContent';

export const metadata: Metadata = {
  title: 'Returns Management - Mangaaloo Admin',
  description: 'Manage customer return requests and refunds',
};

export default function AdminReturnsPage() {
  return <AdminReturnsContent />;
}
