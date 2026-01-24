'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function VerifyEmailPage() {
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
      setMessage('Your email has been verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Verification failed. The link may be expired or invalid.');
    }
  };

  const resendVerification = async () => {
    // You can implement resend logic here
    alert('Resend verification email feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          {status === 'verifying' && (
            <div className="w-20 h-20 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-4xl">⏳</span>
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">✅</span>
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">❌</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-3">
          {status === 'verifying' && 'Verifying Your Email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || 'Please wait while we verify your email address.'}
        </p>

        {/* Actions */}
        {status === 'success' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
            <Link
              href="/login"
              className="inline-block w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Continue to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={resendVerification}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Resend Verification Email
            </button>
            <Link
              href="/register"
              className="block text-sm text-primary hover:underline"
            >
              Back to Registration
            </Link>
          </div>
        )}

        {!token && status === 'verifying' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Check your email for the verification link.
            </p>
            <Link
              href="/"
              className="inline-block text-primary hover:underline font-medium"
            >
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
