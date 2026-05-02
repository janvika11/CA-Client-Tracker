import { Link, Navigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Lock, Mail } from 'lucide-react';
import { login } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const ACCENT = '#059669';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

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

  if (user) return <Navigate to="/dashboard" replace />;

  const inputClass =
    'w-full rounded-lg border border-solid border-[#e2e8f0] bg-[#f8fafc] py-[10px] pl-[38px] pr-3 text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]';

  return (
    <div className="flex min-h-screen flex-col bg-[#0f172a] font-sans antialiased">
      {/* Mini navbar */}
      <div className="mx-auto flex w-full max-w-[400px] items-center justify-between px-4 pt-8 sm:px-0 sm:pt-10">
        <div className="flex items-center gap-2">
          <div
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] text-[13px] font-bold tracking-tight text-white"
            style={{ backgroundColor: ACCENT }}
          >
            CA
          </div>
          <span className="text-[15px] font-semibold text-white">CA Tracker</span>
        </div>
        <Link to="/" className="text-[13px]" style={{ color: '#94a3b8' }}>
          ← Back to home
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-8 sm:px-4">
        <div className="w-full max-w-[400px] rounded-2xl bg-white shadow-xl" style={{ borderRadius: '16px', padding: '36px 32px' }}>
          {/* Logo row */}
          <div className="flex items-center justify-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[15px] font-bold tracking-tight text-white"
              style={{ backgroundColor: ACCENT }}
            >
              CA
            </div>
            <span className="text-[20px] font-semibold tracking-tight text-[#0f172a]">CA Tracker</span>
          </div>

          <p className="mt-2 text-center text-[11px] text-[#64748b]">Practice Suite</p>

          <h1 className="mt-6 text-center text-[22px] font-semibold tracking-tight text-[#0f172a]">Welcome back</h1>
          <p className="mt-1 text-center text-[13px] text-[#64748b]">Sign in to your practice dashboard</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit((values) => mutation.mutate(values))} autoComplete="on">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#374151]">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#64748b]" aria-hidden />
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@firm.com"
                  className={inputClass}
                  {...register('email')}
                />
              </div>
              {errors.email ? <p className="mt-1.5 text-xs text-[#dc2626]">{errors.email.message}</p> : null}
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#374151]">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#64748b]" aria-hidden />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={inputClass}
                  {...register('password')}
                />
              </div>
              {errors.password ? <p className="mt-1.5 text-xs text-[#dc2626]">{errors.password.message}</p> : null}
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-[12px] font-medium hover:underline" style={{ color: ACCENT }} onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>

            {mutation.isError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-[#991b1b]">
                {mutation.error?.response?.data?.message ||
                  mutation.error?.message ||
                  'Login failed. Check server is running and database is seeded.'}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-lg py-3 text-[14px] font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
              style={{ backgroundColor: ACCENT, borderRadius: '8px', paddingTop: '12px', paddingBottom: '12px' }}
            >
              {mutation.isPending ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <div className="mt-10 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e2e8f0]" />
            <span className="shrink-0 px-2 text-center text-[11px] uppercase tracking-[0.04em] text-[#64748b]">
              trusted by CA practices across India
            </span>
            <div className="h-px flex-1 bg-[#e2e8f0]" />
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ACCENT }} aria-hidden />
              <span className="text-[13px] font-medium text-[#475569]">Secure &amp; encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ACCENT }} aria-hidden />
              <span className="text-[13px] font-medium text-[#475569]">Built for Indian CAs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
