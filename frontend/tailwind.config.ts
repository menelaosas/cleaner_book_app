import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1b6a6a',
        'primary-light': '#2c8585',
        'background-light': '#f7f7f8',
        'background-dark': '#1c2222',
      },
      fontFamily: {
        display: ['var(--font-epilogue)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
