'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Star, Calendar, Loader2, Minus, Plus } from 'lucide-react';
import { Card, Button, Input, LoadingSpinner, Avatar, Badge } from '../../../components/ui';

interface TimeSlot {
  time: string;
  displayTime: string;
  available: boolean;
}

const getCleaningTypes = (t: (section: string, key: string) => string) => [
  { value: 'REGULAR', label: t('booking', 'standardCleaning'), description: t('booking', 'standardDesc') },
  { value: 'DEEP_CLEAN', label: t('booking', 'deepCleaning'), description: t('booking', 'deepDesc') },
  { value: 'MOVE_IN_OUT', label: t('booking', 'moveInOut'), description: t('booking', 'moveDesc') },
  { value: 'POST_CONSTRUCTION', label: t('booking', 'postConstruction'), description: t('booking', 'postDesc') },
  { value: 'COMMERCIAL', label: t('booking', 'commercialCleaning'), description: t('booking', 'commercialDesc') },
];

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const cleanerId = params.cleanerId as string;

  const [cleaner, setCleaner] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(2);
  const [cleaningType, setCleaningType] = useState<string>('REGULAR');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Address fields
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [instructions, setInstructions] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // Pre-fill address from user profile
  useEffect(() => {
    if (user) {
      setAddress(user.address || '');
      setCity(user.city || '');
      setState(user.state || '');
      setZipCode(user.zipCode || '');
    }
  }, [user]);

  useEffect(() => {
    fetchCleaner();
    generateCalendar();
  }, [cleanerId, currentMonth]);

  const fetchCleaner = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cleaners/${cleanerId}`);
      setCleaner(response.data.data);
    } catch (error) {
      toast.error(t('booking', 'failedLoadCleaner'));
      router.push('/cleaners');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);

    const days: Date[] = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    setCalendarDays(days);
  };

  // Generate time slots with 24h format for API
  const timeSlots: TimeSlot[] = [
    { time: '09:00', displayTime: '09:00 AM', available: true },
    { time: '10:00', displayTime: '10:00 AM', available: true },
    { time: '11:00', displayTime: '11:00 AM', available: true },
    { time: '12:00', displayTime: '12:00 PM', available: true },
    { time: '13:00', displayTime: '01:00 PM', available: true },
    { time: '14:00', displayTime: '02:00 PM', available: true },
    { time: '15:00', displayTime: '03:00 PM', available: true },
    { time: '16:00', displayTime: '04:00 PM', available: true },
    { time: '17:00', displayTime: '05:00 PM', available: true },
  ];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error(t('booking', 'selectDateAndTime'));
      return;
    }

    if (!address || !city || !state || !zipCode) {
      toast.error(t('booking', 'fillAddress'));
      return;
    }

    if (!user) {
      toast.error(t('booking', 'pleaseLogin'));
      router.push('/login');
      return;
    }

    setSubmitting(true);

    try {
      const bookingData = {
        cleanerId,
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledTime: selectedTime,
        duration,
        cleaningType,
        address,
        city,
        state,
        zipCode,
        instructions: instructions || undefined,
      };

      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings`,
        bookingData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(t('booking', 'bookingSuccess'));
      router.push('/bookings');
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error(t('booking', 'pleaseLogin'));
        router.push('/login');
      } else {
        toast.error(error.response?.data?.message || t('booking', 'bookingFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Calculate pricing
  const calculateTotal = () => {
    if (!cleaner) return 0;
    const subtotal = cleaner.hourlyRate * duration;
    const serviceFee = subtotal * 0.15;
    const tax = subtotal * 0.08;
    return subtotal + serviceFee + tax;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="xl" text={t('common', 'loading')} />
      </div>
    );
  }

  if (!cleaner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('booking', 'bookCleaning')}</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Cleaner Summary */}
        <Card padding="md" className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar
              fallback={`${cleaner.user.firstName} ${cleaner.user.lastName}`}
              size="lg"
              verified={cleaner.isVerified}
            />
            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-white">{cleaner.user.firstName} {cleaner.user.lastName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">${cleaner.hourlyRate}/hour</p>
            </div>
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1 rounded-lg flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-sm text-gray-900 dark:text-white">{cleaner.averageRating || 'New'}</span>
            </div>
          </div>
        </Card>

        {/* Cleaning Type */}
        <Card padding="md" className="mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('booking', 'cleaningType')}</h3>
          <div className="space-y-3">
            {getCleaningTypes(t).map((type) => (
              <button
                key={type.value}
                onClick={() => setCleaningType(type.value)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  cleaningType === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{type.description}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Calendar */}
        <Card padding="md" className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{t('booking', 'selectDate')}</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={previousMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10"></div>
            ))}

            {calendarDays.map((date, i) => {
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const isTodayDate = isToday(date);
              const isPastDate = isPast(date);

              return (
                <button
                  key={i}
                  onClick={() => !isPastDate && handleDateSelect(date)}
                  disabled={isPastDate}
                  className={`h-10 w-full rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-md'
                      : isPastDate
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : isTodayDate
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Time Slots */}
        {selectedDate && (
          <Card padding="md" className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('booking', 'selectTime')}</h3>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 transition-all ${
                    selectedTime === slot.time
                      ? 'border-primary bg-primary/10'
                      : slot.available
                      ? 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                      : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className={`text-sm font-bold ${selectedTime === slot.time ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                    {slot.displayTime}
                  </span>
                  {selectedTime === slot.time && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Duration Selector */}
        {selectedTime && (
          <Card padding="md" className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('booking', 'duration')}</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDuration(Math.max(1, duration - 1))}
                className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-xl flex items-center justify-center transition-colors"
              >
                <Minus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{duration}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('common', 'hours')}</div>
              </div>
              <button
                onClick={() => setDuration(Math.min(8, duration + 1))}
                className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-xl flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </Card>
        )}

        {/* Address Section */}
        {selectedTime && (
          <Card padding="md" className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('booking', 'serviceAddress')}</h3>
            <div className="space-y-4">
              <Input
                label={t('booking', 'streetAddress')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('booking', 'city')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  required
                />
                <Input
                  label={t('booking', 'state')}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NY"
                  required
                />
              </div>
              <div className="w-1/2">
                <Input
                  label={t('booking', 'zipCode')}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="10001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('booking', 'specialInstructions')}
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t('booking', 'instructionsPlaceholder')}
                  rows={3}
                  className="w-full h-12 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                  style={{ height: 'auto', minHeight: '80px' }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Price Breakdown */}
        {selectedTime && (
          <Card padding="md" className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('booking', 'priceBreakdown')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>${cleaner.hourlyRate} x {duration} hours</span>
                <span>${(cleaner.hourlyRate * duration).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{t('booking', 'serviceFee')}</span>
                <span>${(cleaner.hourlyRate * duration * 0.15).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{t('booking', 'tax')}</span>
                <span>${(cleaner.hourlyRate * duration * 0.08).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                  <span>{t('common', 'total')}</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      {selectedDate && selectedTime && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-30">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">
                {t('common', 'total')}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 text-primary text-xs font-medium bg-primary/10 px-3 py-1 rounded-full">
                <Calendar className="w-3 h-3" />
                <span>
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {
                    timeSlots.find(s => s.time === selectedTime)?.displayTime || selectedTime
                  }
                </span>
              </div>
              <Button
                onClick={handleBooking}
                disabled={submitting || !address || !city || !state || !zipCode}
                loading={submitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t('booking', 'confirmBooking')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
