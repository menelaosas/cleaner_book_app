'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Home, Calendar, MessageSquare, XCircle, Star, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, Badge, StatusBadge, Button, LoadingSpinner, EmptyState } from '../../components/ui';
import { useSocket } from '../../contexts/SocketContext';

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
  cleaner: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export default function BookingsPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { socket } = useSocket();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.connect();
    socket.emit('join', user.id);

    socket.on('booking-status-changed', (data: { bookingId: string; status: string; notification: { title: string; message: string } }) => {
      if (data.status === 'AWAITING_CONFIRMATION') {
        toast(data.notification.message, { icon: '🔔', duration: 6000 });
      }
      fetchBookings();
    });

    return () => {
      socket.off('booking-status-changed');
    };
  }, [socket, user]);

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

  const handleCancel = async (bookingId: string) => {
    if (!confirm(t('bookings', 'cancelBooking'))) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/cancel`,
        { reason: 'Cancelled by customer' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t('bookings', 'cancelSuccess'));
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleConfirmCompletion = async (bookingId: string) => {
    if (!confirm(t('bookings', 'confirmCompletionPrompt'))) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/confirm-completion`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t('bookings', 'completionSuccess'));
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to confirm completion');
    }
  };

  const handleDispute = async (bookingId: string) => {
    const reason = prompt(t('bookings', 'disputePrompt'));
    if (reason === null) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/dispute`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t('bookings', 'disputeSuccess'));
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit dispute');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION'].includes(booking.status);
    if (filter === 'past') return ['COMPLETED', 'CANCELLED'].includes(booking.status);
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

  if (!user) {
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
            <Link href="/dashboard" className="text-sm text-primary hover:underline font-medium">
              {t('common', 'backToDashboard')}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">{t('bookings', 'title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('bookings', 'subtitle')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: t('bookings', 'all') },
            { value: 'upcoming', label: t('bookings', 'upcoming') },
            { value: 'past', label: t('bookings', 'past') },
            { value: 'PENDING', label: t('bookings', 'pending') },
            { value: 'CONFIRMED', label: t('bookings', 'confirmed') },
            { value: 'COMPLETED', label: t('bookings', 'completed') },
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
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon={<Calendar className="w-8 h-8 text-gray-400" />}
              title={t('bookings', 'noBookingsFound')}
              description={
                filter === 'all'
                  ? t('bookings', 'noBookingsYet')
                  : `No ${filter.toLowerCase()} bookings`
              }
              action={{
                label: t('common', 'findACleaner'),
                onClick: () => router.push('/cleaners'),
              }}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <Card key={booking.id} padding="md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('bookings', 'cleanerLabel')}</span>
                      <Link
                        href={`/cleaners/${booking.cleaner.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {booking.cleaner.firstName} {booking.cleaner.lastName}
                      </Link>
                    </p>
                  </div>

                  {/* Right: Price and Actions */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary mb-2">
                      ${booking.totalAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {booking.duration} {t('common', 'hours')}
                    </div>
                    {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                      <div className="flex gap-2 justify-end">
                        <Link href={`/messages/${booking.id}`}>
                          <Button variant="outline" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                            {t('common', 'message')}
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(booking.id)}
                          leftIcon={<XCircle className="w-4 h-4" />}
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {t('common', 'cancel')}
                        </Button>
                      </div>
                    )}
                    {booking.status === 'COMPLETED' && (
                      <Link href={`/bookings/${booking.id}/review`}>
                        <Button size="sm" leftIcon={<Star className="w-4 h-4" />}>
                          {t('bookings', 'leaveReview')}
                        </Button>
                      </Link>
                    )}
                    {booking.status === 'IN_PROGRESS' && (
                      <Badge variant="primary">{t('bookings', 'cleaningInProgress')}</Badge>
                    )}
                    {booking.status === 'AWAITING_CONFIRMATION' && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDispute(booking.id)}
                          leftIcon={<AlertTriangle className="w-4 h-4" />}
                          className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        >
                          {t('bookings', 'dispute')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmCompletion(booking.id)}
                          leftIcon={<CheckCircle className="w-4 h-4" />}
                        >
                          {t('bookings', 'confirmCompleted')}
                        </Button>
                      </div>
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
