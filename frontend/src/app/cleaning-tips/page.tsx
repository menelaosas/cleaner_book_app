'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Home,
  Sparkles,
  ChefHat,
  Sofa,
  Bath,
  BedDouble,
  Shirt,
  UtensilsCrossed,
  Warehouse,
  Baby,
  Dog,
  Leaf,
  ArrowLeft,
  ChevronRight,
  Lightbulb,
  Star,
} from 'lucide-react';

interface Tip {
  title: string;
  description: string;
  pro?: boolean;
}

interface Category {
  id: string;
  label: string;
  icon: typeof Home;
  color: string;
  bgColor: string;
  tips: Tip[];
}

export default function CleaningTipsPage() {
  const { t } = useLanguage();

  const categories: Category[] = [
    {
      id: 'kitchen',
      label: t('cleaningTips', 'kitchen'),
      icon: ChefHat,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      tips: [
        { title: t('cleaningTips', 'kitchenTip1Title'), description: t('cleaningTips', 'kitchenTip1Desc') },
        { title: t('cleaningTips', 'kitchenTip2Title'), description: t('cleaningTips', 'kitchenTip2Desc'), pro: true },
        { title: t('cleaningTips', 'kitchenTip3Title'), description: t('cleaningTips', 'kitchenTip3Desc') },
        { title: t('cleaningTips', 'kitchenTip4Title'), description: t('cleaningTips', 'kitchenTip4Desc') },
        { title: t('cleaningTips', 'kitchenTip5Title'), description: t('cleaningTips', 'kitchenTip5Desc') },
        { title: t('cleaningTips', 'kitchenTip6Title'), description: t('cleaningTips', 'kitchenTip6Desc'), pro: true },
        { title: t('cleaningTips', 'kitchenTip7Title'), description: t('cleaningTips', 'kitchenTip7Desc') },
        { title: t('cleaningTips', 'kitchenTip8Title'), description: t('cleaningTips', 'kitchenTip8Desc') },
      ],
    },
    {
      id: 'living-room',
      label: t('cleaningTips', 'livingRoom'),
      icon: Sofa,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      tips: [
        { title: t('cleaningTips', 'livingTip1Title'), description: t('cleaningTips', 'livingTip1Desc') },
        { title: t('cleaningTips', 'livingTip2Title'), description: t('cleaningTips', 'livingTip2Desc'), pro: true },
        { title: t('cleaningTips', 'livingTip3Title'), description: t('cleaningTips', 'livingTip3Desc') },
        { title: t('cleaningTips', 'livingTip4Title'), description: t('cleaningTips', 'livingTip4Desc') },
        { title: t('cleaningTips', 'livingTip5Title'), description: t('cleaningTips', 'livingTip5Desc') },
        { title: t('cleaningTips', 'livingTip6Title'), description: t('cleaningTips', 'livingTip6Desc') },
        { title: t('cleaningTips', 'livingTip7Title'), description: t('cleaningTips', 'livingTip7Desc'), pro: true },
      ],
    },
    {
      id: 'bathroom',
      label: t('cleaningTips', 'bathroom'),
      icon: Bath,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      tips: [
        { title: t('cleaningTips', 'bathroomTip1Title'), description: t('cleaningTips', 'bathroomTip1Desc') },
        { title: t('cleaningTips', 'bathroomTip2Title'), description: t('cleaningTips', 'bathroomTip2Desc'), pro: true },
        { title: t('cleaningTips', 'bathroomTip3Title'), description: t('cleaningTips', 'bathroomTip3Desc') },
        { title: t('cleaningTips', 'bathroomTip4Title'), description: t('cleaningTips', 'bathroomTip4Desc') },
        { title: t('cleaningTips', 'bathroomTip5Title'), description: t('cleaningTips', 'bathroomTip5Desc') },
        { title: t('cleaningTips', 'bathroomTip6Title'), description: t('cleaningTips', 'bathroomTip6Desc'), pro: true },
        { title: t('cleaningTips', 'bathroomTip7Title'), description: t('cleaningTips', 'bathroomTip7Desc') },
      ],
    },
    {
      id: 'bedroom',
      label: t('cleaningTips', 'bedroom'),
      icon: BedDouble,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      tips: [
        { title: t('cleaningTips', 'bedroomTip1Title'), description: t('cleaningTips', 'bedroomTip1Desc') },
        { title: t('cleaningTips', 'bedroomTip2Title'), description: t('cleaningTips', 'bedroomTip2Desc'), pro: true },
        { title: t('cleaningTips', 'bedroomTip3Title'), description: t('cleaningTips', 'bedroomTip3Desc') },
        { title: t('cleaningTips', 'bedroomTip4Title'), description: t('cleaningTips', 'bedroomTip4Desc') },
        { title: t('cleaningTips', 'bedroomTip5Title'), description: t('cleaningTips', 'bedroomTip5Desc') },
        { title: t('cleaningTips', 'bedroomTip6Title'), description: t('cleaningTips', 'bedroomTip6Desc') },
      ],
    },
    {
      id: 'closet',
      label: t('cleaningTips', 'closet'),
      icon: Shirt,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      tips: [
        { title: t('cleaningTips', 'closetTip1Title'), description: t('cleaningTips', 'closetTip1Desc'), pro: true },
        { title: t('cleaningTips', 'closetTip2Title'), description: t('cleaningTips', 'closetTip2Desc') },
        { title: t('cleaningTips', 'closetTip3Title'), description: t('cleaningTips', 'closetTip3Desc') },
        { title: t('cleaningTips', 'closetTip4Title'), description: t('cleaningTips', 'closetTip4Desc') },
        { title: t('cleaningTips', 'closetTip5Title'), description: t('cleaningTips', 'closetTip5Desc') },
        { title: t('cleaningTips', 'closetTip6Title'), description: t('cleaningTips', 'closetTip6Desc') },
        { title: t('cleaningTips', 'closetTip7Title'), description: t('cleaningTips', 'closetTip7Desc'), pro: true },
      ],
    },
    {
      id: 'dining',
      label: t('cleaningTips', 'dining'),
      icon: UtensilsCrossed,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      tips: [
        { title: t('cleaningTips', 'diningTip1Title'), description: t('cleaningTips', 'diningTip1Desc') },
        { title: t('cleaningTips', 'diningTip2Title'), description: t('cleaningTips', 'diningTip2Desc'), pro: true },
        { title: t('cleaningTips', 'diningTip3Title'), description: t('cleaningTips', 'diningTip3Desc') },
        { title: t('cleaningTips', 'diningTip4Title'), description: t('cleaningTips', 'diningTip4Desc') },
        { title: t('cleaningTips', 'diningTip5Title'), description: t('cleaningTips', 'diningTip5Desc') },
      ],
    },
    {
      id: 'garage',
      label: t('cleaningTips', 'garage'),
      icon: Warehouse,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-200 dark:bg-gray-700/50',
      tips: [
        { title: t('cleaningTips', 'garageTip1Title'), description: t('cleaningTips', 'garageTip1Desc') },
        { title: t('cleaningTips', 'garageTip2Title'), description: t('cleaningTips', 'garageTip2Desc'), pro: true },
        { title: t('cleaningTips', 'garageTip3Title'), description: t('cleaningTips', 'garageTip3Desc') },
        { title: t('cleaningTips', 'garageTip4Title'), description: t('cleaningTips', 'garageTip4Desc') },
        { title: t('cleaningTips', 'garageTip5Title'), description: t('cleaningTips', 'garageTip5Desc') },
        { title: t('cleaningTips', 'garageTip6Title'), description: t('cleaningTips', 'garageTip6Desc'), pro: true },
      ],
    },
    {
      id: 'kids',
      label: t('cleaningTips', 'kids'),
      icon: Baby,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      tips: [
        { title: t('cleaningTips', 'kidsTip1Title'), description: t('cleaningTips', 'kidsTip1Desc') },
        { title: t('cleaningTips', 'kidsTip2Title'), description: t('cleaningTips', 'kidsTip2Desc'), pro: true },
        { title: t('cleaningTips', 'kidsTip3Title'), description: t('cleaningTips', 'kidsTip3Desc') },
        { title: t('cleaningTips', 'kidsTip4Title'), description: t('cleaningTips', 'kidsTip4Desc') },
        { title: t('cleaningTips', 'kidsTip5Title'), description: t('cleaningTips', 'kidsTip5Desc') },
        { title: t('cleaningTips', 'kidsTip6Title'), description: t('cleaningTips', 'kidsTip6Desc') },
      ],
    },
    {
      id: 'pets',
      label: t('cleaningTips', 'pets'),
      icon: Dog,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      tips: [
        { title: t('cleaningTips', 'petsTip1Title'), description: t('cleaningTips', 'petsTip1Desc') },
        { title: t('cleaningTips', 'petsTip2Title'), description: t('cleaningTips', 'petsTip2Desc'), pro: true },
        { title: t('cleaningTips', 'petsTip3Title'), description: t('cleaningTips', 'petsTip3Desc') },
        { title: t('cleaningTips', 'petsTip4Title'), description: t('cleaningTips', 'petsTip4Desc') },
        { title: t('cleaningTips', 'petsTip5Title'), description: t('cleaningTips', 'petsTip5Desc') },
        { title: t('cleaningTips', 'petsTip6Title'), description: t('cleaningTips', 'petsTip6Desc'), pro: true },
      ],
    },
    {
      id: 'eco',
      label: t('cleaningTips', 'eco'),
      icon: Leaf,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      tips: [
        { title: t('cleaningTips', 'ecoTip1Title'), description: t('cleaningTips', 'ecoTip1Desc'), pro: true },
        { title: t('cleaningTips', 'ecoTip2Title'), description: t('cleaningTips', 'ecoTip2Desc') },
        { title: t('cleaningTips', 'ecoTip3Title'), description: t('cleaningTips', 'ecoTip3Desc') },
        { title: t('cleaningTips', 'ecoTip4Title'), description: t('cleaningTips', 'ecoTip4Desc') },
        { title: t('cleaningTips', 'ecoTip5Title'), description: t('cleaningTips', 'ecoTip5Desc') },
        { title: t('cleaningTips', 'ecoTip6Title'), description: t('cleaningTips', 'ecoTip6Desc'), pro: true },
      ],
    },
  ];

  const [activeCategory, setActiveCategory] = useState<string>(categories[0].id);

  const currentCategory = categories.find(c => c.id === activeCategory)!;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">{t('common', 'back')}</span>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">{t('common', 'serenity')}</span>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-light text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm font-bold tracking-wide">{t('cleaningTips', 'expertAdvice')}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            {t('cleaningTips', 'heroTitle')}
          </h1>
          <p className="text-lg opacity-90 max-w-xl mx-auto">
            {t('cleaningTips', 'heroSubtitle')}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                {t('cleaningTips', 'roomsAndAreas')}
              </h2>
              {/* Mobile: horizontal scroll */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isActive = cat.id === activeCategory;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all text-left ${
                        isActive
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{cat.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto hidden lg:block" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Tips Content */}
          <main className="flex-1 min-w-0">
            {/* Category Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentCategory.bgColor}`}>
                <currentCategory.icon className={`w-6 h-6 ${currentCategory.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentCategory.label}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentCategory.tips.length} {t('cleaningTips', 'tips')}
                </p>
              </div>
            </div>

            {/* Tips Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {currentCategory.tips.map((tip, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${currentCategory.bgColor}`}>
                      <span className={`text-sm font-bold ${currentCategory.color}`}>{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {tip.title}
                        </h3>
                        {tip.pro && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3" />
                            {t('cleaningTips', 'proTip')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-11">
                    {tip.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white text-center">
              <h3 className="text-xl font-bold mb-2">{t('cleaningTips', 'ctaTitle')}</h3>
              <p className="opacity-90 mb-4">
                {t('cleaningTips', 'ctaSubtitle')}
              </p>
              <Link
                href="/cleaners"
                className="inline-flex items-center gap-2 bg-white text-primary font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {t('cleaningTips', 'ctaButton')}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
