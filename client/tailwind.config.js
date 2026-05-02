/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        dm: {
          bg: '#0f172a',
          surface: '#1e293b',
          elevated: '#273548',
          border: '#334155',
          muted: '#94a3b8',
          fg: '#f1f5f9',
        },
        paid: '#059669',
        partial: '#f59e0b',
        overdue: '#f43f5e',
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 12px rgb(0 0 0 / 0.06)',
        'card-dark':
          '0 1px 2px rgb(15 23 42 / 0.35), 0 6px 24px rgb(15 23 42 / 0.45)',
      },
    },
  },
  plugins: [],
};
