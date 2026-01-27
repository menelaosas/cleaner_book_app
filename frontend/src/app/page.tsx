'use client';

import Link from 'next/link';
import { Search, Sparkles, Globe } from 'lucide-react';
import { Button } from '../components/ui';

export default function Home() {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <div
          className="h-full w-full bg-cover bg-center transition-transform duration-[20s] ease-linear hover:scale-105"
          style={{
            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBVSyrcbnwWJx5aUrAXzXEEbBVVv_xkV-gcgz5UYk48stB8Aj6nXZsGj2lo5gTwwb0o-Ujzk1Q0KS_WPssVpogwFvoTOTWnej4lPeQoj_zVFYQqkoniqzmvyjT7ez7pmdYJd27Z7xGFDWXCWsRg8eN0YNu5rsh6KKqlEE6thww3xwcCCOMIfnwAje663Jj7H_NtA5J6aoPh-m-7AA9egOcylRdvhwd-BmCQD5OWW6yuQ6T-VlxXfXLP31ws8ouNYe2c2layAxTIwnQ")'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/10 pointer-events-none"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex w-full items-center justify-center p-6 pt-12">
        <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-md border border-white/10 shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
          <span className="text-sm font-bold tracking-wide text-white uppercase">Serenity</span>
        </div>
        <button
          aria-label="Change Language"
          className="absolute right-6 top-12 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-white backdrop-blur-md border border-white/10 shadow-sm transition-all hover:bg-white/30 active:scale-95"
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wide">EN</span>
        </button>
      </header>

      <div className="flex-1"></div>

      {/* Main Content */}
      <main className="relative z-10 w-full p-4 pb-8">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mx-auto max-w-[480px] border border-white/50 dark:border-white/5">
          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            <div className="h-1.5 w-6 rounded-full bg-primary"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          </div>

          {/* Title */}
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
              Experience the Joy of a Spotless Home
            </h1>
          </div>

          {/* Subtitle */}
          <div className="text-center mb-8 px-2">
            <p className="text-base font-normal leading-relaxed text-gray-500 dark:text-gray-400">
              Connect with the best <strong>Home Cleaning Professionals</strong> in your area to book quick or thorough cleaning for your <strong>Home</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Link href="/login?redirect=/cleaners">
              <Button
                size="lg"
                fullWidth
                leftIcon={<Search className="w-5 h-5" />}
              >
                Find a Cleaner
              </Button>
            </Link>

            <Link href="/register?role=cleaner&redirect=/cleaner/setup">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                leftIcon={<Sparkles className="w-5 h-5" />}
              >
                Join as a Cleaner
              </Button>
            </Link>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-bold text-primary hover:underline ml-0.5"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
