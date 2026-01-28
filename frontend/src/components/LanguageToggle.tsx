'use client';

import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  const toggle = () => {
    setLocale(locale === 'en' ? 'gr' : 'en');
  };

  return (
    <button
      onClick={toggle}
      aria-label="Change Language"
      className={`flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-white backdrop-blur-md border border-white/10 shadow-sm transition-all hover:bg-white/30 active:scale-95 ${className}`}
    >
      <Globe className="w-4 h-4" />
      <span className="text-xs font-bold tracking-wide">{locale === 'en' ? 'EN' : 'GR'}</span>
    </button>
  );
}
