'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Home, Search, Sparkles, Mail, ArrowRight } from 'lucide-react';
import { Button, Input, Alert } from '../../../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const roleParam = searchParams.get('role');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'USER' as 'USER' | 'CLEANER',
    agreeToTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (roleParam === 'cleaner') {
      setFormData(prev => ({ ...prev, role: 'CLEANER' }));
    }
  }, [roleParam]);

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
      }, redirectTo || undefined);
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
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <div className="flex-1"></div>
          <Link href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'} className="text-sm font-medium text-primary hover:text-primary/80">
            Log in
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {/* Hero Section */}
          <div className="pt-6 pb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold leading-tight mb-2 text-gray-900 dark:text-white">
              Welcome to Serenity
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Create an account to book trusted cleaners in minutes.
            </p>
          </div>

          {/* Verification Notice */}
          <Alert variant="info" title="Email Verification Required" className="mb-6">
            We&apos;ll send a secure link to verify your email address.
          </Alert>

          {/* Error Message */}
          {error && (
            <div className="mb-6">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name Row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="First Name"
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
              <div className="flex-1">
                <Input
                  label="Last Name"
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
            <Input
              label="Email Address"
              id="email"
              name="email"
              placeholder="jane@example.com"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                  Password
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">Min. 8 characters</span>
              </div>
              <Input
                id="password"
                name="password"
                placeholder="Create a password"
                type="password"
                showPasswordToggle
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">I want to:</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'USER' }))}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    formData.role === 'USER'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                  }`}
                  disabled={loading}
                >
                  <Search className="w-6 h-6 mx-auto mb-1 text-gray-700 dark:text-gray-300" />
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Find Cleaners</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'CLEANER' }))}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    formData.role === 'CLEANER'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                  }`}
                  disabled={loading}
                >
                  <Sparkles className="w-6 h-6 mx-auto mb-1 text-gray-700 dark:text-gray-300" />
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Become a Cleaner</div>
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
              <Button
                type="submit"
                fullWidth
                loading={loading}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Get Started
              </Button>
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
            <Button variant="outline" size="md">
              <span className="text-lg mr-2 font-semibold">G</span>
              Google
            </Button>
            <Button variant="outline" size="md">
              <span className="text-lg mr-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </span>
              Apple
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center pb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'} className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
