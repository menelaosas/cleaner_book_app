'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface Booking {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  cleaningType: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  address: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Stats {
  totalEarnings: number;
  completedJobs: number;
  upcomingJobs: number;
  rating: number;
  reviewCount: number;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function CleanerDashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalEarnings: 0,
    completedJobs: 0,
    upcomingJobs: 0,
    rating: 0,
    reviewCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && user.role !== 'CLEANER') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'CLEANER') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cleaners/me/bookings`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cleaners/me/stats`),
      ]);
      setBookings(bookingsRes.data.data || []);
      setStats(statsRes.data.data || stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Mock data for demo
      setBookings([
        {
          id: '1',
          scheduledDate: '2026-01-28',
          scheduledTime: '09:00',
          duration: 3,
          cleaningType: 'DEEP_CLEAN',
          status: 'CONFIRMED',
          totalAmount: 120,
          address: '123 Main St, Apt 4B',
          user: { firstName: 'John', lastName: 'Smith' },
        },
        {
          id: '2',
          scheduledDate: '2026-01-29',
          scheduledTime: '14:00',
          duration: 2,
          cleaningType: 'REGULAR',
          status: 'PENDING',
          totalAmount: 70,
          address: '456 Oak Ave',
          user: { firstName: 'Emily', lastName: 'Johnson' },
        },
      ]);
      setStats({
        totalEarnings: 2450,
        completedJobs: 34,
        upcomingJobs: 5,
        rating: 4.9,
        reviewCount: 28,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'start' | 'complete') => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/${action}`);
      fetchDashboardData();
    } catch (error) {
      console.error(`Failed to ${action} booking:`, error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'CLEANER') {
    return null;
  }

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const upcomingBookings = bookings.filter(b => ['CONFIRMED', 'IN_PROGRESS'].includes(b.status));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏡</span>
              <h1 className="text-xl font-bold">Serenity</h1>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                Cleaner
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/cleaner/setup" className="text-sm text-gray-600 hover:text-primary">
                Edit Profile
              </Link>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.firstName}! 👋</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here&apos;s an overview of your cleaning business
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold text-green-600">${stats.totalEarnings}</div>
            <div className="text-sm text-gray-500">Total Earnings</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
            <div className="text-sm text-gray-500">Completed Jobs</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-blue-600">{stats.upcomingJobs}</div>
            <div className="text-sm text-gray-500">Upcoming Jobs</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.rating}</div>
            <div className="text-sm text-gray-500">Average Rating</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-2xl font-bold">{stats.reviewCount}</div>
            <div className="text-sm text-gray-500">Reviews</div>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingBookings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-yellow-500">⚠️</span>
              Pending Requests ({pendingBookings.length})
            </h3>
            <div className="space-y-4">
              {pendingBookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-lg mb-1">
                        {booking.user.firstName} {booking.user.lastName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)} • {booking.duration}h
                      </div>
                      <div className="text-sm text-gray-500">{booking.address}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-4">
                        <div className="text-2xl font-bold text-primary">${booking.totalAmount}</div>
                      </div>
                      <button
                        onClick={() => handleBookingAction(booking.id, 'confirm')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Accept
                      </button>
                      <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Jobs */}
        <div>
          <h3 className="text-xl font-bold mb-4">Upcoming Jobs</h3>
          {upcomingBookings.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow border border-gray-200 dark:border-gray-700">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500">No upcoming jobs scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[booking.status]}`}>
                          {booking.status === 'IN_PROGRESS' ? 'In Progress' : 'Confirmed'}
                        </span>
                      </div>
                      <div className="font-bold text-lg mb-1">
                        {booking.user.firstName} {booking.user.lastName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)} • {booking.duration}h
                      </div>
                      <div className="text-sm text-gray-500">{booking.address}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-4">
                        <div className="text-2xl font-bold text-primary">${booking.totalAmount}</div>
                      </div>
                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleBookingAction(booking.id, 'start')}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
                        >
                          Start Job
                        </button>
                      )}
                      {booking.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleBookingAction(booking.id, 'complete')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
