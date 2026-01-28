'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Star,
  DollarSign,
  Calendar,
  BadgeCheck,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Cleaner {
  id: string;
  bio: string;
  hourlyRate: number;
  experienceYears: number;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  isAvailable: boolean;
  verified: boolean;
  serviceAreas: string[];
  cleaningTypes: string[];
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    status: string;
    createdAt: string;
  };
  _count: {
    bookings: number;
    reviews: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCleaners() {
  const { t } = useLanguage();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [availableFilter, setAvailableFilter] = useState('all');
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);
  const [showCleanerModal, setShowCleanerModal] = useState(false);
  const [actionMenuCleaner, setActionMenuCleaner] = useState<string | null>(null);

  useEffect(() => {
    fetchCleaners();
  }, [pagination.page, verifiedFilter, availableFilter]);

  const fetchCleaners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(verifiedFilter !== 'all' && { verified: verifiedFilter }),
        ...(availableFilter !== 'all' && { isAvailable: availableFilter }),
        ...(search && { search }),
      });

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/cleaners?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCleaners(response.data.data.cleaners);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
      toast.error(t('admin', 'fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCleaners();
  };

  const toggleVerification = async (cleanerId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/cleaners/${cleanerId}/verify`,
        { verified: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t('admin', 'verificationUpdated'));
      fetchCleaners();
      setActionMenuCleaner(null);
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error(t('admin', 'updateError'));
    }
  };

  const toggleAvailability = async (cleanerId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/cleaners/${cleanerId}/availability`,
        { isAvailable: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t('admin', 'availabilityUpdated'));
      fetchCleaners();
      setActionMenuCleaner(null);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error(t('admin', 'updateError'));
    }
  };

  const viewCleanerDetails = async (cleanerId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/cleaners/${cleanerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedCleaner(response.data.data);
      setShowCleanerModal(true);
      setActionMenuCleaner(null);
    } catch (error) {
      console.error('Error fetching cleaner details:', error);
      toast.error(t('admin', 'fetchError'));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('admin', 'cleanerManagement')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('admin', 'cleanerManagementDesc')}
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
                placeholder={t('admin', 'searchCleaners')}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </form>
          <div className="flex gap-4">
            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary"
            >
              <option value="all">{t('admin', 'allVerification')}</option>
              <option value="true">{t('admin', 'verified')}</option>
              <option value="false">{t('admin', 'unverified')}</option>
            </select>
            <select
              value={availableFilter}
              onChange={(e) => {
                setAvailableFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary"
            >
              <option value="all">{t('admin', 'allAvailability')}</option>
              <option value="true">{t('admin', 'available')}</option>
              <option value="false">{t('admin', 'unavailable')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cleaners table */}
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
                      {t('admin', 'cleaner')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin', 'rating')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin', 'completedJobs')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin', 'hourlyRate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin', 'status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin', 'actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {cleaners.map((cleaner) => (
                    <tr key={cleaner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm">
                              {cleaner.user.firstName[0]}{cleaner.user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {cleaner.user.firstName} {cleaner.user.lastName}
                              </p>
                              {cleaner.verified && (
                                <BadgeCheck className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {cleaner.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-gray-900 dark:text-white">
                            {cleaner.rating.toFixed(1)}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            ({cleaner.totalReviews})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {cleaner.completedJobs}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {formatCurrency(cleaner.hourlyRate)}/hr
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              cleaner.isAvailable
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {cleaner.isAvailable ? t('admin', 'available') : t('admin', 'unavailable')}
                          </span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              cleaner.verified
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}
                          >
                            {cleaner.verified ? t('admin', 'verified') : t('admin', 'unverified')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuCleaner(actionMenuCleaner === cleaner.id ? null : cleaner.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>
                          {actionMenuCleaner === cleaner.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                              <button
                                onClick={() => viewCleanerDetails(cleaner.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Eye className="w-4 h-4" />
                                {t('admin', 'viewDetails')}
                              </button>
                              <button
                                onClick={() => toggleVerification(cleaner.id, cleaner.verified)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {cleaner.verified ? (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    {t('admin', 'removeVerification')}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    {t('admin', 'verify')}
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => toggleAvailability(cleaner.id, cleaner.isAvailable)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {cleaner.isAvailable ? (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    {t('admin', 'markUnavailable')}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    {t('admin', 'markAvailable')}
                                  </>
                                )}
                              </button>
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
                {pagination.total} {t('admin', 'cleaners')}
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

      {/* Cleaner details modal */}
      {showCleanerModal && selectedCleaner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('admin', 'cleanerDetails')}
                </h2>
                <button
                  onClick={() => setShowCleanerModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile header */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-2xl">
                    {selectedCleaner.user.firstName[0]}{selectedCleaner.user.lastName[0]}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedCleaner.user.firstName} {selectedCleaner.user.lastName}
                    </h3>
                    {selectedCleaner.verified && (
                      <BadgeCheck className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">{selectedCleaner.user.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium">{selectedCleaner.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">({selectedCleaner.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedCleaner.completedJobs} jobs</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatCurrency(selectedCleaner.hourlyRate)}/hr</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedCleaner.bio && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('admin', 'bio')}</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedCleaner.bio}</p>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin', 'experience')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedCleaner.experienceYears} {t('admin', 'years')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin', 'joined')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedCleaner.user.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin', 'serviceAreas')}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCleaner.serviceAreas.map((area, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin', 'cleaningTypes')}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCleaner.cleaningTypes.map((type, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm"
                      >
                        {type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
