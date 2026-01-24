'use client';

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-display overflow-x-hidden antialiased">
      <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center px-4 py-4 justify-between border-b border-gray-100 dark:border-gray-700">
          <Link href="/" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span className="text-2xl">←</span>
          </Link>
          <div className="flex-1"></div>
          <Link href="/register" className="text-sm font-medium text-primary hover:text-primary/80">
            Sign up
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {/* Logo/Hero */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <span className="text-4xl">🏡</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to your Serenity account
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email Address
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-12 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-base"
                  id="email"
                  name="email"
                  placeholder="jane@example.com"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium" htmlFor="password">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-12 px-4 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary text-base"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary/20"
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label className="ml-2 text-sm text-gray-600 dark:text-gray-400" htmlFor="rememberMe">
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 rounded-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Social Login Divider */}
            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button className="flex items-center justify-center h-11 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                <span className="text-lg mr-2">G</span>
                <span className="text-sm font-medium">Google</span>
              </button>
              <button className="flex items-center justify-center h-11 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                <span className="text-lg mr-2">🍎</span>
                <span className="text-sm font-medium">Apple</span>
              </button>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
