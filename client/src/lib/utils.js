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

/** jsPDF default fonts do not render ₹ reliably — use in PDFs only. */
export const formatINRForPdf = (amount = 0) =>
  String(formatINR(amount))
    .replace(/\u20b9/g, 'Rs.')
    .replace(/₹/g, 'Rs.');

const titleCaseWords = (s) =>
  String(s || '')
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

/** Billing / invoice status for tables and pills. */
export const formatInvoiceStatus = (status) => {
  const map = {
    paid: 'Paid',
    partially_paid: 'Partially Paid',
    partial: 'Partially Paid',
    pending: 'Pending',
    overdue: 'Overdue',
    waived: 'Waived',
  };
  if (!status) return '—';
  return map[status] || titleCaseWords(status);
};

/** Client lifecycle (active / inactive / onboarding). */
export const formatClientStatus = (status) => {
  const map = { active: 'Active', inactive: 'Inactive', onboarding: 'Onboarding' };
  if (!status) return '—';
  return map[status] || titleCaseWords(status);
};

export const formatPaymentMode = (mode) => {
  const map = {
    cash: 'Cash',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
  };
  if (!mode) return '—';
  return map[mode] || titleCaseWords(mode);
};

export const formatBillingCycle = (cycle) => {
  const map = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    half_yearly: 'Half Yearly',
    annual: 'Annual',
    one_time: 'One Time',
  };
  if (!cycle) return '—';
  return map[cycle] || titleCaseWords(cycle);
};

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
