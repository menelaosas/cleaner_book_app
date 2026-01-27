'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Lightbulb,
  Check,
  Minus,
  Plus,
  Sunrise,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { Button, Card, LoadingSpinner, Alert } from '../../../components/ui';

export default function CleanerSetupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  const [formData, setFormData] = useState({
    bio: '',
    yearsExperience: 0,
    specialties: [] as string[],
    serviceAreas: [] as string[],
    maxTravelDistance: 15,
    availableDays: [] as string[],
    preferredShifts: [] as string[],
    hourlyRate: 35,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/register?role=cleaner&redirect=/cleaner/setup');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/cleaners/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success && response.data.data) {
          const profile = response.data.data;
          setHasExistingProfile(true);

          const availabilities = profile.availabilities || [];
          const dayMap: { [key: string]: string } = {
            'MONDAY': 'Monday', 'TUESDAY': 'Tuesday', 'WEDNESDAY': 'Wednesday',
            'THURSDAY': 'Thursday', 'FRIDAY': 'Friday', 'SATURDAY': 'Saturday', 'SUNDAY': 'Sunday'
          };
          const shiftMap: { [key: string]: string } = {
            'MORNING': 'Morning', 'AFTERNOON': 'Afternoon', 'EVENING': 'Evening'
          };

          const days = [...new Set(availabilities.map((a: any) => dayMap[a.dayOfWeek]).filter(Boolean))];
          const shifts = [...new Set(availabilities.map((a: any) => shiftMap[a.timeSlot]).filter(Boolean))];

          setFormData({
            bio: profile.bio || '',
            yearsExperience: profile.yearsExperience || 0,
            specialties: profile.specialties || [],
            serviceAreas: profile.serviceAreas || [],
            maxTravelDistance: profile.maxTravelDistance || 15,
            availableDays: days as string[],
            preferredShifts: shifts as string[],
            hourlyRate: profile.hourlyRate || 35,
          });
        }
      } catch (error) {
        console.log('No existing profile found');
      } finally {
        setFetchingProfile(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const specialtyOptions = [
    { value: 'REGULAR', label: 'Regular Cleaning' },
    { value: 'DEEP_CLEAN', label: 'Deep Clean' },
    { value: 'MOVE_IN_OUT', label: 'Move-in/out' },
    { value: 'POST_CONSTRUCTION', label: 'Post-Construction' },
    { value: 'COMMERCIAL', label: 'Commercial' },
  ];

  const cityOptions = [
    'Athens', 'Piraeus', 'Thessaloniki', 'Glyfada',
    'Kifisia', 'Marousi', 'Kallithea', 'Peristeri',
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shifts = ['Morning', 'Afternoon', 'Evening'];

  const handleArrayToggle = (field: string, value: string) => {
    setFormData(prev => {
      const array = prev[field as keyof typeof prev] as string[];
      return {
        ...prev,
        [field]: array.includes(value)
          ? array.filter(item => item !== value)
          : [...array, value],
      };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const dayEnumMap: { [key: string]: string } = {
        'Monday': 'MONDAY', 'Tuesday': 'TUESDAY', 'Wednesday': 'WEDNESDAY',
        'Thursday': 'THURSDAY', 'Friday': 'FRIDAY', 'Saturday': 'SATURDAY', 'Sunday': 'SUNDAY'
      };
      const shiftEnumMap: { [key: string]: string } = {
        'Morning': 'MORNING', 'Afternoon': 'AFTERNOON', 'Evening': 'EVENING'
      };

      const availabilities: { dayOfWeek: string; timeSlot: string; isAvailable: boolean }[] = [];
      for (const day of formData.availableDays) {
        for (const shift of formData.preferredShifts) {
          availabilities.push({
            dayOfWeek: dayEnumMap[day],
            timeSlot: shiftEnumMap[shift],
            isAvailable: true,
          });
        }
      }

      const submitData = {
        bio: formData.bio,
        yearsExperience: formData.yearsExperience,
        specialties: formData.specialties,
        serviceAreas: formData.serviceAreas,
        maxTravelDistance: formData.maxTravelDistance,
        hourlyRate: formData.hourlyRate,
        availabilities,
      };

      if (hasExistingProfile) {
        await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/cleaners/me`, submitData, { headers });
        alert('Profile updated successfully!');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/cleaners`, submitData, { headers });
        alert('Profile created successfully!');
      }
      router.push('/cleaner/dashboard');
    } catch (error: any) {
      alert('Failed to save profile: ' + (error.response?.data?.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => currentStep < 4 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);
  const progress = (currentStep / 4) * 100;

  if (authLoading || !user || fetchingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="xl" text={fetchingProfile ? 'Loading profile...' : 'Loading...'} />
      </div>
    );
  }

  const getShiftIcon = (shift: string) => {
    switch (shift) {
      case 'Morning': return <Sunrise className="w-5 h-5" />;
      case 'Afternoon': return <Sun className="w-5 h-5" />;
      case 'Evening': return <Moon className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{hasExistingProfile ? 'Edit Profile' : 'Profile Setup'}</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              Step {currentStep} of 4
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Tell us about yourself</h2>
              <p className="text-gray-600 dark:text-gray-400">Help clients get to know you</p>
            </div>

            {/* Years of Experience */}
            <Card padding="md">
              <label className="block text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Years of Experience</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, yearsExperience: Math.max(0, prev.yearsExperience - 1) }))}
                  className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-xl flex items-center justify-center transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{formData.yearsExperience}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">years</div>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, yearsExperience: prev.yearsExperience + 1 }))}
                  className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-xl flex items-center justify-center transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </Card>

            {/* Bio */}
            <Card padding="md">
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                <span className="text-xs text-gray-400">{formData.bio.length}/300</span>
              </div>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell clients a little about yourself and your cleaning style..."
                maxLength={300}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 min-h-[120px] resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 dark:text-white"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex gap-1 items-center">
                <Lightbulb className="w-3.5 h-3.5" />
                Mention your attention to detail or specialty areas.
              </p>
            </Card>

            {/* Specialties */}
            <Card padding="md">
              <label className="block text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Specialties</label>
              <div className="grid grid-cols-2 gap-3">
                {specialtyOptions.map(specialty => (
                  <button
                    key={specialty.value}
                    onClick={() => handleArrayToggle('specialties', specialty.value)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      formData.specialties.includes(specialty.value)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {specialty.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: Service Areas */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Service Areas</h2>
              <p className="text-gray-600 dark:text-gray-400">Where are you willing to work?</p>
            </div>

            <Card padding="md">
              <label className="block text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Cities/Neighborhoods</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.serviceAreas.map(area => (
                  <div
                    key={area}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium"
                  >
                    {area}
                    <button onClick={() => handleArrayToggle('serviceAreas', area)} className="hover:text-primary/70">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {cityOptions.map(city => (
                  <button
                    key={city}
                    onClick={() => handleArrayToggle('serviceAreas', city)}
                    disabled={formData.serviceAreas.includes(city)}
                    className={`p-2 rounded-xl border text-sm font-medium transition-all ${
                      formData.serviceAreas.includes(city)
                        ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-primary/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </Card>

            <Card padding="md">
              <label className="block text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">
                Max Travel Distance: {formData.maxTravelDistance} miles
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={formData.maxTravelDistance}
                onChange={(e) => setFormData(prev => ({ ...prev, maxTravelDistance: parseInt(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>5 mi</span>
                <span>30 mi</span>
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Availability */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Your Availability</h2>
              <p className="text-gray-600 dark:text-gray-400">When are you available to work?</p>
            </div>

            <Card padding="md">
              <label className="block text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Available Days</label>
              <div className="flex justify-between gap-1 mb-6">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    onClick={() => handleArrayToggle('availableDays', day)}
                    className={`flex flex-col items-center gap-1 flex-1 ${formData.availableDays.includes(day) ? '' : 'opacity-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      formData.availableDays.includes(day)
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}>
                      {day[0]}
                    </div>
                  </button>
                ))}
              </div>

              <label className="block text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Preferred Shifts</label>
              <div className="grid grid-cols-3 gap-3">
                {shifts.map(shift => (
                  <button
                    key={shift}
                    onClick={() => handleArrayToggle('preferredShifts', shift)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                      formData.preferredShifts.includes(shift)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {getShiftIcon(shift)}
                    {shift}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Step 4: Pricing */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Set Your Rate</h2>
              <p className="text-gray-600 dark:text-gray-400">What&apos;s your hourly rate?</p>
            </div>

            <Card padding="lg">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-primary mb-2">
                  ${formData.hourlyRate}
                </div>
                <div className="text-gray-500 dark:text-gray-400">per hour</div>
              </div>

              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={formData.hourlyRate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) }))}
                className="w-full mb-4 accent-primary"
              />

              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>$20/hr</span>
                <span>$100/hr</span>
              </div>

              <Alert variant="info" className="mt-6">
                The average rate in your area is $35-45/hour. You can adjust this anytime.
              </Alert>
            </Card>

            {/* Summary */}
            <Card padding="md">
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Profile Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Experience:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.yearsExperience} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Specialties:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.specialties.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Service Areas:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.serviceAreas.length} locations</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Available:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.availableDays.length} days/week</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-30">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
          )}

          {currentStep < 4 ? (
            <Button fullWidth onClick={nextStep} rightIcon={<ArrowRight className="w-5 h-5" />}>
              Continue
            </Button>
          ) : (
            <Button fullWidth onClick={handleSubmit} loading={loading} rightIcon={<Check className="w-5 h-5" />}>
              {hasExistingProfile ? 'Save Changes' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
