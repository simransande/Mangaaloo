'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { authService } from '@/lib/supabase/services/auth';

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams?.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    errorParam === 'access_denied' ? 'Access denied. Admin privileges required.' : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting admin login with:', email);

      // Sign in
      const { user: signInUser, session } = await authService.signIn(email, password);
      console.log('Sign in successful:', { userId: signInUser?.id, hasSession: !!session });

      if (!signInUser || !session) {
        console.error('No user or session returned from signIn');
        setError('Authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      // Check if user is admin before redirecting
      try {
        const isAdmin = await authService.isAdmin(signInUser.id);
        console.log('Admin check result:', isAdmin);

        if (!isAdmin) {
          console.warn('User is not an admin:', signInUser.email);
          await authService.signOut();
          setError('Access denied. Admin privileges required.');
          setLoading(false);
          return;
        }
      } catch (adminCheckError: any) {
        console.error('Admin check error:', adminCheckError);
        await authService.signOut();
        setError('Unable to verify admin status. Please contact support.');
        setLoading(false);
        return;
      }

      console.log('Admin login successful, redirecting to dashboard');
      // Redirect to dashboard - middleware will verify session
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      console.error('Admin login error:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        name: err.name,
      });

      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please confirm your email address before logging in.');
      } else if (err.message?.includes('User not found')) {
        setError('Admin account not found. Please contact support.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Icon name="ShieldCheckIcon" size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Sign in to access the admin dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <Icon
                  name="ExclamationCircleIcon"
                  size={20}
                  className="mr-2 mt-0.5 flex-shrink-0"
                />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Demo Credentials */}
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Demo Admin Credentials:</p>
              <p className="text-xs">Email: admin@mangaaloo.com</p>
              <p className="text-xs">Password: Admin@123</p>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="EnvelopeIcon" size={20} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="admin@mangaaloo.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="LockClosedIcon" size={20} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <Icon
                    name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'}
                    size={20}
                    className="text-gray-400 hover:text-gray-600"
                  />
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Icon name="ArrowPathIcon" size={20} className="animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <Icon name="ArrowRightIcon" size={20} className="mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Back to Store */}
          <div className="mt-6 text-center">
            <Link
              href="/homepage"
              className="text-sm text-gray-600 hover:text-primary transition-colors inline-flex items-center"
            >
              <Icon name="ArrowLeftIcon" size={16} className="mr-1" />
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
