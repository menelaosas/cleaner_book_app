'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle, Mail, Home } from 'lucide-react';
import { Button } from '../../components/ui';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VerifyEmailPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
        token: verificationToken,
      });

      setStatus('success');
      setMessage(t('verifyEmail', 'successMessage'));

      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || t('verifyEmail', 'errorMessage'));
    }
  };

  const resendVerification = async () => {
    alert('Resend verification email feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          {status === 'verifying' && (
            <div className="w-20 h-20 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
          {status === 'verifying' && t('verifyEmail', 'verifyingTitle')}
          {status === 'success' && t('verifyEmail', 'successTitle')}
          {status === 'error' && t('verifyEmail', 'errorTitle')}
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || t('verifyEmail', 'pleaseWait')}
        </p>

        {/* Actions */}
        {status === 'success' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('verifyEmail', 'redirecting')}</p>
            <Link href="/login">
              <Button fullWidth>
                {t('verifyEmail', 'continueToLogin')}
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <Button fullWidth onClick={resendVerification}>
              {t('verifyEmail', 'resendEmail')}
            </Button>
            <Link
              href="/register"
              className="block text-sm text-primary hover:underline"
            >
              {t('verifyEmail', 'backToRegistration')}
            </Link>
          </div>
        )}

        {!token && status === 'verifying' && (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('verifyEmail', 'checkEmail')}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <Home className="w-4 h-4" />
              {t('verifyEmail', 'backToHome')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
