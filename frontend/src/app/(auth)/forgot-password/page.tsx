'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Home, Mail, ArrowLeft, Lock } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Button, Input } from '../../../components/ui';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        email,
      });
      setSent(true);
      toast.success(t('forgotPassword', 'toastSuccess'));
    } catch (error: any) {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      {/* Left: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Home className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{t('common', 'serenity')}</span>
          </Link>

          {!sent ? (
            <>
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{t('forgotPassword', 'title')}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {t('forgotPassword', 'description')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label={t('forgotPassword', 'emailAddress')}
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  leftIcon={<Mail className="w-5 h-5" />}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                >
                  {t('forgotPassword', 'sendResetLink')}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{t('forgotPassword', 'checkYourEmail')}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('forgotPassword', 'emailSentPre')} <strong>{email}</strong>{t('forgotPassword', 'emailSentPost')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                {t('forgotPassword', 'didntReceive')}
              </p>
              <Button
                variant="outline"
                onClick={() => setSent(false)}
              >
                {t('forgotPassword', 'tryAnotherEmail')}
              </Button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
              <ArrowLeft className="w-4 h-4" />
              {t('forgotPassword', 'backToLogin')}
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary-light items-center justify-center p-12">
        <div className="text-white text-center max-w-md">
          <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold mb-4">{t('forgotPassword', 'resetYourPassword')}</h2>
          <p className="text-white/80 text-lg">
            {t('forgotPassword', 'wellHelpYou')}
          </p>
        </div>
      </div>
    </div>
  );
}
