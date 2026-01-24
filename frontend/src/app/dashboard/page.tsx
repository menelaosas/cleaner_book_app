'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏡</span>
              <h1 className="text-xl font-bold">Serenity</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ready to book a cleaner or manage your appointments?
          </p>
        </div>

        {/* Email Verification Alert */}
        {!user.emailVerified && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100">Email Not Verified</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Please check your email to verify your account.
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/cleaners"
            className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-bold mb-2">Find Cleaners</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse and book verified cleaners in your area
            </p>
          </Link>

          <Link
            href="/bookings"
            className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-lg font-bold mb-2">My Bookings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage your cleaning appointments
            </p>
          </Link>

          <Link
            href="/profile"
            className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="text-lg font-bold mb-2">Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Update your profile and preferences
            </p>
          </Link>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4">Recent Bookings</h3>
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">📋</p>
            <p>No bookings yet</p>
            <p className="text-sm mt-2">Book your first cleaning service to get started!</p>
          </div>
        </div>
      </main>
    </div>
  );
}
