'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function CleanerProfilePage() {
  const params = useParams();
  const router = useRouter();
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
      // Mock data
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!cleaner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Cleaner not found</h2>
          <Link href="/cleaners" className="text-primary hover:underline">
            Back to cleaners
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <span>←</span>
              <span className="font-medium">Back</span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <span className="text-xl">⋯</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-32">
        {/* Profile Header */}
        <div className="flex flex-col items-center py-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white">
              {cleaner.user.firstName[0]}{cleaner.user.lastName[0]}
            </div>
            {cleaner.isVerified && (
              <div className="absolute bottom-1 right-1 bg-primary text-white rounded-full p-2 border-4 border-white">
                <span className="text-sm">✓</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold mt-4">
            {cleaner.user.firstName} {cleaner.user.lastName}
          </h1>
          <p className="text-primary font-medium">Top Rated Pro</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4 text-center border border-gray-200">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <span className="text-2xl font-bold">{cleaner.averageRating}</span>
              <span className="text-xl">★</span>
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-500">
              Rating
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border border-gray-200">
            <div className="text-2xl font-bold mb-1">{cleaner.totalBookings}+</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-500">
              Cleans
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border border-gray-200">
            <div className="text-2xl font-bold mb-1">{cleaner.yearsExperience}y</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-500">
              Experience
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">About {cleaner.user.firstName}</h2>
          <p className="text-gray-700 leading-relaxed mb-4">{cleaner.bio}</p>
          <div className="flex flex-wrap gap-2">
            {cleaner.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <span>✓</span>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Reviews</h2>
            <Link href="#" className="text-primary text-sm font-semibold hover:underline">
              See all
            </Link>
          </div>

          <div className="space-y-4">
            {cleaner.reviews.map((review: any) => (
              <div key={review.id} className="pb-4 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                      {review.user.firstName[0]}{review.user.lastName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        {review.user.firstName} {review.user.lastName}
                      </p>
                      <div className="flex text-yellow-400 text-sm">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{review.createdAt}</span>
                </div>
                <p className="text-sm text-gray-700 pl-13">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Sticky Footer - Book Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">
              Price
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">${cleaner.hourlyRate}</span>
              <span className="text-sm text-gray-500">/hr</span>
            </div>
          </div>
          <button
            onClick={() => router.push(`/booking/${cleanerId}`)}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
          >
            Book {cleaner.user.firstName}
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
