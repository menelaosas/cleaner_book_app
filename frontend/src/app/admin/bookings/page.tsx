'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Booking {
  id: string;
  status: string;
  cleaningType: string;
  scheduledDate: string;
  duration: number;
  address: string;
  totalPrice: number;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  cleaner: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  payment: {
    id: string;
    status: string;
    amount: number;
  } | null;
  review: {
    id: string;
    rating: number;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminBookings() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [actionMenuBooking, setActionMenuBooking] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, statusFilter, typeFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        cleaningType: typeFilter,
        ...(search && { search }),
      });

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bookings?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBookings(response.data.data.bookings);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(t('admin', 'fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBookings();
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t('admin', 'statusUpdated'));
      fetchBookings();
      setActionMenuBooking(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('admin', 'updateError'));
    }
  };

  const viewBookingDetails = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bookings/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedBooking(response.data.data);
      setShowBookingModal(true);
      setActionMenuBooking(null);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error(t('admin', 'fetchError'));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      AWAITING_CONFIRMATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const cleaningTypes = ['STANDARD', 'DEEP', 'MOVE_IN_OUT', 'POST_CONSTRUCTION', 'OFFICE'];
  const statuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED', 'CANCELLED', 'REFUNDED'];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('admin', 'bookingManagement')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('admin', 'bookingManagementDesc')}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin', 'searchBookings')}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </form>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary"
            >
              <option value="all">{t('admin', 'allStatuses')}</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary"
            >
              <option value="all">{t('admin', 'allTypes')}</option>
              {cleaningTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin', 'booking')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin', 'customer')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin', 'cleaner')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin', 'status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin', 'price')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin', 'actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {booking.cleaningType.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {formatDate(booking.scheduledDate)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            {booking.duration} {t('admin', 'hours')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {booking.user.firstName} {booking.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {booking.user.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {booking.cleaner.user.firstName} {booking.cleaner.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {booking.cleaner.user.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(booking.totalPrice)}
                        </p>
                        {booking.payment && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {booking.payment.status}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuBooking(actionMenuBooking === booking.id ? null : booking.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>
                          {actionMenuBooking === booking.id && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                              <button
                                onClick={() => viewBookingDetails(booking.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Eye className="w-4 h-4" />
                                {t('admin', 'viewDetails')}
                              </button>
                              <div className="border-t dark:border-gray-700 my-1" />
                              <p className="px-4 py-1 text-xs text-gray-500 uppercase">
                                {t('admin', 'changeStatus')}
                              </p>
                              {statuses.map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateBookingStatus(booking.id, status)}
                                  disabled={booking.status === status}
                                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                    booking.status === status
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0]}`}
                                  />
                                  {status.replace(/_/g, ' ')}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('admin', 'showing')} {(pagination.page - 1) * pagination.limit + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} {t('admin', 'of')}{' '}
                {pagination.total} {t('admin', 'bookings')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg border dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Booking details modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('admin', 'bookingDetails')}
                </h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status.replace(/_/g, ' ')}
                </span>
                <p className="text-sm text-gray-500">
                  {t('admin', 'created')}: {formatDate(selectedBooking.createdAt)}
                </p>
              </div>

              {/* Service details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin', 'serviceType')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedBooking.cleaningType.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin', 'scheduledDate')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedBooking.scheduledDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin', 'duration')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedBooking.duration} {t('admin', 'hours')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin', 'totalPrice')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(selectedBooking.totalPrice)}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin', 'address')}</p>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-900 dark:text-white">{selectedBooking.address}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin', 'notes')}</p>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Customer & Cleaner info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {t('admin', 'customer')}
                  </h4>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedBooking.user.firstName} {selectedBooking.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedBooking.user.email}
                  </p>
                  {selectedBooking.user.phone && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedBooking.user.phone}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {t('admin', 'cleaner')}
                  </h4>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedBooking.cleaner.user.firstName} {selectedBooking.cleaner.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedBooking.cleaner.user.email}
                  </p>
                </div>
              </div>

              {/* Payment info */}
              {selectedBooking.payment && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">
                    {t('admin', 'payment')}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      {selectedBooking.payment.status}
                    </span>
                    <span className="font-medium text-green-800 dark:text-green-400">
                      {formatCurrency(selectedBooking.payment.amount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Review */}
              {selectedBooking.review && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-2">
                    {t('admin', 'review')}
                  </h4>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < selectedBooking.review!.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }
                      >
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-yellow-700 dark:text-yellow-300">
                      {selectedBooking.review.rating}/5
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
