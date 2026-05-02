import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Eye,
  EyeOff,
  FileSpreadsheet,
  IndianRupee,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { login } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

const schema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

const highlights = [
  {
    icon: FileSpreadsheet,
    text: 'Client × Month billing matrix at a glance',
  },
  {
    icon: IndianRupee,
    text: 'Auto-generate billing, track payments, carry forwards',
  },
  {
    icon: ShieldCheck,
    text: 'PDF statements, aging reports, bulk upload',
  },
];

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
    <div className="flex min-h-screen">
      {/* Left — brand panel */}
      <div className="relative hidden w-[60%] flex-col bg-emerald-950 px-12 py-14 text-white lg:flex">
        <div className="mb-12">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-lg font-bold tracking-tight ring-1 ring-white/20">
              CA
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight">CA Tracker</p>
              <p className="text-sm font-medium text-emerald-200/90">Practice suite</p>
            </div>
          </div>
          <p className="mt-8 max-w-md text-lg font-medium leading-relaxed text-emerald-50/95">
            Know what every client owes, every month.
          </p>
        </div>

        <ul className="max-w-lg flex-1 space-y-5">
          {highlights.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-4 rounded-lg border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.07]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600/80 text-white ring-1 ring-emerald-400/30">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="text-sm font-medium leading-snug text-emerald-50/95">{text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center gap-2 border-t border-white/10 pt-8 text-sm text-emerald-200/85">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
          <span>Trusted by CA practices across India</span>
        </div>
      </div>

      {/* Right — sign in */}
      <div className="flex w-full flex-col justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950 lg:w-[40%] lg:px-14">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                CA
              </span>
              <span className="text-lg font-semibold text-zinc-900 dark:text-white">CA Tracker</span>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Sign in to your practice dashboard</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                  aria-hidden
                />
                <Input
                  id="login-email"
                  className="pl-10"
                  {...register('email')}
                  type="email"
                  autoComplete="username"
                  placeholder="you@firm.com"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Input
                  id="login-password"
                  className={cn('pr-11', showPassword ? '' : '')}
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="focus-ring absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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

            <Button type="submit" className="h-11 w-full text-base font-semibold shadow-sm" disabled={mutation.isPending}>
              {mutation.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
