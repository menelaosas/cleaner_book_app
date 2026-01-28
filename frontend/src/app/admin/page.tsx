'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalCleaners: number;
    activeCleaners: number;
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalReviews: number;
    averageRating: number;
  };
  revenue: {
    total: number;
    platformFees: number;
  };
  growth: {
    usersThisMonth: number;
    usersLastMonth: number;
    userGrowth: number;
    bookingsThisMonth: number;
    bookingsLastMonth: number;
    bookingGrowth: number;
    bookingsThisWeek: number;
  };
  recent: {
    users: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      status: string;
      createdAt: string;
    }>;
    bookings: Array<{
      id: string;
      status: string;
      cleaningType: string;
      scheduledDate: string;
      totalPrice: number;
      user: { firstName: string; lastName: string };
      cleaner: { user: { firstName: string; lastName: string } };
    }>;
  };
  topCleaners: Array<{
    id: string;
    completedJobs: number;
    rating: number;
    user: { firstName: string; lastName: string; email: string };
  }>;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/stats/overview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error(t('admin', 'fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('admin', 'noData')}</p>
      </div>
    );
  }

  const statCards = [
    {
      title: t('admin', 'totalUsers'),
      value: stats.overview.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      growth: stats.growth.userGrowth,
      subtext: `${stats.growth.usersThisMonth} ${t('admin', 'thisMonth')}`,
    },
    {
      title: t('admin', 'totalCleaners'),
      value: stats.overview.totalCleaners,
      icon: Sparkles,
      color: 'bg-purple-500',
      subtext: `${stats.overview.activeCleaners} ${t('admin', 'active')}`,
    },
    {
      title: t('admin', 'totalBookings'),
      value: stats.overview.totalBookings,
      icon: Calendar,
      color: 'bg-green-500',
      growth: stats.growth.bookingGrowth,
      subtext: `${stats.growth.bookingsThisWeek} ${t('admin', 'thisWeek')}`,
    },
    {
      title: t('admin', 'totalRevenue'),
      value: formatCurrency(stats.revenue.total),
      icon: DollarSign,
      color: 'bg-yellow-500',
      subtext: `${formatCurrency(stats.revenue.platformFees)} ${t('admin', 'platformFees')}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('admin', 'dashboardTitle')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('admin', 'dashboardSubtitle')}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div
                className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              {stat.growth !== undefined && (
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stat.growth >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {stat.growth >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{Math.abs(stat.growth)}%</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.title}
              </p>
              {stat.subtext && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {stat.subtext}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Booking status overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.overview.pendingBookings}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('admin', 'pendingBookings')}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.overview.completedBookings}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('admin', 'completedBookings')}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.overview.cancelledBookings}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('admin', 'cancelledBookings')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('admin', 'platformRating')}
          </h2>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.overview.averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({stats.overview.totalReviews} {t('admin', 'reviews')})
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full"
            style={{ width: `${(stats.overview.averageRating / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin', 'recentUsers')}
            </h2>
            <Link
              href="/admin/users"
              className="text-primary text-sm flex items-center gap-1 hover:underline"
            >
              {t('admin', 'viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y dark:divide-gray-700">
            {stats.recent.users.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin', 'recentBookings')}
            </h2>
            <Link
              href="/admin/bookings"
              className="text-primary text-sm flex items-center gap-1 hover:underline"
            >
              {t('admin', 'viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y dark:divide-gray-700">
            {stats.recent.bookings.map((booking) => (
              <div key={booking.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {booking.user.firstName} {booking.user.lastName}
                  </p>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {booking.cleaningType.replace(/_/g, ' ')} - {booking.cleaner.user.firstName} {booking.cleaner.user.lastName}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(booking.totalPrice)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(booking.scheduledDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top cleaners */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('admin', 'topCleaners')}
          </h2>
          <Link
            href="/admin/cleaners"
            className="text-primary text-sm flex items-center gap-1 hover:underline"
          >
            {t('admin', 'viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin', 'cleaner')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin', 'completedJobs')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin', 'rating')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {stats.topCleaners.map((cleaner, index) => (
                <tr key={cleaner.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-400">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {cleaner.user.firstName} {cleaner.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {cleaner.user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {cleaner.completedJobs}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-gray-900 dark:text-white">
                        {cleaner.rating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
