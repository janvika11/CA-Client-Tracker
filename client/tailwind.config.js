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
          hover: '#243347',
          border: '#334155',
          subtle: '#1e3a5f',
          fg: '#f1f5f9',
          muted: '#94a3b8',
          dim: '#475569',
          table: '#e2e8f0',
          accent: '#059669',
          green: '#34d399',
          danger: '#f87171',
          warn: '#fbbf24',
          info: '#60a5fa',
        },
        /** Legacy KPI / chart accents (light mode) — dark uses dm.* tokens in components */
        paid: '#059669',
        partial: '#fbbf24',
        overdue: '#f87171',
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
        'card-dark': '0 4px 24px rgb(15 23 42 / 0.5), inset 0 1px 0 rgb(255 255 255 / 0.04)',
      },
    },
  },
  plugins: [],
};
