'use client';

import Link from 'next/link';
import { Search, Sparkles, Lightbulb } from 'lucide-react';
import { Button } from '../components/ui';
import { LanguageToggle } from '../components/LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';

export default function Home() {
  const { t } = useLanguage();

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
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-md border border-white/10 shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="text-sm font-bold tracking-wide text-white uppercase">{t('common', 'serenity')}</span>
          </div>
          <Link
            href="/cleaning-tips"
            className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-md border border-white/10 shadow-sm text-white transition-all hover:bg-white/30 active:scale-95"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="text-xs font-bold tracking-wide">{t('landing', 'cleaningTipsLink')}</span>
          </Link>
        </div>
        <LanguageToggle className="absolute right-6 top-12" />
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
              {t('landing', 'title')}
            </h1>
          </div>

          {/* Subtitle */}
          <div className="text-center mb-8 px-2">
            <p className="text-base font-normal leading-relaxed text-gray-500 dark:text-gray-400">
              {t('landing', 'subtitle1')} <strong>{t('landing', 'subtitle2')}</strong> {t('landing', 'subtitle3')} <strong>{t('landing', 'subtitle4')}</strong>.
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
                {t('landing', 'findCleaner')}
              </Button>
            </Link>

            <Link href="/register?role=cleaner&redirect=/cleaner/setup">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                leftIcon={<Sparkles className="w-5 h-5" />}
              >
                {t('landing', 'joinAsCleaner')}
              </Button>
            </Link>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('landing', 'alreadyHaveAccount')}{' '}
              <Link
                href="/login"
                className="font-bold text-primary hover:underline ml-0.5"
              >
                {t('landing', 'signIn')}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
