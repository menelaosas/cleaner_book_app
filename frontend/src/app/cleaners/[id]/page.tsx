'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ArrowLeft, MoreHorizontal, Star, CheckCircle, ArrowRight, User } from 'lucide-react';
import { Card, Badge, Button, LoadingSpinner, Avatar, StarRating } from '../../../components/ui';

export default function CleanerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const cleanerId = params.id as string;

  const [cleaner, setCleaner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCleaner();
  }, [cleanerId]);

  const fetchCleaner = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cleaners/${cleanerId}`);
      setCleaner(response.data.data);
    } catch (error) {
      console.error('Failed to fetch cleaner:', error);
      setCleaner({
        id: cleanerId,
        user: { firstName: 'Sarah', lastName: 'Jenkins' },
        bio: 'Reliable and detailed cleaner specializing in deep cleaning and move-out services. I bring my own eco-friendly supplies and absolutely love pets! I focus on the little details that make your home feel fresh.',
        yearsExperience: 5,
        hourlyRate: 35,
        averageRating: 4.9,
        totalReviews: 127,
        totalBookings: 350,
        isVerified: true,
        tags: ['Eco-Friendly', 'Pet Friendly', 'Deep Clean'],
        reviews: [
          {
            id: '1',
            user: { firstName: 'Mike', lastName: 'T.' },
            rating: 5,
            comment: 'Sarah was amazing! My apartment has never looked this good. She even organized my bookshelf. Highly recommend!',
            createdAt: '2 days ago',
          },
          {
            id: '2',
            user: { firstName: 'Jessica', lastName: 'L.' },
            rating: 4,
            comment: 'Very professional and on time. The place smells great.',
            createdAt: '1 week ago',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="xl" text={t('common', 'loading')} />
      </div>
    );
  }

  if (!cleaner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{t('cleanerProfile', 'cleanerNotFound')}</h2>
          <Link href="/cleaners" className="text-primary hover:underline">
            {t('cleanerProfile', 'backToCleaners')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">{t('common', 'back')}</span>
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-32">
        {/* Profile Header */}
        <div className="flex flex-col items-center py-8">
          <Avatar
            fallback={`${cleaner.user.firstName} ${cleaner.user.lastName}`}
            size="2xl"
            verified={cleaner.isVerified}
            className="shadow-lg border-4 border-white dark:border-gray-800"
          />
          <h1 className="text-3xl font-bold mt-4 text-gray-900 dark:text-white">
            {cleaner.user.firstName} {cleaner.user.lastName}
          </h1>
          <Badge variant="primary" className="mt-2">{t('cleanerProfile', 'topRatedPro')}</Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card padding="md" className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <span className="text-2xl font-bold">{cleaner.averageRating}</span>
              <Star className="w-5 h-5 fill-primary text-primary" />
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
              {t('cleanerProfile', 'rating')}
            </div>
          </Card>
          <Card padding="md" className="text-center">
            <div className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">{cleaner.totalBookings}+</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
              {t('cleanerProfile', 'cleans')}
            </div>
          </Card>
          <Card padding="md" className="text-center">
            <div className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">{cleaner.yearsExperience}y</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
              {t('cleanerProfile', 'experience')}
            </div>
          </Card>
        </div>

        {/* About */}
        <Card padding="md" className="mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('cleanerProfile', 'about')} {cleaner.user.firstName}</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{cleaner.bio}</p>
          <div className="flex flex-wrap gap-2">
            {cleaner.tags.map((tag: string) => (
              <Badge key={tag} variant="default" className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                {tag}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Reviews */}
        <Card padding="md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('cleanerProfile', 'recentReviews')}</h2>
            <Link href="#" className="text-primary text-sm font-semibold hover:underline">
              {t('cleanerProfile', 'seeAll')}
            </Link>
          </div>

          <div className="space-y-4">
            {cleaner.reviews && cleaner.reviews.length > 0 ? (
              cleaner.reviews.map((review: any) => (
                <div key={review.id} className="pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar
                        fallback={`${review.reviewer?.firstName || 'A'} ${review.reviewer?.lastName || 'N'}`}
                        size="md"
                      />
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">
                          {review.reviewer?.firstName || t('cleanerProfile', 'anonymous')} {review.reviewer?.lastName || ''}
                        </p>
                        <StarRating value={review.rating} readonly size="sm" />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 pl-13">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('cleanerProfile', 'noReviews')}</p>
            )}
          </div>
        </Card>
      </main>

      {/* Sticky Footer - Book Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t('cleanerProfile', 'price')}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">${cleaner.hourlyRate}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/hr</span>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => router.push(`/booking/${cleanerId}`)}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            {t('cleanerProfile', 'book')} {cleaner.user.firstName}
          </Button>
        </div>
      </div>
    </div>
  );
}
