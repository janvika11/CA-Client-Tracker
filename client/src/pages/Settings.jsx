import { useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import { createTeamUser, getTeamUsers } from '../lib/api';
import { formatDate } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';

const inviteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['owner', 'staff']),
});

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === 'owner';
  const queryClient = useQueryClient();

  const teamQuery = useQuery({
    queryKey: ['users', 'team'],
    queryFn: getTeamUsers,
    enabled: isOwner,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: '', email: '', password: '', role: 'staff' },
  });

  const createMutation = useMutation({
    mutationFn: createTeamUser,
    onSuccess: () => {
      reset({ name: '', email: '', password: '', role: 'staff' });
      void queryClient.invalidateQueries({ queryKey: ['users', 'team'] });
    },
  });

  useEffect(() => {
    if (createMutation.isSuccess) {
      const t = setTimeout(() => createMutation.reset(), 4000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [createMutation.isSuccess, createMutation]);

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-dm-fg">Settings</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-dm-muted">
            Workspace preferences and team management.
          </p>
        </div>
        <Card className="border-amber-200/80 bg-amber-50/90 p-5 text-amber-950 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="text-sm font-medium">Only workspace owners can invite users and manage team accounts.</p>
          <p className="mt-2 text-sm opacity-90">Ask your firm owner to create an account for you, or sign in with an owner account.</p>
        </Card>
      </div>
    );
  }

  const teamRows = teamQuery.data?.users ?? teamQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-dm-fg">Settings</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-dm-muted">
          Invite staff or co-owners with their own login — no database access required.
        </p>
      </div>

      <Card className="shadow-card dark:shadow-card-dark">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-violet-500/15 dark:text-dm-accent">
            <UserPlus className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-dm-fg">Create user account</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-dm-muted">
              <strong className="text-zinc-800 dark:text-dm-fg">Staff</strong> can use the app under your firm&apos;s data.{' '}
              <strong className="text-zinc-800 dark:text-dm-fg">Owner</strong> adds a co-owner with the same workspace access
              (share credentials instructions securely — email is not sent automatically).
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <div className="sm:col-span-1">
            <label htmlFor="invite-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-dm-dim">
              Full name
            </label>
            <Input id="invite-name" autoComplete="name" placeholder="Priya Sharma" {...register('name')} />
            {errors.name ? <p className="mt-1 text-xs text-rose-600 dark:text-dm-danger">{errors.name.message}</p> : null}
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="invite-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-dm-dim">
              Email (login)
            </label>
            <Input id="invite-email" type="email" autoComplete="off" placeholder="priya@firm.com" {...register('email')} />
            {errors.email ? <p className="mt-1 text-xs text-rose-600 dark:text-dm-danger">{errors.email.message}</p> : null}
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="invite-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-dm-dim">
              Initial password
            </label>
            <Input id="invite-password" type="password" autoComplete="new-password" placeholder="Min. 8 characters" {...register('password')} />
            {errors.password ? <p className="mt-1 text-xs text-rose-600 dark:text-dm-danger">{errors.password.message}</p> : null}
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="invite-role" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-dm-dim">
              Role
            </label>
            <Select id="invite-role" {...register('role')}>
              <option value="staff">Staff</option>
              <option value="owner">Owner (co-owner)</option>
            </Select>
            {errors.role ? <p className="mt-1 text-xs text-rose-600 dark:text-dm-danger">{errors.role.message}</p> : null}
          </div>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
            <Button type="submit" variant="success" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create account'}
            </Button>
            {createMutation.isError ? (
              <p className="text-sm text-rose-600 dark:text-dm-danger">
                {createMutation.error?.response?.data?.message || createMutation.error?.message || 'Could not create user.'}
              </p>
            ) : null}
            {createMutation.isSuccess ? (
              <p className="text-sm font-medium text-emerald-700 dark:text-dm-green">Account created. They can sign in with this email and password.</p>
            ) : null}
          </div>
        </form>
      </Card>

      <Card className="shadow-card dark:shadow-card-dark">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-dm-fg">Team members</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-dm-muted">Everyone in this workspace (same firm scope).</p>

        {teamQuery.isLoading ? (
          <p className="mt-6 text-sm text-zinc-500 dark:text-dm-muted">Loading…</p>
        ) : teamQuery.isError ? (
          <p className="mt-6 text-sm text-rose-600 dark:text-dm-danger">
            {teamQuery.error?.response?.data?.message || 'Could not load team.'}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-dm-border">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-dm-border dark:bg-dm-hover dark:text-dm-muted">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Added</th>
                </tr>
              </thead>
              <tbody>
                {teamRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 dark:text-dm-muted">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  teamRows.map((row) => (
                    <tr
                      key={row._id || row.id}
                      className="border-t border-zinc-100 dark:border-dm-border dark:hover:bg-dm-hover/40"
                    >
                      <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-dm-fg">{row.name}</td>
                      <td className="px-4 py-2.5 text-zinc-600 dark:text-dm-muted">{row.email}</td>
                      <td className="px-4 py-2.5 capitalize text-zinc-700 dark:text-dm-table">{row.role}</td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-500 dark:text-dm-dim">
                        {row.createdAt ? formatDate(row.createdAt) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
