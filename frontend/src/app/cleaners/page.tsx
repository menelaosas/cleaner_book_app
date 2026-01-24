'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

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
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const availableTags = ['Eco-Friendly', 'Pet Friendly', 'Deep Clean', 'Move-in/out', 'Commercial'];

  useEffect(() => {
    fetchCleaners();
  }, []);

  const fetchCleaners = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cleaners`);
      setCleaners(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch cleaners:', error);
      // Mock data for demo
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🏡</span>
              <span className="text-xl font-bold">Serenity</span>
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
          <h1 className="text-4xl font-bold mb-2">Find a Cleaner</h1>
          <p className="text-gray-600">Browse verified cleaning professionals in your area</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Filter Tags */}
          <div>
            <p className="text-sm font-medium mb-3">Filter by specialty:</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedTags.includes(tag)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredCleaners.length} cleaner{filteredCleaners.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>Loading cleaners...</p>
          </div>
        )}

        {/* Cleaners Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCleaners.map(cleaner => (
              <Link
                key={cleaner.id}
                href={`/cleaners/${cleaner.id}`}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
              >
                {/* Profile Header */}
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-2xl font-bold">
                        {cleaner.user.firstName[0]}{cleaner.user.lastName[0]}
                      </div>
                      {cleaner.isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1">
                          <span className="text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">
                        {cleaner.user.firstName} {cleaner.user.lastName[0]}.
                      </h3>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold">{cleaner.averageRating}</span>
                        <span className="text-gray-500">({cleaner.totalReviews})</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {cleaner.bio}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cleaner.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {cleaner.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        +{cleaner.tags.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      {cleaner.yearsExperience}y exp.
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ${cleaner.hourlyRate}
                      </div>
                      <div className="text-xs text-gray-500">per hour</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredCleaners.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">No cleaners found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTags([]);
              }}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
