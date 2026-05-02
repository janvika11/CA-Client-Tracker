export const FY_OPTIONS = ['2023-24', '2024-25', '2025-26', '2026-27'];

/** Initial FY in the header (seed / demo data is centred on this Indian FY). */
export const DEFAULT_SELECT_FY = '2025-26';

export const MONTH_COLUMNS = [
  { month: 4, label: 'Apr' },
  { month: 5, label: 'May' },
  { month: 6, label: 'Jun' },
  { month: 7, label: 'Jul' },
  { month: 8, label: 'Aug' },
  { month: 9, label: 'Sep' },
  { month: 10, label: 'Oct' },
  { month: 11, label: 'Nov' },
  { month: 12, label: 'Dec' },
  { month: 1, label: 'Jan' },
  { month: 2, label: 'Feb' },
  { month: 3, label: 'Mar' },
];

export const SIDEBAR_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/clients', label: 'Clients' },
  { to: '/bulk-upload', label: 'Bulk Upload' },
  { to: '/services', label: 'Services' },
  { to: '/billing', label: 'Billing' },
  { to: '/payments', label: 'Payments' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
];
