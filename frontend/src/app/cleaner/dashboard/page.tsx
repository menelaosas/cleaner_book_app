'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
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
  city?: string;
  user: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
  booking?: {
    cleaningType: string;
    scheduledDate: string;
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
  const { t } = useLanguage();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
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
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [bookingsRes, statsRes, reviewsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cleaners/me/stats`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reviews/my-reviews`, { headers }).catch(() => ({ data: { data: [] } })),
      ]);
      setBookings(bookingsRes.data.data || []);
      setStats(statsRes.data.data || stats);
      setReviews(reviewsRes.data.data || []);
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
          city: 'Athens',
          user: { firstName: 'John', lastName: 'Smith', phone: '+30 210 1234567' },
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
          city: 'Piraeus',
          user: { firstName: 'Emily', lastName: 'Johnson', phone: '+30 210 7654321' },
        },
        {
          id: '3',
          scheduledDate: '2026-01-25',
          scheduledTime: '10:00',
          duration: 4,
          cleaningType: 'DEEP_CLEAN',
          status: 'COMPLETED',
          totalAmount: 160,
          address: '789 Pine St',
          city: 'Glyfada',
          user: { firstName: 'Maria', lastName: 'Papadopoulos' },
        },
      ]);
      setStats({
        totalEarnings: 2450,
        completedJobs: 34,
        upcomingJobs: 5,
        rating: 4.9,
        reviewCount: 28,
      });
      setReviews([
        {
          id: '1',
          rating: 5,
          comment: 'Excellent work! Very thorough and professional.',
          createdAt: '2026-01-25T14:30:00Z',
          user: { firstName: 'Maria', lastName: 'Papadopoulos' },
          booking: { cleaningType: 'DEEP_CLEAN', scheduledDate: '2026-01-25' },
        },
        {
          id: '2',
          rating: 4,
          comment: 'Good cleaning, arrived on time.',
          createdAt: '2026-01-20T10:00:00Z',
          user: { firstName: 'Nikos', lastName: 'Georgiou' },
          booking: { cleaningType: 'REGULAR', scheduledDate: '2026-01-20' },
        },
      ]);
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

  const formatCleaningType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>{t('common', 'loading')}</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'CLEANER') {
    return null;
  }

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const upcomingBookings = bookings.filter(b => ['CONFIRMED', 'IN_PROGRESS'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏡</span>
              <h1 className="text-xl font-bold">{t('common', 'serenity')}</h1>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                {t('common', 'cleaner')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/cleaner/setup" className="text-sm text-gray-600 hover:text-primary">
                {t('cleanerDashboard', 'editProfile')}
              </Link>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                {t('common', 'logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{t('cleanerDashboard', 'welcomeBack')} {user.firstName}! 👋</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('cleanerDashboard', 'overview')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold text-green-600">${stats.totalEarnings}</div>
            <div className="text-sm text-gray-500">{t('cleanerDashboard', 'totalEarnings')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
            <div className="text-sm text-gray-500">{t('cleanerDashboard', 'completedJobs')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-blue-600">{stats.upcomingJobs}</div>
            <div className="text-sm text-gray-500">{t('cleanerDashboard', 'upcomingJobs')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.rating}</div>
            <div className="text-sm text-gray-500">{t('cleanerDashboard', 'averageRating')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-2xl font-bold">{stats.reviewCount}</div>
            <div className="text-sm text-gray-500">{t('cleanerDashboard', 'reviews')}</div>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingBookings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-yellow-500">⚠️</span>
              {t('cleanerDashboard', 'pendingRequests')} ({pendingBookings.length})
            </h3>
            <div className="space-y-4">
              {pendingBookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Left: Customer & Job Details */}
                    <div className="flex-1">
                      {/* Customer Name */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">👤</span>
                        <span className="font-bold text-xl text-gray-900 dark:text-white">
                          {booking.user.firstName} {booking.user.lastName}
                        </span>
                        {booking.user.phone && (
                          <span className="text-sm text-gray-500 ml-2">({booking.user.phone})</span>
                        )}
                      </div>

                      {/* Service Type */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🧹</span>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {formatCleaningType(booking.cleaningType)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">• {booking.duration} hours</span>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">📅</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatDate(booking.scheduledDate)}
                        </span>
                        <span className="text-gray-500">at</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatTime(booking.scheduledTime)}
                        </span>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-2">
                        <span className="text-lg">📍</span>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{booking.address}</span>
                          {booking.city && (
                            <span className="text-gray-500 ml-1">({booking.city})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Actions */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">You will earn</div>
                        <div className="text-3xl font-bold text-green-600">${(booking.totalAmount * 0.85).toFixed(0)}</div>
                        <div className="text-xs text-gray-400">(${booking.totalAmount} total - 15% fee)</div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleBookingAction(booking.id, 'confirm')}
                          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg shadow-lg shadow-green-200"
                        >
                          ✓ {t('cleanerDashboard', 'accept')}
                        </button>
                        <button className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-medium">
                          ✕ {t('cleanerDashboard', 'decline')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Jobs */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">{t('cleanerDashboard', 'upcomingJobsTitle')}</h3>
          {upcomingBookings.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow border border-gray-200 dark:border-gray-700">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500">{t('cleanerDashboard', 'noUpcomingJobs')}</p>
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
                          {booking.status === 'IN_PROGRESS' ? t('cleanerDashboard', 'inProgress') : t('cleanerDashboard', 'confirmed')}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                          {formatCleaningType(booking.cleaningType)}
                        </span>
                      </div>
                      <div className="font-bold text-lg mb-1">
                        {booking.user.firstName} {booking.user.lastName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        📅 {formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)} • {booking.duration}h
                      </div>
                      <div className="text-sm text-gray-500">📍 {booking.address}</div>
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
                          {t('cleanerDashboard', 'startJob')}
                        </button>
                      )}
                      {booking.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleBookingAction(booking.id, 'complete')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                        >
                          {t('cleanerDashboard', 'complete')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Jobs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="text-green-500">✅</span>
              {t('cleanerDashboard', 'completedJobs')}
            </h3>
            <Link href="/cleaner/earnings" className="text-primary hover:underline text-sm font-medium">
              View all →
            </Link>
          </div>
          {completedBookings.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-gray-500">No completed jobs yet. Your first job awaits!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedBookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                      {formatCleaningType(booking.cleaningType)}
                    </span>
                    <span className="font-bold text-green-600">${(booking.totalAmount * 0.85).toFixed(0)}</span>
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {booking.user.firstName} {booking.user.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(booking.scheduledDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-yellow-500">⭐</span>
            {t('cleanerDashboard', 'reviews')}
          </h3>
          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-gray-500">No reviews yet. Complete jobs to receive feedback from customers!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 5).map(review => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {review.user.firstName[0]}{review.user.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            {review.user.firstName} {review.user.lastName}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            {renderStars(review.rating)}
                            <span className="ml-1 text-gray-500">({review.rating}/5)</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{review.comment}</p>
                      <div className="text-xs text-gray-400">
                        {review.booking && (
                          <span className="mr-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                            {formatCleaningType(review.booking.cleaningType)}
                          </span>
                        )}
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
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
