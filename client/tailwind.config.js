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
        /** Dark theme: deep purple/navy canvas (Linear/Turbo-style), elevated cards, violet accent */
        dm: {
          bg: '#0f0f1a',
          sidebar: '#12121f',
          surface: '#1a1a2e',
          hover: '#252538',
          border: '#2a2a42',
          subtle: '#222232',
          fg: '#f4f4f8',
          muted: '#9ca3c4',
          dim: '#6b6b8a',
          table: '#e4e4e7',
          accent: '#a78bfa',
          green: '#34d399',
          danger: '#fb7185',
          warn: '#fb923c',
          info: '#22d3ee',
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
        'card-dark':
          '0 8px 32px rgb(0 0 0 / 0.45), 0 0 0 1px rgb(167 139 250 / 0.07), inset 0 1px 0 rgb(255 255 255 / 0.04)',
      },
    },
  },
  plugins: [],
};
