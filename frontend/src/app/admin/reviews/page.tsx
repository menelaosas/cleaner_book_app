'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  MoreVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Calendar,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  cleaner: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  booking: {
    id: string;
    cleaningType: string;
    scheduledDate: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminReviews() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [actionMenuReview, setActionMenuReview] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [pagination.page, ratingFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(ratingFilter !== 'all' && { rating: ratingFilter }),
      });

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/reviews?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReviews(response.data.data.reviews);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error(t('admin', 'fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm(t('admin', 'confirmDeleteReview'))) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/reviews/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t('admin', 'reviewDeleted'));
      fetchReviews();
      setActionMenuReview(null);
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(t('admin', 'deleteError'));
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('admin', 'reviewManagement')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('admin', 'reviewManagementDesc')}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary"
          >
            <option value="all">{t('admin', 'allRatings')}</option>
            <option value="5">5 {t('admin', 'stars')}</option>
            <option value="4">4 {t('admin', 'stars')}</option>
            <option value="3">3 {t('admin', 'stars')}</option>
            <option value="2">2 {t('admin', 'stars')}</option>
            <option value="1">1 {t('admin', 'star')}</option>
          </select>
        </div>
      </div>

      {/* Reviews list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="divide-y dark:divide-gray-700">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(review.rating)}`}>
                          {review.rating}/5
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      {/* Comment */}
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {review.comment || <em className="text-gray-400">{t('admin', 'noComment')}</em>}
                      </p>

                      {/* Meta info */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">{t('admin', 'reviewBy')}: </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {review.user.firstName} {review.user.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">{t('admin', 'cleanerReviewed')}: </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {review.cleaner.user.firstName} {review.cleaner.user.lastName}
                          </span>
                        </div>
                        {review.booking && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">{t('admin', 'service')}: </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {review.booking.cleaningType.replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative ml-4">
                      <button
                        onClick={() => setActionMenuReview(actionMenuReview === review.id ? null : review.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                      {actionMenuReview === review.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                          <button
                            onClick={() => deleteReview(review.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t('admin', 'delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {reviews.length === 0 && (
                <div className="p-12 text-center">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">{t('admin', 'noReviews')}</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {reviews.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('admin', 'showing')} {(pagination.page - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} {t('admin', 'of')}{' '}
                  {pagination.total} {t('admin', 'reviews')}
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
