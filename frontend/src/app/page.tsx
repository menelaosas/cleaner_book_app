'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

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
          <span className="text-white text-xl">🧼</span>
          <span className="text-sm font-bold tracking-wide text-white uppercase">ΣΥΜΒΟΥΛΕΣ ΥΓΙΕΙΝΗΣ</span>
        </div>
        <button 
          aria-label="Change Language"
          className="absolute right-6 top-12 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-white backdrop-blur-md border border-white/10 shadow-sm transition-all hover:bg-white/30 active:scale-95"
        >
          <span className="text-lg">🌐</span>
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
              Ζήστε τη χαρά ενός πεντακάθαρου σπιτιού.
            </h1>
          </div>

          {/* Subtitle */}
          <div className="text-center mb-8 px-2">
            <p className="text-base font-normal leading-relaxed text-gray-500 dark:text-gray-400">
              Συνδεθείτε με τους καλύτερους <strong>Οικιακούς βοηθούς</strong> στην περιοχή σας για να κλείσετε ραντεβού για γρήγορο ή επιμελές καθαρισμό του <strong>Σπιτιού</strong> σας.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => router.push('/cleaners')}
              className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 bg-primary text-white text-lg font-bold leading-normal tracking-wide shadow-lg transition-all active:scale-[0.98] hover:bg-primary/90"
            >
              <span className="mr-2 text-2xl group-hover:animate-pulse">🔍</span>
              <span>Βρείτε Οικιακό βοηθό</span>
            </button>

            <button 
              onClick={() => router.push('/cleaner/setup')}
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 bg-primary/10 dark:bg-white/5 text-primary dark:text-primary text-lg font-bold leading-normal tracking-wide border border-transparent hover:border-primary/20 transition-all active:scale-[0.98]"
            >
              <span className="mr-2 text-2xl">🧹</span>
              <span>Εγγραφείτε ως Οικιακός βοηθός</span>
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Έχετε ήδη λογαριασμό;{' '}
              <button 
                onClick={() => router.push('/login')}
                className="font-bold text-primary hover:underline ml-0.5"
              >
                Σύνδεση
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
