'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../contexts/LanguageContext';

interface RevenueData {
  dailyRevenue: Array<{
    date: string;
    total: number;
    fees: number;
    payouts: number;
    count: number;
  }>;
  revenueByType: Array<{
    cleaningType: string;
    _sum: { totalPrice: number | null };
    _count: number;
  }>;
  periodStats: {
    totalRevenue: number;
    platformFees: number;
    cleanerPayouts: number;
    averageBookingValue: number;
    totalTransactions: number;
  };
}

export default function AdminRevenue() {
  const { t } = useLanguage();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/stats/revenue?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
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
    });
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

  const statCards = [
    {
      title: t('admin', 'totalRevenue'),
      value: formatCurrency(data.periodStats.totalRevenue),
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+12.5%',
      positive: true,
    },
    {
      title: t('admin', 'platformFees'),
      value: formatCurrency(data.periodStats.platformFees),
      icon: PiggyBank,
      color: 'bg-blue-500',
      subtext: t('admin', 'yourEarnings'),
    },
    {
      title: t('admin', 'cleanerPayouts'),
      value: formatCurrency(data.periodStats.cleanerPayouts),
      icon: CreditCard,
      color: 'bg-purple-500',
      subtext: t('admin', 'paidToCleaners'),
    },
    {
      title: t('admin', 'avgBookingValue'),
      value: formatCurrency(data.periodStats.averageBookingValue),
      icon: TrendingUp,
      color: 'bg-yellow-500',
      subtext: `${data.periodStats.totalTransactions} ${t('admin', 'transactions')}`,
    },
  ];

  // Calculate max for chart scaling
  const maxRevenue = Math.max(...data.dailyRevenue.map((d) => d.total), 1);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin', 'revenueOverview')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('admin', 'revenueOverviewDesc')}
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

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              {stat.change && (
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stat.positive ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {stat.positive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              )}
            </div>
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
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t('admin', 'dailyRevenue')}
        </h2>
        <div className="h-64 flex items-end gap-1">
          {data.dailyRevenue.map((day, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center group relative"
            >
              <div
                className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer"
                style={{
                  height: `${(day.total / maxRevenue) * 100}%`,
                  minHeight: day.total > 0 ? '4px' : '0',
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                  <p className="font-medium">{formatDate(day.date)}</p>
                  <p>{t('admin', 'revenue')}: {formatCurrency(day.total)}</p>
                  <p>{t('admin', 'fees')}: {formatCurrency(day.fees)}</p>
                  <p>{t('admin', 'bookings')}: {day.count}</p>
                </div>
              </div>
              {/* X-axis label (show every 5th label for readability) */}
              {(index % Math.ceil(data.dailyRevenue.length / 10) === 0 || index === data.dailyRevenue.length - 1) && (
                <span className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-top-left">
                  {formatDate(day.date)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by type */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t('admin', 'revenueByService')}
        </h2>
        <div className="space-y-4">
          {data.revenueByType.map((type, index) => {
            const total = type._sum.totalPrice || 0;
            const maxTotal = Math.max(...data.revenueByType.map((t) => t._sum.totalPrice || 0), 1);
            const percentage = (total / maxTotal) * 100;

            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 dark:text-gray-300">
                    {type.cleaningType.replace(/_/g, ' ')}
                  </span>
                  <div className="text-right">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(total)}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({type._count} {t('admin', 'bookings')})
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}

          {data.revenueByType.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('admin', 'noRevenueData')}
            </p>
          )}
        </div>
      </div>

      {/* Daily breakdown table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('admin', 'dailyBreakdown')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin', 'date')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin', 'bookings')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin', 'revenue')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin', 'platformFees')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin', 'payouts')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {data.dailyRevenue.slice().reverse().slice(0, 14).map((day, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {formatDate(day.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700 dark:text-gray-300">
                    {day.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(day.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 dark:text-green-400">
                    {formatCurrency(day.fees)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(day.payouts)}
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
