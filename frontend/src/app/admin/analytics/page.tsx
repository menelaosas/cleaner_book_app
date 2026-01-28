'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  Star,
  Clock,
  TrendingUp,
  PieChart,
  BarChart3,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../contexts/LanguageContext';

interface AnalyticsData {
  registrations: Array<{
    date: string;
    users: number;
    cleaners: number;
  }>;
  bookings: Array<{
    date: string;
    total: number;
    completed: number;
    cancelled: number;
  }>;
  ratings: Array<{
    date: string;
    average: number;
    count: number;
  }>;
  distributions: {
    bookingsByType: Array<{
      cleaningType: string;
      _count: number;
    }>;
    bookingsByStatus: Array<{
      status: string;
      _count: number;
    }>;
    usersByStatus: Array<{
      status: string;
      _count: number;
    }>;
    hourDistribution: Array<{
      hour: number;
      count: number;
    }>;
  };
}

export default function AdminAnalytics() {
  const { t } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/stats/analytics?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(t('admin', 'fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      CONFIRMED: 'bg-blue-500',
      IN_PROGRESS: 'bg-purple-500',
      AWAITING_CONFIRMATION: 'bg-orange-500',
      COMPLETED: 'bg-green-500',
      CANCELLED: 'bg-red-500',
      REFUNDED: 'bg-gray-500',
      ACTIVE: 'bg-green-500',
      INACTIVE: 'bg-gray-500',
      SUSPENDED: 'bg-red-500',
      PENDING_VERIFICATION: 'bg-yellow-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getTypeColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('admin', 'noData')}</p>
      </div>
    );
  }

  // Calculate totals for pie charts
  const totalBookingsByStatus = data.distributions.bookingsByStatus.reduce((acc, b) => acc + b._count, 0);
  const totalBookingsByType = data.distributions.bookingsByType.reduce((acc, b) => acc + b._count, 0);
  const totalUsersByStatus = data.distributions.usersByStatus.reduce((acc, u) => acc + u._count, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin', 'analyticsTitle')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('admin', 'analyticsDesc')}
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary"
        >
          <option value="7">{t('admin', 'last7Days')}</option>
          <option value="30">{t('admin', 'last30Days')}</option>
          <option value="90">{t('admin', 'last90Days')}</option>
          <option value="365">{t('admin', 'lastYear')}</option>
        </select>
      </div>

      {/* User registrations chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('admin', 'userRegistrations')}
          </h2>
        </div>
        <div className="h-48 flex items-end gap-1">
          {data.registrations.map((day, index) => {
            const maxReg = Math.max(...data.registrations.map((d) => d.users + d.cleaners), 1);
            const total = day.users + day.cleaners;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div className="w-full flex flex-col">
                  <div
                    className="w-full bg-purple-400 rounded-t"
                    style={{ height: `${(day.cleaners / maxReg) * 100}%`, minHeight: day.cleaners > 0 ? '2px' : '0' }}
                  />
                  <div
                    className="w-full bg-blue-400"
                    style={{ height: `${(day.users / maxReg) * 100}%`, minHeight: day.users > 0 ? '2px' : '0' }}
                  />
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                    <p className="font-medium">{formatDate(day.date)}</p>
                    <p className="text-blue-300">{t('admin', 'users')}: {day.users}</p>
                    <p className="text-purple-300">{t('admin', 'cleaners')}: {day.cleaners}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin', 'users')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-400 rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin', 'cleaners')}</span>
          </div>
        </div>
      </div>

      {/* Bookings over time */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('admin', 'bookingsTrend')}
          </h2>
        </div>
        <div className="h-48 flex items-end gap-1">
          {data.bookings.map((day, index) => {
            const maxBookings = Math.max(...data.bookings.map((d) => d.total), 1);
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div className="w-full flex flex-col">
                  <div
                    className="w-full bg-red-400 rounded-t"
                    style={{ height: `${(day.cancelled / maxBookings) * 100}%`, minHeight: day.cancelled > 0 ? '2px' : '0' }}
                  />
                  <div
                    className="w-full bg-green-400"
                    style={{ height: `${(day.completed / maxBookings) * 100}%`, minHeight: day.completed > 0 ? '2px' : '0' }}
                  />
                  <div
                    className="w-full bg-blue-400"
                    style={{ height: `${((day.total - day.completed - day.cancelled) / maxBookings) * 100}%`, minHeight: (day.total - day.completed - day.cancelled) > 0 ? '2px' : '0' }}
                  />
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                    <p className="font-medium">{formatDate(day.date)}</p>
                    <p>{t('admin', 'total')}: {day.total}</p>
                    <p className="text-green-300">{t('admin', 'completed')}: {day.completed}</p>
                    <p className="text-red-300">{t('admin', 'cancelled')}: {day.cancelled}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin', 'pending')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin', 'completed')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin', 'cancelled')}</span>
          </div>
        </div>
      </div>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin', 'bookingsByStatus')}
            </h2>
          </div>
          <div className="space-y-3">
            {data.distributions.bookingsByStatus.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item._count} ({totalBookingsByStatus > 0 ? Math.round((item._count / totalBookingsByStatus) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${getStatusColor(item.status)} h-2 rounded-full`}
                    style={{ width: `${totalBookingsByStatus > 0 ? (item._count / totalBookingsByStatus) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings by type */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin', 'bookingsByType')}
            </h2>
          </div>
          <div className="space-y-3">
            {data.distributions.bookingsByType.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.cleaningType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item._count} ({totalBookingsByType > 0 ? Math.round((item._count / totalBookingsByType) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${getTypeColor(index)} h-2 rounded-full`}
                    style={{ width: `${totalBookingsByType > 0 ? (item._count / totalBookingsByType) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular booking hours */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('admin', 'popularBookingHours')}
          </h2>
        </div>
        <div className="h-48 flex items-end gap-1">
          {Array.from({ length: 24 }, (_, hour) => {
            const hourData = data.distributions.hourDistribution.find((h) => h.hour === hour);
            const count = hourData?.count || 0;
            const maxCount = Math.max(...data.distributions.hourDistribution.map((h) => h.count), 1);
            return (
              <div
                key={hour}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div
                  className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer"
                  style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    {hour}:00 - {count} {t('admin', 'bookings')}
                  </div>
                </div>
                {/* X-axis label */}
                {hour % 4 === 0 && (
                  <span className="text-xs text-gray-400 mt-2">{hour}:00</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ratings trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('admin', 'ratingsTrend')}
          </h2>
        </div>
        {data.ratings.length > 0 ? (
          <div className="h-48 flex items-end gap-1">
            {data.ratings.map((day, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div
                  className="w-full bg-yellow-400 rounded-t transition-all cursor-pointer"
                  style={{ height: `${(day.average / 5) * 100}%`, minHeight: day.average > 0 ? '4px' : '0' }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                    <p className="font-medium">{formatDate(day.date)}</p>
                    <p>{t('admin', 'avgRating')}: {day.average}/5</p>
                    <p>{t('admin', 'reviews')}: {day.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {t('admin', 'noRatingsData')}
          </p>
        )}
      </div>

      {/* Users by status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('admin', 'usersByStatus')}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.distributions.usersByStatus.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center"
            >
              <div
                className={`w-4 h-4 rounded-full ${getStatusColor(item.status)} mx-auto mb-2`}
              />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {item._count}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {item.status.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-gray-400">
                {totalUsersByStatus > 0 ? Math.round((item._count / totalUsersByStatus) * 100) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
