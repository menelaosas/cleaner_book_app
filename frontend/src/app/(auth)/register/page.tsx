'use client';

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'USER' as 'USER' | 'CLEANER',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
      <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-4 py-4 justify-between border-b border-gray-100 dark:border-gray-700">
          <Link href="/" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span className="text-2xl">←</span>
          </Link>
          <div className="flex-1"></div>
          <Link href="/login" className="text-sm font-medium text-primary hover:text-primary/80">
            Log in
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {/* Hero Section */}
          <div className="pt-6 pb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <span className="text-3xl">🏡</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight mb-2">
              Welcome to Serenity
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Create an account to book trusted cleaners in minutes.
            </p>
          </div>

          {/* Verification Notice */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex gap-3 items-start">
            <span className="text-xl mt-0.5 shrink-0">📧</span>
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-medium block mb-1">Email Verification Required</span>
              We'll send a secure link to verify your email address.
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name Row */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium" htmlFor="firstName">
                  First Name
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-11 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary text-base"
                  id="firstName"
                  name="firstName"
                  placeholder="Jane"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-11 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary text-base"
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="email">
                Email Address
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-11 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary text-base"
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

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <span className="text-xs text-gray-500">Min. 8 characters</span>
              </div>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-11 px-3 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary text-base"
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
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

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">I want to:</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'USER' }))}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    formData.role === 'USER'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                  }`}
                  disabled={loading}
                >
                  <div className="text-2xl mb-1">🏠</div>
                  <div className="text-sm font-semibold">Find Cleaners</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'CLEANER' }))}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    formData.role === 'CLEANER'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                  }`}
                  disabled={loading}
                >
                  <div className="text-2xl mb-1">🧹</div>
                  <div className="text-sm font-semibold">Become a Cleaner</div>
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start pt-2">
              <input
                className="w-5 h-5 mt-0.5 border-gray-300 rounded text-primary focus:ring-primary/20"
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                disabled={loading}
              />
              <label className="ml-3 text-sm text-gray-600 dark:text-gray-400" htmlFor="agreeToTerms">
                I agree to the{' '}
                <a className="font-medium text-primary hover:underline" href="#">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a className="font-medium text-primary hover:underline" href="#">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 rounded-lg shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Get Started →'}
              </button>
            </div>
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
          <div className="text-center pb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
