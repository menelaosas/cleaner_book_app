import type { Metadata } from 'next';
import { Epilogue } from 'next/font/google';
import './globals.css';
import { Providers } from '../components/Providers';

const epilogue = Epilogue({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-epilogue',
});

export const metadata: Metadata = {
  title: 'Serenity - Professional Home Cleaning Services',
  description: 'Book trusted, verified cleaners in your area.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${epilogue.variable} font-display antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
