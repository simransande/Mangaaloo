'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { authService } from '@/lib/supabase/services/auth';
import { funnelTracking } from '@/lib/analytics';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Track login form view
  useEffect(() => {
    funnelTracking.loginStart();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        if (redirect) {
          router.push(redirect);
        } else {
          router.push('/user-dashboard');
        }
      }
    };
    checkUser();
  }, [router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await authService.signIn(formData.email, formData.password);

      // Track successful login
      if (user) {
        funnelTracking.loginComplete(user.id);
      }

      // Redirect to intended page or homepage
      if (redirect) {
        router.push(redirect);
      } else {
        router.push('/homepage');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Login to your Mangaaloo account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <Icon name="ExclamationCircleIcon" size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center mb-2">
            <strong>Demo Credentials:</strong>
          </p>
          <div className="space-y-1 text-xs text-gray-600 text-center">
            <p><strong>Admin:</strong> admin@mangaaloo.com / Admin@123</p>
            <p><strong>Customer:</strong> customer@example.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}