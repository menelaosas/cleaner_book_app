'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Home, Calendar, DollarSign, MessageSquare, Play, CheckCircle, XCircle } from 'lucide-react';
import { Card, Badge, StatusBadge, Button, LoadingSpinner, EmptyState } from '../../../components/ui';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Booking {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  cleaningType: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  address: string;
  city: string;
  state: string;
  instructions?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
}

export default function CleanerBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'CLEANER') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'CLEANER') {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (bookingId: string, action: 'confirm' | 'decline' | 'start' | 'complete') => {
    setActionLoading(bookingId);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Booking ${action === 'confirm' ? 'confirmed' : action === 'decline' ? 'declined' : action === 'start' ? 'started' : 'completed'} successfully`);
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} booking`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'pending') return booking.status === 'PENDING';
    if (filter === 'upcoming') return ['CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION'].includes(booking.status);
    if (filter === 'completed') return booking.status === 'COMPLETED';
    return booking.status === filter;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
              <Link href="/cleaner/earnings" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
                {t('common', 'earnings')}
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
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">{t('cleanerBookings', 'title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('cleanerBookings', 'subtitle')}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: t('cleanerBookings', 'all') },
            { value: 'pending', label: t('cleanerBookings', 'pendingRequests') },
            { value: 'upcoming', label: t('cleanerBookings', 'upcoming') },
            { value: 'completed', label: t('cleanerBookings', 'completed') },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                filter === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {tab.label}
              {tab.value === 'pending' && bookings.filter(b => b.status === 'PENDING').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {bookings.filter(b => b.status === 'PENDING').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon={<Calendar className="w-8 h-8 text-gray-400" />}
              title={t('cleanerBookings', 'noBookingsFound')}
              description={
                filter === 'pending'
                  ? t('cleanerBookings', 'noPendingRequests')
                  : filter === 'upcoming'
                  ? t('cleanerBookings', 'noUpcomingBookings')
                  : t('cleanerBookings', 'noBookingsYet')
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <Card key={booking.id} padding="md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusBadge status={booking.status} />
                      <Badge variant="default">{formatCleaningType(booking.cleaningType)}</Badge>
                    </div>
                    <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">
                      {formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {booking.address}, {booking.city}, {booking.state}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('cleanerBookings', 'customerLabel')}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {booking.user.firstName} {booking.user.lastName}
                      </span>
                      {booking.user.phone && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          • {booking.user.phone}
                        </span>
                      )}
                    </div>
                    {booking.instructions && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                        <span className="font-medium">{t('cleanerBookings', 'instructionsLabel')}</span> {booking.instructions}
                      </p>
                    )}
                  </div>

                  {/* Right: Price and Actions */}
                  <div className="text-right lg:min-w-[200px]">
                    <div className="text-2xl font-bold text-primary mb-2">
                      ${booking.totalAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {booking.duration} {t('common', 'hours')}
                    </div>

                    {/* Action Buttons */}
                    {booking.status === 'PENDING' && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(booking.id, 'decline')}
                          disabled={actionLoading === booking.id}
                          leftIcon={<XCircle className="w-4 h-4" />}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          {t('common', 'decline')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(booking.id, 'confirm')}
                          loading={actionLoading === booking.id}
                          leftIcon={<CheckCircle className="w-4 h-4" />}
                        >
                          {t('common', 'accept')}
                        </Button>
                      </div>
                    )}

                    {booking.status === 'CONFIRMED' && (
                      <div className="flex gap-2 justify-end">
                        <Link href={`/messages/${booking.id}`}>
                          <Button variant="outline" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                            {t('common', 'message')}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleAction(booking.id, 'start')}
                          loading={actionLoading === booking.id}
                          leftIcon={<Play className="w-4 h-4" />}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {t('cleanerBookings', 'startJob')}
                        </Button>
                      </div>
                    )}

                    {booking.status === 'IN_PROGRESS' && (
                      <div className="flex gap-2 justify-end">
                        <Link href={`/messages/${booking.id}`}>
                          <Button variant="outline" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                            {t('common', 'message')}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleAction(booking.id, 'complete')}
                          loading={actionLoading === booking.id}
                          leftIcon={<CheckCircle className="w-4 h-4" />}
                        >
                          {t('cleanerBookings', 'completeJob')}
                        </Button>
                      </div>
                    )}

                    {booking.status === 'AWAITING_CONFIRMATION' && (
                      <Badge variant="warning">{t('cleanerBookings', 'awaitingCustomerConfirmation')}</Badge>
                    )}

                    {booking.status === 'COMPLETED' && (
                      <Badge variant="success">{t('cleanerBookings', 'completed')}</Badge>
                    )}

                    {booking.status === 'CANCELLED' && (
                      <Badge variant="error">{t('statusLabels', 'CANCELLED')}</Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
