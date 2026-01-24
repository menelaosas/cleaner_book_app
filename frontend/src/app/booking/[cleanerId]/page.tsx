'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

interface TimeSlot {
  time: string;
  available: boolean;
  price: number;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const cleanerId = params.cleanerId as string;

  const [cleaner, setCleaner] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(2);
  const [loading, setLoading] = useState(true);

  // Generate calendar dates (current month)
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  useEffect(() => {
    fetchCleaner();
    generateCalendar();
  }, [cleanerId, currentMonth]);

  const fetchCleaner = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cleaners/${cleanerId}`);
      setCleaner(response.data.data);
    } catch (error) {
      // Mock data
      setCleaner({
        id: cleanerId,
        user: { firstName: 'Sarah', lastName: 'J.', avatar: '' },
        hourlyRate: 35,
        averageRating: 4.9,
        isVerified: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    setCalendarDays(days);
  };

  const timeSlots: TimeSlot[] = [
    { time: '09:00 AM', available: true, price: 35 },
    { time: '10:00 AM', available: true, price: 35 },
    { time: '11:30 AM', available: true, price: 35 },
    { time: '01:00 PM', available: false, price: 35 },
    { time: '02:30 PM', available: true, price: 35 },
    { time: '04:00 PM', available: true, price: 40 },
  ];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
    }

    try {
      const bookingData = {
        cleanerId,
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledTime: selectedTime,
        duration,
        totalAmount: cleaner.hourlyRate * duration,
      };

      // Call booking API
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings`,
        bookingData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      alert('Booking successful!');
      router.push('/dashboard');
    } catch (error: any) {
      if (error.response?.status === 401) {
        alert('Please login to book');
        router.push('/login');
      } else {
        alert('Booking failed: ' + (error.response?.data?.message || 'Please try again'));
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
              <span className="text-2xl">←</span>
            </button>
            <h1 className="text-lg font-bold">Select Date & Time</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Cleaner Summary */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-lg font-bold">
              {cleaner.user.firstName[0]}{cleaner.user.lastName[0]}
            </div>
            {cleaner.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 text-xs">✓</div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold">{cleaner.user.firstName} {cleaner.user.lastName}</p>
            <p className="text-sm text-gray-600">Professional Cleaner</p>
          </div>
          <div className="bg-white border border-gray-200 px-3 py-1 rounded-lg flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className="font-bold text-sm">{cleaner.averageRating}</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                ‹
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                ›
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for alignment */}
            {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10"></div>
            ))}
            
            {/* Date cells */}
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
                      ? 'text-gray-300 cursor-not-allowed'
                      : isTodayDate
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="text-xl font-bold mb-6">Available Time Slots</h3>

            {/* Morning */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-500">🌅</span>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Morning</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.slice(0, 3).map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                    className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 transition-all ${
                      selectedTime === slot.time
                        ? 'border-primary bg-primary/10'
                        : slot.available
                        ? 'border-gray-200 hover:border-primary/50'
                        : 'border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className={`text-sm font-bold ${selectedTime === slot.time ? 'text-primary' : ''}`}>
                      {slot.time}
                    </span>
                    <span className="text-xs text-gray-500">
                      {slot.available ? `$${slot.price}/hr` : 'Booked'}
                    </span>
                    {selectedTime === slot.time && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Afternoon */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-500">☀️</span>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Afternoon</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.slice(3).map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                    className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 transition-all ${
                      selectedTime === slot.time
                        ? 'border-primary bg-primary/10'
                        : slot.available
                        ? 'border-gray-200 hover:border-primary/50'
                        : 'border-dashed border-gray-300 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className={`text-sm font-bold ${selectedTime === slot.time ? 'text-primary' : ''}`}>
                      {slot.time}
                    </span>
                    <span className="text-xs text-gray-500">
                      {slot.available ? `$${slot.price}/hr` : 'Booked'}
                    </span>
                    {selectedTime === slot.time && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
              <span className="text-blue-600 text-xl">ℹ️</span>
              <p className="text-sm text-blue-900">
                Cleaning sessions typically take 2-3 hours depending on your home size.
              </p>
            </div>
          </div>
        )}

        {/* Duration Selector */}
        {selectedTime && (
          <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4">Duration</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDuration(Math.max(1, duration - 1))}
                className="w-12 h-12 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-xl"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold">{duration}</div>
                <div className="text-sm text-gray-500">hours</div>
              </div>
              <button
                onClick={() => setDuration(duration + 1)}
                className="w-12 h-12 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-xl"
              >
                +
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      {selectedDate && selectedTime && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-30">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">
                Estimated Total
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">${(cleaner.hourlyRate * duration).toFixed(2)}</span>
                <span className="text-sm text-gray-500">for {duration} hrs</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 text-primary text-xs font-medium bg-primary/10 px-3 py-1 rounded-full">
                <span>📅</span>
                <span>
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {selectedTime}
                </span>
              </div>
              <button
                onClick={handleBooking}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
              >
                Confirm Booking
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
