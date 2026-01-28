'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Home, DollarSign, CheckCircle, Star, FileText, ClipboardList } from 'lucide-react';
import { Card, LoadingSpinner, EmptyState } from '../../../components/ui';

interface Stats {
  totalBookings: number;
  completedBookings: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  pendingBookings: number;
  upcomingBookings: number;
}

interface CompletedBooking {
  id: string;
  scheduledDate: string;
  cleaningType: string;
  totalAmount: number;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function CleanerEarningsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'CLEANER') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'CLEANER') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const [statsRes, bookingsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cleaners/me/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bookings?status=COMPLETED`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStats(statsRes.data.data);
      setCompletedBookings(bookingsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCleaningType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCleanerEarnings = (total: number) => {
    return total * 0.85;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="xl" text={t('common', 'loading')} />
      </div>
    );
  }

  if (!user || user.role !== 'CLEANER') {
    return null;
  }

  const totalEarnings = completedBookings.reduce((sum, b) => sum + getCleanerEarnings(b.totalAmount), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Home className="w-7 h-7 text-primary" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">{t('common', 'serenity')}</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/cleaner/bookings" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
                {t('common', 'bookings')}
              </Link>
              <Link href="/dashboard" className="text-sm text-primary hover:underline font-medium">
                {t('common', 'dashboard')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">{t('cleanerEarnings', 'title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('cleanerEarnings', 'subtitle')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('cleanerEarnings', 'totalEarnings')}</p>
                <p className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          {/* Completed Jobs */}
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('cleanerEarnings', 'completedJobs')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.completedBookings || 0}</p>
              </div>
            </div>
          </Card>

          {/* Average Rating */}
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('cleanerEarnings', 'averageRating')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          {/* Total Reviews */}
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('cleanerEarnings', 'totalReviews')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalReviews || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Earnings Breakdown */}
        <Card padding="md" className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('cleanerEarnings', 'earningsBreakdown')}</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">{t('cleanerEarnings', 'grossRevenue')}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${completedBookings.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">{t('cleanerEarnings', 'platformFee')}</span>
              <span className="font-medium text-red-500">
                -${(completedBookings.reduce((sum, b) => sum + b.totalAmount, 0) * 0.15).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-bold text-gray-900 dark:text-white">{t('cleanerEarnings', 'yourEarnings')}</span>
              <span className="font-bold text-green-600 text-xl">${totalEarnings.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Recent Completed Jobs */}
        <Card padding="md">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('cleanerEarnings', 'recentCompletedJobs')}</h2>
          {completedBookings.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-8 h-8 text-gray-400" />}
              title={t('cleanerEarnings', 'noCompletedJobs')}
              description={t('cleanerEarnings', 'completeFirstJob')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('cleanerEarnings', 'dateColumn')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('cleanerEarnings', 'customerColumn')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('cleanerEarnings', 'serviceColumn')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('cleanerEarnings', 'amountColumn')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('cleanerEarnings', 'yourEarningsColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {completedBookings.slice(0, 10).map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{formatDate(booking.scheduledDate)}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{booking.user.firstName} {booking.user.lastName}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{formatCleaningType(booking.cleaningType)}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">${booking.totalAmount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">
                        ${getCleanerEarnings(booking.totalAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
