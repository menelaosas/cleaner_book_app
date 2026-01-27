'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { ArrowLeft, LogOut, Trash2 } from 'lucide-react';
import { Card, Button, Input, Alert } from '../../components/ui';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    setProfileData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.zipCode || '',
    });
  }, [user, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${user?.id}`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      updateUser(response.data.data);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${user?.id}/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      alert('Account deleted successfully');
      logout();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete account');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="w-4 h-4" />}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <Card padding="none" className="mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { value: 'profile', label: 'Profile' },
              { value: 'security', label: 'Security' },
              { value: 'notifications', label: 'Notifications' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => { setActiveTab(tab.value); setSuccess(''); setError(''); }}
                className={`flex-1 px-6 py-4 font-medium transition-all ${
                  activeTab === tab.value
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Messages */}
        {success && (
          <div className="mb-6">
            <Alert variant="success" title={success} dismissible onDismiss={() => setSuccess('')} />
          </div>
        )}

        {error && (
          <div className="mb-6">
            <Alert variant="error" title={error} dismissible onDismiss={() => setError('')} />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card padding="md">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Personal Information</h2>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  disabled
                  helperText="Email cannot be changed"
                />
              </div>

              {/* Phone */}
              <Input
                label="Phone Number"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />

              {/* Address */}
              <Input
                label="Address"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                placeholder="123 Main St"
              />

              {/* City, State, Zip */}
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="City"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                />
                <Input
                  label="State"
                  value={profileData.state}
                  onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                />
                <Input
                  label="Zip Code"
                  value={profileData.zipCode}
                  onChange={(e) => setProfileData({ ...profileData, zipCode: e.target.value })}
                />
              </div>

              {/* Submit */}
              <Button type="submit" fullWidth loading={loading}>
                Save Changes
              </Button>
            </form>
          </Card>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Change Password */}
            <Card padding="md">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Change Password</h2>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />

                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  helperText="Minimum 8 characters"
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />

                <Button type="submit" fullWidth loading={loading}>
                  Change Password
                </Button>
              </form>
            </Card>

            {/* Delete Account */}
            <Card padding="md" className="border-red-200 dark:border-red-800">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Danger Zone</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete Account
              </Button>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card padding="md">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Notification Preferences</h2>

            <div className="space-y-4">
              {[
                { label: 'Email Notifications', description: 'Receive booking updates via email', defaultChecked: true },
                { label: 'SMS Notifications', description: 'Receive booking reminders via SMS', defaultChecked: false },
                { label: 'Marketing Emails', description: 'Receive updates about new features', defaultChecked: true },
                { label: 'Push Notifications', description: 'Receive push notifications in browser', defaultChecked: false },
              ].map((item, index, arr) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between py-4 ${
                    index !== arr.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                  }`}
                >
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.label}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-primary rounded border-gray-300 dark:border-gray-600 focus:ring-primary"
                    defaultChecked={item.defaultChecked}
                  />
                </div>
              ))}
            </div>

            <Button fullWidth className="mt-6">
              Save Preferences
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
