import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PieChart,
  Search,
  Settings,
  Sun,
  Table2,
  Upload,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FY_OPTIONS, SIDEBAR_LINKS } from '../lib/constants';
import { logout } from '../lib/api';
import { cn, getAvatarToneClass, getInitials } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Input } from './ui/input';
import { Select } from './ui/select';

const NAV_ICONS = {
  '/dashboard': LayoutDashboard,
  '/clients': Users,
  '/bulk-upload': Upload,
  '/services': Briefcase,
  '/billing': Table2,
  '/payments': Wallet,
  '/reports': PieChart,
  '/settings': Settings,
};

function formatRole(role) {
  if (!role) return 'Member';
  return String(role).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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

  const [mobileNav, setMobileNav] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

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
        setUserMenuOpen(false);
        setMobileNav(false);
      }
    };
    window.addEventListener('keydown', onKeys);
    return () => window.removeEventListener('keydown', onKeys);
  }, [setSearchOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const close = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [userMenuOpen]);

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
  const userInitials = useMemo(() => getInitials(userName, 2), [userName]);
  const userTone = useMemo(() => getAvatarToneClass(userName || user?.email || ''), [userName, user?.email]);

  const sidebarContent = (
    <>
      <div className="border-b border-slate-200 px-4 py-5 dark:border-dm-border">
        <Link
          to="/dashboard"
          className="block rounded-lg transition hover:bg-slate-50 dark:hover:bg-white/[0.04]"
          onClick={() => setMobileNav(false)}
        >
          <p className="text-[10px] font-bold uppercase leading-tight tracking-[0.14em] text-[#059669] dark:text-dm-accent">
            {firmName}
          </p>
          <h1 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-dm-fg">CA Tracker</h1>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {SIDEBAR_LINKS.map((item) => {
          const Icon = NAV_ICONS[item.to] || LayoutDashboard;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setMobileNav(false)}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-slate-100 text-slate-900 dark:bg-violet-500/10 dark:text-dm-fg'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-dm-muted dark:hover:bg-white/[0.04] dark:hover:text-dm-fg'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-[52%] w-1 -translate-y-1/2 rounded-r-full transition-colors',
                      isActive ? 'bg-[#059669] dark:bg-dm-accent' : 'bg-transparent'
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      'relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-white text-[#059669] shadow-sm dark:bg-violet-500/15 dark:text-dm-accent'
                        : 'bg-slate-100 text-slate-500 dark:bg-dm-bg/50 dark:text-dm-dim'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="relative z-[1] truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-dm-border">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-dm-border dark:bg-dm-surface dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold', userTone)}>
            {userInitials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-dm-fg">{userName}</p>
            <span className="mt-0.5 inline-flex rounded-md bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:bg-violet-500/15 dark:text-violet-200">
              {formatRole(userRole)}
            </span>
          </div>
          <button
            type="button"
            className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-rose-600 dark:hover:bg-dm-hover dark:hover:text-dm-danger"
            title="Sign out"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-dm-bg dark:text-dm-fg">
      {/* Mobile overlay */}
      {mobileNav ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] dark:bg-dm-bg/70 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNav(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-dm-border dark:bg-dm-sidebar',
          mobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'lg:sticky lg:z-30'
        )}
      >
        <div className="flex justify-end border-b border-slate-100 p-2 dark:border-dm-border lg:hidden">
          <button
            type="button"
            className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-dm-hover"
            onClick={() => setMobileNav(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-dm-border dark:bg-dm-bg/80 dark:backdrop-blur-xl lg:px-6">
          <button
            type="button"
            className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-dm-border dark:text-dm-fg dark:hover:bg-dm-hover lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
            <div className="relative shrink-0">
              <CalendarDays
                className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-dm-accent"
                aria-hidden
              />
              <Select
                className={cn(
                  'h-10 min-h-0 w-[8.5rem] appearance-none border-[#e2e8f0] bg-white pl-9 pr-2 text-xs font-bold uppercase tracking-wide text-[#059669]',
                  'dark:border-dm-border dark:bg-dm-surface dark:text-dm-accent',
                  'sm:h-11 sm:w-44 sm:text-sm'
                )}
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
              className={cn(
                'focus-ring flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[6px] border-[0.5px] border-[#e2e8f0] bg-white px-3 text-left text-sm text-[#64748b] transition',
                'hover:border-[#059669]/40 focus-visible:border-[#059669]',
                'dark:border-dm-border dark:bg-dm-surface dark:text-dm-muted dark:hover:border-dm-accent/40',
                'sm:h-11 sm:gap-3 sm:px-4'
              )}
              onClick={() => setSearchOpen(true)}
            >
              <Search className="shrink-0 text-[#059669] dark:text-dm-accent" size={17} strokeWidth={1.75} />
              <span className="truncate font-medium text-[#64748b] dark:text-dm-muted">
                Search clients, invoices…
              </span>
              <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 shadow-sm dark:border-dm-border dark:bg-dm-hover dark:text-dm-muted sm:inline-flex">
                <span className="text-[11px]">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleDark}
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-dm-fg dark:hover:bg-dm-hover"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className={cn(
                  'focus-ring flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 shadow-sm transition',
                  'hover:border-emerald-300 dark:border-dm-border dark:bg-dm-surface dark:hover:border-dm-accent/40'
                )}
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#059669] text-xs font-bold text-white dark:bg-gradient-to-br dark:from-violet-500 dark:to-violet-700 dark:shadow-[0_0_16px_rgba(139,92,246,0.45)]">
                  {userInitials}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition dark:text-dm-muted', userMenuOpen && 'rotate-180')} aria-hidden />
              </button>
              {userMenuOpen ? (
                <div
                  className={cn(
                    'absolute right-0 z-[100] mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl',
                    'dark:border-dm-border dark:bg-dm-surface'
                  )}
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-dm-fg dark:hover:bg-dm-hover"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <Settings className="h-4 w-4 opacity-70" />
                    Workspace settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-dm-danger dark:hover:bg-[#450a0a]/35"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logoutMutation.mutate();
                    }}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 transition-opacity duration-200 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 p-4 backdrop-blur-sm dark:bg-dm-bg/75"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="mx-auto mt-20 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-dm-border dark:bg-dm-surface"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-dm-muted" aria-hidden />
              <Input className="pl-10" placeholder="Search clients, services, invoices…" autoFocus />
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-dm-muted">Press Esc to close · Global search coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
