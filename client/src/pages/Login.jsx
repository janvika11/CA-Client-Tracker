import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Trophy,
} from 'lucide-react';
import { login } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setUser(data?.user || data);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] dark:bg-zinc-950">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div
          className={cn(
            'mx-auto w-full rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900',
            'sm:max-w-[420px] sm:p-8',
            'shadow-[0_8px_30px_rgb(15,23,42,0.06)]'
          )}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold tracking-tight text-white shadow-md shadow-emerald-600/25">
              CA
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
              CA Tracker
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Welcome back</h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-zinc-400">Sign in to your practice dashboard</p>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            autoComplete="on"
          >
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                  aria-hidden
                />
                <Input
                  id="login-email"
                  className="h-11 border-slate-200 bg-white pl-10 dark:border-zinc-700 dark:bg-zinc-950"
                  {...register('email')}
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@firm.com"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                  aria-hidden
                />
                <Input
                  id="login-password"
                  className="h-11 border-slate-200 bg-white pl-10 pr-11 dark:border-zinc-700 dark:bg-zinc-950"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="focus-ring absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <a
                href="#"
                className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                onClick={(e) => e.preventDefault()}
              >
                Forgot password?
              </a>
            </div>

            {mutation.isError && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                {mutation.error?.response?.data?.message ||
                  mutation.error?.message ||
                  'Login failed. Check server is running and database is seeded.'}
              </p>
            )}

            <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs leading-relaxed text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100/90">
              <strong className="font-semibold">Browser password warning:</strong> If Chrome shows “password found in a data
              breach,” that comes from Google Password Manager, not this app. Tap <strong>OK</strong> to dismiss, or use a
              unique password (see demo credentials after <code className="rounded bg-white/60 px-1 dark:bg-zinc-900/80">npm run seed</code>
              ).
            </div>

            <Button
              type="submit"
              className="h-11 w-full gap-2 text-base font-semibold shadow-md shadow-emerald-600/20"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Signing in…' : 'Sign in'}
              {!mutation.isPending && <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />}
            </Button>
          </form>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400">
              <Shield className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <span>Secure &amp; Encrypted</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400">
              <Trophy className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <span>Built for Indian CAs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
