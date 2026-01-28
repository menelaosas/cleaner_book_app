'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLanguage } from '../../../../contexts/LanguageContext';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { Card, Button, LoadingSpinner, Avatar, StarRating } from '../../../../components/ui';

interface Booking {
  id: string;
  scheduledDate: string;
  cleaningType: string;
  cleaner: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  review?: {
    id: string;
  };
}

export default function ReviewPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Review fields
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [punctuality, setPunctuality] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [quality, setQuality] = useState(5);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && bookingId) {
      fetchBooking();
    }
  }, [user, bookingId]);

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bookingData = response.data.data;

      if (bookingData.status !== 'COMPLETED') {
        toast.error(t('review', 'onlyCompletedError'));
        router.push('/bookings');
        return;
      }

      if (bookingData.review) {
        toast.error(t('review', 'alreadyReviewedError'));
        router.push('/bookings');
        return;
      }

      setBooking(bookingData);
    } catch (error: any) {
      console.error('Failed to fetch booking:', error);
      toast.error(t('review', 'bookingNotFound'));
      router.push('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.error(t('review', 'selectRating'));
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews`,
        {
          bookingId,
          rating,
          comment: comment.trim() || undefined,
          punctuality,
          professionalism,
          quality,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(t('review', 'reviewSuccess'));
      router.push('/bookings');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCleaningType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRatingLabel = (value: number) => {
    switch (value) {
      case 1: return t('review', 'ratingPoor');
      case 2: return t('review', 'ratingFair');
      case 3: return t('review', 'ratingGood');
      case 4: return t('review', 'ratingVeryGood');
      case 5: return t('review', 'ratingExcellent');
      default: return '';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="xl" text={t('common', 'loading')} />
      </div>
    );
  }

  if (!user || !booking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('review', 'leaveReview')}</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Cleaner Info */}
        <Card padding="md" className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={booking.cleaner.avatar}
              fallback={`${booking.cleaner.firstName} ${booking.cleaner.lastName}`}
              size="xl"
            />
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                {booking.cleaner.firstName} {booking.cleaner.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {formatCleaningType(booking.cleaningType)} {t('common', 'on')}{' '}
                {new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Review Form */}
        <form onSubmit={handleSubmit}>
          {/* Overall Rating */}
          <Card padding="md" className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-center text-gray-900 dark:text-white">{t('review', 'overallRating')}</h3>
            <div className="flex flex-col items-center">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {getRatingLabel(rating)}
              </p>
            </div>
          </Card>

          {/* Detailed Ratings */}
          <Card padding="md" className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('review', 'rateDetails')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">{t('review', 'punctuality')}</span>
                <StarRating value={punctuality} onChange={setPunctuality} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">{t('review', 'professionalism')}</span>
                <StarRating value={professionalism} onChange={setProfessionalism} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">{t('review', 'qualityOfWork')}</span>
                <StarRating value={quality} onChange={setQuality} size="sm" />
              </div>
            </div>
          </Card>

          {/* Written Review */}
          <Card padding="md" className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('review', 'writeReview')}</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('review', 'reviewPlaceholder')}
              rows={5}
              maxLength={500}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {comment.length}/500 {t('review', 'characters')}
            </p>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={submitting}
          >
            {t('review', 'submitReview')}
          </Button>
        </form>
      </main>
    </div>
  );
}
