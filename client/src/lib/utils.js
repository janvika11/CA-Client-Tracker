import clsx from 'clsx';
import currencyFormatter from 'currency-formatter';
import dayjs from 'dayjs';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

/** Up to two initials from a display name or email. */
export const getInitials = (nameOrEmail = '', max = 2) => {
  const s = String(nameOrEmail).trim();
  if (!s) return '?';
  if (s.includes('@')) return s.slice(0, max).toUpperCase();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, max).toUpperCase();
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase().slice(0, max);
};

const AVATAR_TONES = [
  'bg-emerald-600 text-white dark:bg-emerald-500',
  'bg-sky-600 text-white dark:bg-sky-500',
  'bg-violet-600 text-white dark:bg-violet-500',
  'bg-amber-600 text-white dark:bg-amber-600',
  'bg-rose-600 text-white dark:bg-rose-500',
  'bg-teal-600 text-white dark:bg-teal-500',
];

/** Deterministic avatar background from a seed string (name / email). */
export const getAvatarToneClass = (seed = '') => {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i += 1) h = (h + s.charCodeAt(i) * (i + 1)) % 997;
  return AVATAR_TONES[h % AVATAR_TONES.length];
};

export const formatINR = (amount = 0) =>
  currencyFormatter.format(Number(amount || 0), {
    code: 'INR',
    symbol: '₹',
    precision: 0,
  });

export const formatDate = (value) => {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('DD-MMM-YYYY') : '-';
};

export const getStatusTone = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-emerald-600/15 text-emerald-600';
    case 'partially_paid':
    case 'partial':
      return 'bg-amber-500/15 text-amber-500';
    case 'overdue':
      return 'bg-rose-500/15 text-rose-500';
    default:
      return 'bg-zinc-400/15 text-zinc-600 dark:text-zinc-300';
  }
};
