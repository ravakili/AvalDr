/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        vazirmatn: ['Vazirmatn', 'Tahoma', 'sans-serif'],
      },
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        },
        // Neutral slate for text
        ink: {
          50: '#f6f8fa',
          100: '#eaeef2',
          200: '#d2d9e0',
          300: '#aab6c2',
          400: '#7a8898',
          500: '#54616f',
          600: '#3e4956',
          700: '#2c343f',
          800: '#1d232c',
          900: '#10151b',
        },
      },
      backgroundImage: {
        'app-gradient':
          'radial-gradient(circle at 20% 20%, #c2e9f0 0%, transparent 45%), radial-gradient(circle at 80% 0%, #d4e8ff 0%, transparent 40%), radial-gradient(circle at 50% 100%, #e0f7f4 0%, transparent 55%), linear-gradient(135deg, #eef4f9 0%, #e7f0f5 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 80, 110, 0.18)',
        'glass-sm': '0 4px 16px 0 rgba(31, 80, 110, 0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
        'pop-in': 'pop-in 0.25s ease-out',
      },
    },
  },
  plugins: [
    // tailwindcss-rtl adds logical property variants (ms-/me-/ps-/pe-) for RTL
    require('tailwindcss-rtl'),
  ],
}
