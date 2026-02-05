import { Metadata } from 'next';
import AdminLoginForm from './components/AdminLoginForm';

export const metadata: Metadata = {
  title: 'Admin Login - Mangaaloo',
  description: 'Admin dashboard login',
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}