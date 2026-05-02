import { useEffect, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Moon,
  PieChart,
  Search,
  Settings,
  Sun,
  Table2,
  Upload,
  Users,
  Wallet,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FY_OPTIONS, SIDEBAR_LINKS } from '../lib/constants';
import { logout } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { getAvatarToneClass, getInitials } from '../lib/utils';
import { Input } from './ui/input';
import { Select } from './ui/select';

const NAV_ICONS = {
  '/': LayoutDashboard,
  '/clients': Users,
  '/bulk-upload': Upload,
  '/services': Briefcase,
  '/billing': Table2,
  '/payments': Wallet,
  '/reports': PieChart,
  '/settings': Settings,
};

export default function Layout({ children }) {
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const currentFY = useUIStore((state) => state.currentFY);
  const setFY = useUIStore((state) => state.setFY);
  const searchOpen = useUIStore((state) => state.searchOpen);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const isDark = useUIStore((state) => state.isDark);
  const toggleDark = useUIStore((state) => state.toggleDark);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const onKeys = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeys);
    return () => window.removeEventListener('keydown', onKeys);
  }, [setSearchOpen]);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearUser();
      queryClient.clear();
      navigate('/login');
    },
  });

  const firmName = user?.firmDetails?.firmName || user?.firmName || 'Your practice';
  const userName = user?.name || user?.email || 'User';
  const userRole = user?.role || 'owner';
  const firmInitials = useMemo(() => getInitials(firmName, 2), [firmName]);
  const userInitials = useMemo(() => getInitials(userName, 2), [userName]);
  const firmTone = useMemo(() => getAvatarToneClass(firmName), [firmName]);
  const userTone = useMemo(() => getAvatarToneClass(userName || user?.email || ''), [userName, user?.email]);

  return (
    <div className="flex min-h-screen text-zinc-900 dark:text-zinc-100">
      <aside className="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-5 dark:border-zinc-800">
          <Link to="/" className="flex items-start gap-3 rounded-lg transition hover:bg-zinc-50 dark:hover:bg-zinc-800/80">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold tracking-tight ${firmTone}`}
            >
              {firmInitials}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {firmName}
              </p>
              <p className="mt-0.5 truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">CA Tracker</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {SIDEBAR_LINKS.map((item) => {
            const Icon = NAV_ICONS[item.to] || LayoutDashboard;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-50'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 h-[70%] w-1 -translate-y-1/2 rounded-r-full bg-emerald-600 dark:bg-emerald-400"
                        aria-hidden
                      />
                    )}
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300'}`}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/80">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${userTone}`}
            >
              {userInitials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{userName}</p>
              <span className="mt-0.5 inline-flex rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
                {userRole}
              </span>
            </div>
            <button
              type="button"
              className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white hover:text-rose-600 dark:hover:bg-zinc-700 dark:hover:text-rose-400"
              title="Sign out"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
            <div className="relative shrink-0">
              <CalendarDays
                className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-emerald-700 dark:text-emerald-400"
                aria-hidden
              />
              <Select
                className="h-11 w-44 appearance-none border-zinc-300 bg-zinc-50 pl-10 pr-3 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                value={currentFY}
                onChange={(event) => setFY(event.target.value)}
                aria-label="Financial year"
              >
                {FY_OPTIONS.map((fy) => (
                  <option key={fy} value={fy}>
                    FY {fy}
                  </option>
                ))}
              </Select>
            </div>

            <button
              type="button"
              className="focus-ring flex h-11 min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 text-left text-sm text-zinc-500 transition hover:border-emerald-300/80 hover:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-emerald-700/50 dark:hover:bg-zinc-900"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="shrink-0 text-emerald-600 dark:text-emerald-400" size={18} strokeWidth={1.75} />
              <span className="truncate font-medium">Search clients, invoices, services…</span>
              <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-[10px] font-semibold text-zinc-500 shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 sm:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleDark}
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 transition hover:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            </button>
            <div
              className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:flex ${userTone}`}
              title={userName}
            >
              {userInitials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-zinc-900/50 p-4 backdrop-blur-sm dark:bg-black/60"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="mx-auto mt-20 w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
              <Input className="h-11 pl-10" placeholder="Search clients, services, invoices…" autoFocus />
            </div>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Press Esc to close · Global search coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
