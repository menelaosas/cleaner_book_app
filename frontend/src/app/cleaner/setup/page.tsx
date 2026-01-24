'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';

export default function CleanerSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    bio: '',
    yearsExperience: 0,
    specialties: [] as string[],
    
    // Step 2: Service Areas
    serviceAreas: [] as string[],
    maxTravelDistance: 15,
    
    // Step 3: Availability
    availableDays: [] as string[],
    preferredShifts: [] as string[],
    
    // Step 4: Pricing
    hourlyRate: 35,
  });

  useEffect(() => {
    if (user && user.role !== 'CLEANER') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const specialtyOptions = [
    'Regular Cleaning',
    'Deep Clean',
    'Move-in/out',
    'Post-Construction',
    'Commercial',
    'Eco-Friendly',
  ];

  const cityOptions = [
    'Manhattan',
    'Brooklyn',
    'Queens',
    'Bronx',
    'Staten Island',
    'Jersey City',
    'Newark',
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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/cleaners`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      alert('Profile created successfully!');
      router.push('/cleaner/dashboard');
    } catch (error: any) {
      alert('Failed to create profile: ' + (error.response?.data?.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
              <span className="text-2xl">←</span>
            </button>
            <h1 className="text-lg font-bold">Profile Setup</h1>
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
            <span className="text-sm font-bold">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
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
                <span className="text-4xl">👤</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
              <p className="text-gray-600">Help clients get to know you</p>
            </div>

            {/* Years of Experience */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-medium mb-4">Years of Experience</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, yearsExperience: Math.max(0, prev.yearsExperience - 1) }))}
                  className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-xl"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold">{formData.yearsExperience}</div>
                  <div className="text-sm text-gray-500">years</div>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, yearsExperience: prev.yearsExperience + 1 }))}
                  className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-xl"
                >
                  +
                </button>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium">Bio</label>
                <span className="text-xs text-gray-400">{formData.bio.length}/300</span>
              </div>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell clients a little about yourself and your cleaning style..."
                maxLength={300}
                className="w-full rounded-lg border border-gray-300 p-3 min-h-[120px] resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="mt-2 text-xs text-gray-500 flex gap-1 items-center">
                <span>💡</span>
                Mention your attention to detail or specialty areas.
              </p>
            </div>

            {/* Specialties */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-medium mb-4">Specialties</label>
              <div className="grid grid-cols-2 gap-3">
                {specialtyOptions.map(specialty => (
                  <button
                    key={specialty}
                    onClick={() => handleArrayToggle('specialties', specialty)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.specialties.includes(specialty)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Service Areas */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📍</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Service Areas</h2>
              <p className="text-gray-600">Where are you willing to work?</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-medium mb-4">Cities/Neighborhoods</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.serviceAreas.map(area => (
                  <div
                    key={area}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium"
                  >
                    {area}
                    <button
                      onClick={() => handleArrayToggle('serviceAreas', area)}
                      className="hover:text-primary/70"
                    >
                      ×
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
                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                      formData.serviceAreas.includes(city)
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-medium mb-4">
                Max Travel Distance: {formData.maxTravelDistance} miles
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={formData.maxTravelDistance}
                onChange={(e) => setFormData(prev => ({ ...prev, maxTravelDistance: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>5 mi</span>
                <span>30 mi</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Availability */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📅</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Your Availability</h2>
              <p className="text-gray-600">When are you available to work?</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-medium mb-4">Available Days</label>
              <div className="flex justify-between gap-1 mb-6">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    onClick={() => handleArrayToggle('availableDays', day)}
                    className={`flex flex-col items-center gap-1 flex-1 ${
                      formData.availableDays.includes(day) ? '' : 'opacity-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      formData.availableDays.includes(day)
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}>
                      {day[0]}
                    </div>
                  </button>
                ))}
              </div>

              <label className="block text-sm font-medium mb-4">Preferred Shifts</label>
              <div className="grid grid-cols-3 gap-3">
                {shifts.map(shift => (
                  <button
                    key={shift}
                    onClick={() => handleArrayToggle('preferredShifts', shift)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                      formData.preferredShifts.includes(shift)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-lg">
                      {shift === 'Morning' ? '🌅' : shift === 'Afternoon' ? '☀️' : '🌙'}
                    </span>
                    {shift}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Pricing */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💰</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Set Your Rate</h2>
              <p className="text-gray-600">What's your hourly rate?</p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-primary mb-2">
                  ${formData.hourlyRate}
                </div>
                <div className="text-gray-500">per hour</div>
              </div>

              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={formData.hourlyRate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) }))}
                className="w-full mb-4"
              />

              <div className="flex justify-between text-sm text-gray-500">
                <span>$20/hr</span>
                <span>$100/hr</span>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-900">
                  💡 The average rate in your area is $35-45/hour. You can adjust this anytime.
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold mb-4">Profile Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-medium">{formData.yearsExperience} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Specialties:</span>
                  <span className="font-medium">{formData.specialties.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Areas:</span>
                  <span className="font-medium">{formData.serviceAreas.length} locations</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium">{formData.availableDays.length} days/week</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 font-semibold hover:bg-gray-50 transition-all"
            >
              Back
            </button>
          )}
          
          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              Continue
              <span>→</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Creating Profile...' : 'Complete Setup'}
              <span>✓</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
