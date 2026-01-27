'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Search, Star, CheckCircle, X } from 'lucide-react';
import { Card, Badge, Input, Button, LoadingSpinner, EmptyState, Avatar } from '../../components/ui';

interface Cleaner {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  bio: string;
  yearsExperience: number;
  hourlyRate: number;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  tags: string[];
}

export default function CleanersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const availableTags = ['Eco-Friendly', 'Pet Friendly', 'Deep Clean', 'Move-in/out', 'Commercial'];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/cleaners');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchCleaners();
    }
  }, [user]);

  const fetchCleaners = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cleaners`);
      setCleaners(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch cleaners:', error);
      setCleaners([
        {
          id: '1',
          user: { firstName: 'Sarah', lastName: 'Jenkins', avatar: '' },
          bio: 'Professional cleaner with 5 years experience. Specializing in eco-friendly deep cleaning.',
          yearsExperience: 5,
          hourlyRate: 35,
          averageRating: 4.9,
          totalReviews: 127,
          isVerified: true,
          tags: ['Eco-Friendly', 'Pet Friendly', 'Deep Clean'],
        },
        {
          id: '2',
          user: { firstName: 'Michael', lastName: 'Chen', avatar: '' },
          bio: 'Expert in commercial cleaning and move-in/out services. Available weekends.',
          yearsExperience: 8,
          hourlyRate: 40,
          averageRating: 4.8,
          totalReviews: 203,
          isVerified: true,
          tags: ['Commercial', 'Move-in/out'],
        },
        {
          id: '3',
          user: { firstName: 'Emma', lastName: 'Rodriguez', avatar: '' },
          bio: 'Detailed cleaner focusing on residential homes. Pet-friendly and uses eco products.',
          yearsExperience: 3,
          hourlyRate: 30,
          averageRating: 4.7,
          totalReviews: 89,
          isVerified: false,
          tags: ['Pet Friendly', 'Eco-Friendly'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredCleaners = cleaners.filter(cleaner => {
    const matchesSearch = `${cleaner.user.firstName} ${cleaner.user.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => cleaner.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-7 h-7 text-primary" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Serenity</span>
            </Link>
            <Link href="/dashboard" className="text-sm text-primary hover:underline font-medium">
              My Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Find a Cleaner</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse verified cleaning professionals in your area</p>
        </div>

        {/* Search & Filters */}
        <Card padding="md" className="mb-8">
          {/* Search Bar */}
          <div className="mb-4">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>

          {/* Filter Tags */}
          <div>
            <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Filter by specialty:</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-xl border-2 transition-all text-sm font-medium ${
                    selectedTags.includes(tag)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredCleaners.length} cleaner{filteredCleaners.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Loading State */}
        {(loading || authLoading) && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="xl" text={authLoading ? 'Checking authentication...' : 'Loading cleaners...'} />
          </div>
        )}

        {/* Cleaners Grid */}
        {!loading && !authLoading && user && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCleaners.map(cleaner => (
              <Link
                key={cleaner.id}
                href={`/cleaners/${cleaner.id}`}
              >
                <Card hoverable padding="md" className="h-full">
                  {/* Profile Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar
                      fallback={`${cleaner.user.firstName} ${cleaner.user.lastName}`}
                      size="xl"
                      verified={cleaner.isVerified}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {cleaner.user.firstName} {cleaner.user.lastName[0]}.
                      </h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">{cleaner.averageRating}</span>
                        <span className="text-gray-500 dark:text-gray-400">({cleaner.totalReviews})</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {cleaner.bio}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cleaner.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="default" size="sm">
                        {tag}
                      </Badge>
                    ))}
                    {cleaner.tags.length > 2 && (
                      <Badge variant="default" size="sm">
                        +{cleaner.tags.length - 2}
                      </Badge>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {cleaner.yearsExperience}y exp.
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ${cleaner.hourlyRate}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">per hour</div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && !authLoading && user && filteredCleaners.length === 0 && (
          <Card padding="lg">
            <EmptyState
              icon={<Search className="w-8 h-8 text-gray-400" />}
              title="No cleaners found"
              description="Try adjusting your search or filters"
              action={{
                label: 'Clear filters',
                onClick: () => {
                  setSearchTerm('');
                  setSelectedTags([]);
                },
              }}
            />
          </Card>
        )}
      </main>
    </div>
  );
}
