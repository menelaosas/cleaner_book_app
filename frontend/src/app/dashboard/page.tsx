'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  Home,
  MessageSquare,
  Search,
  Calendar,
  Settings,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import {
  Card,
  Badge,
  StatusBadge,
  Alert,
  EmptyState,
  LoadingSpinner,
  Avatar,
} from '../../components/ui';

interface Booking {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  cleaningType: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  user?: {
    firstName: string;
    lastName: string;
  };
  cleaner?: {
    firstName: string;
    lastName: string;
  };
}

interface Stats {
  pendingBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  totalEarnings?: number;
}

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [bookingsRes, messagesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bookings?upcoming=true`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/messages/unread-count`, { headers }),
      ]);

      setBookings(bookingsRes.data.data || []);
      setUnreadMessages(messagesRes.data.data?.unreadCount || 0);

      const allBookings = bookingsRes.data.data || [];
      setStats({
        pendingBookings: allBookings.filter((b: Booking) => b.status === 'PENDING').length,
        upcomingBookings: allBookings.filter((b: Booking) => ['CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length,
        completedBookings: 0,
      });

      if (user?.role === 'CLEANER') {
        try {
          const statsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cleaners/me/stats`, { headers });
          setStats(prev => ({ ...prev, ...statsRes.data.data }));
        } catch (e) {
          // Stats endpoint might not exist yet
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <LoadingSpinner size="xl" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isCleaner = user.role === 'CLEANER';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Home className="w-7 h-7 text-primary" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Serenity</h1>
              {isCleaner && (
                <Badge variant="primary">Cleaner</Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Link href="/messages" className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </Link>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <LogOut className="w-4 h-4" />
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
          <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Welcome back, {user.firstName}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isCleaner
              ? 'Manage your bookings and track your earnings'
              : 'Ready to book a cleaner or manage your appointments?'}
          </p>
        </div>

        {/* Email Verification Alert */}
        {!user.emailVerified && (
          <Alert variant="warning" title="Email Not Verified" className="mb-6">
            Please check your email to verify your account.
          </Alert>
        )}

        {/* Stats Cards for Cleaner */}
        {isCleaner && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingBookings}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingBookings}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedBookings}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalEarnings?.toFixed(0) || '0'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Earnings</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 ${isCleaner ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 mb-8`}>
          {!isCleaner && (
            <Link href="/cleaners">
              <Card hoverable padding="md" className="h-full">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Find Cleaners</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Browse and book verified cleaners in your area
                </p>
              </Card>
            </Link>
          )}

          <Link href={isCleaner ? '/cleaner/bookings' : '/bookings'}>
            <Card hoverable padding="md" className="h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">My Bookings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isCleaner ? 'Manage your cleaning jobs' : 'View and manage your appointments'}
              </p>
              {stats && stats.pendingBookings > 0 && (
                <Badge variant="warning" className="mt-2">
                  {stats.pendingBookings} pending
                </Badge>
              )}
            </Card>
          </Link>

          <Link href="/messages">
            <Card hoverable padding="md" className="h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Messages</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat with {isCleaner ? 'customers' : 'cleaners'}
              </p>
              {unreadMessages > 0 && (
                <Badge variant="error" className="mt-2">
                  {unreadMessages} unread
                </Badge>
              )}
            </Card>
          </Link>

          {isCleaner && (
            <Link href="/cleaner/earnings">
              <Card hoverable padding="md" className="h-full">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Earnings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your earnings and performance
                </p>
              </Card>
            </Link>
          )}

          <Link href="/settings">
            <Card hoverable padding="md" className="h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your profile and preferences
              </p>
            </Card>
          </Link>
        </div>

        {/* Recent/Upcoming Bookings */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {isCleaner ? 'Upcoming Jobs' : 'Upcoming Bookings'}
            </h3>
            <Link
              href={isCleaner ? '/cleaner/bookings' : '/bookings'}
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {bookings.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-8 h-8 text-gray-400" />}
              title="No upcoming bookings"
              description={
                !isCleaner
                  ? 'Book your first cleaning service to get started!'
                  : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[50px]">
                      <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
                        {new Date(booking.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {new Date(booking.scheduledDate).getDate()}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isCleaner
                          ? `${booking.user?.firstName} ${booking.user?.lastName}`
                          : `${booking.cleaner?.firstName} ${booking.cleaner?.lastName}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(booking.scheduledTime)} • {formatCleaningType(booking.cleaningType)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={booking.status} />
                    <span className="font-bold text-gray-900 dark:text-white">${booking.totalAmount.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Become a Cleaner CTA (for non-cleaners) */}
        {!isCleaner && (
          <div className="mt-8 p-6 bg-gradient-to-r from-primary to-primary-light rounded-xl text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Want to earn money cleaning?</h3>
                <p className="opacity-90">
                  Join our network of professional cleaners and start earning today.
                </p>
              </div>
              <Link
                href="/cleaner/setup"
                className="px-6 py-3 bg-white text-primary rounded-xl font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Become a Cleaner
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
