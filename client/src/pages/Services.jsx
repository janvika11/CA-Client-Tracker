import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createService, deleteService, getServices, updateService } from '../lib/api';
import { cn, formatBillingCycle, formatINR } from '../lib/utils';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { SkeletonBlock } from '../components/ui/skeleton';

const serviceSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(2),
  category: z.enum(['GST', 'TDS', 'Income Tax', 'ROC', 'Audit', 'Advisory', 'Other']),
  defaultPrice: z.coerce.number().min(0, 'Price cannot be negative'),
  billingCycle: z.enum(['monthly', 'quarterly', 'half_yearly', 'annual', 'one_time']),
});

const defaultValues = {
  name: '',
  code: '',
  category: 'GST',
  defaultPrice: 0,
  billingCycle: 'monthly',
};

function serviceCategoryBadgeClass(cat) {
  const map = {
    GST: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-500/25',
    TDS: 'bg-sky-100 text-sky-900 ring-1 ring-sky-600/15 dark:bg-sky-950/50 dark:text-sky-200',
    'Income Tax':
      'bg-violet-100 text-violet-900 ring-1 ring-violet-600/15 dark:bg-violet-950/50 dark:text-violet-200',
    ROC: 'bg-amber-100 text-amber-950 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-100',
    Audit: 'bg-rose-100 text-rose-900 ring-1 ring-rose-600/15 dark:bg-rose-950/40 dark:text-rose-100',
    Advisory: 'bg-teal-100 text-teal-900 ring-1 ring-teal-600/15 dark:bg-teal-950/40 dark:text-teal-100',
    Other: 'bg-slate-200 text-slate-800 ring-1 ring-slate-500/15 dark:bg-dm-hover dark:text-dm-fg',
  };
  return map[cat] || map.Other;
}

const BILLING_LABELS = [
  ['monthly', 'Monthly'],
  ['quarterly', 'Quarterly'],
  ['half_yearly', 'Half yearly'],
  ['annual', 'Annual'],
  ['one_time', 'One time'],
];

export default function Services() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();
  const servicesQ = useQuery({ queryKey: ['services'], queryFn: () => getServices({ limit: 200 }) });

  const form = useForm({ resolver: zodResolver(serviceSchema), defaultValues });

  const createM = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setOpen(false);
      setEditing(null);
      form.reset(defaultValues);
    },
  });
  const updateM = useMutation({
    mutationFn: updateService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setOpen(false);
      setEditing(null);
      form.reset(defaultValues);
    },
  });
  const deleteM = useMutation({
    mutationFn: deleteService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const onSubmit = (values) => {
    const payload = {
      ...values,
      code: String(values.code || '').trim().toUpperCase(),
    };
    if (editing) updateM.mutate({ id: editing._id || editing.id, payload });
    else createM.mutate(payload);
  };

  if (servicesQ.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-10 w-40" />
        <SkeletonBlock className="h-[400px] w-full" />
      </div>
    );
  }

  const rows = servicesQ.data?.items || servicesQ.data || [];
  const apiError = [createM.error, updateM.error].map((e) => e?.response?.data?.message).find(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-dm-fg">Services</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-dm-muted">Catalogue, default pricing, and billing cycles.</p>
        </div>
        <Button
          className="h-11 shrink-0"
          onClick={() => {
            setEditing(null);
            form.reset(defaultValues);
            setOpen(true);
          }}
        >
          Add service
        </Button>
      </div>

      <Card className="overflow-hidden p-0 shadow-card dark:shadow-card-dark">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-dm-hover">
              <Briefcase className="h-7 w-7 text-zinc-400" aria-hidden />
            </span>
            <p className="mt-4 font-semibold text-zinc-900 dark:text-dm-fg">No services in catalogue</p>
            <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-dm-muted">Define GST, audit, and advisory lines so billing can attach to clients.</p>
            <Button className="mt-6" onClick={() => setOpen(true)}>
              Create service
            </Button>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full table-fixed text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-dm-subtle dark:bg-dm-surface dark:text-dm-dim">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="w-24 px-4 py-3">Code</th>
                  <th className="w-36 px-4 py-3">Category</th>
                  <th className="w-32 px-4 py-3">Cycle</th>
                  <th className="w-32 px-4 py-3 text-right">Price</th>
                  <th className="w-40 px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row._id || row.id}
                    className="border-b border-slate-100 transition-colors hover:bg-emerald-50/25 dark:border-dm-subtle dark:hover:bg-dm-hover"
                  >
                    <td className="truncate px-4 py-3 font-medium text-zinc-900 dark:text-dm-table">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-dm-muted">{row.code}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                          serviceCategoryBadgeClass(row.category)
                        )}
                      >
                        {row.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-dm-muted">{formatBillingCycle(row.billingCycle)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-zinc-900 dark:text-dm-green">
                      {formatINR(row.defaultPrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(row);
                            form.reset({
                              name: row.name || '',
                              code: row.code || '',
                              category: row.category || 'GST',
                              defaultPrice: Number(row.defaultPrice) || 0,
                              billingCycle: row.billingCycle || 'monthly',
                            });
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => deleteM.mutate(row._id || row.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Service' : 'Add Service'}>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          {apiError && (
            <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:bg-[#450a0a]/30 dark:text-dm-danger">{apiError}</p>
          )}
          <Input placeholder="Name" {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-xs text-rose-600">{form.formState.errors.name.message}</p>
          )}
          <Input placeholder="Code" {...form.register('code')} />
          {form.formState.errors.code && (
            <p className="text-xs text-rose-600">{form.formState.errors.code.message}</p>
          )}
          <Select {...form.register('category')}>
            <option>GST</option>
            <option>TDS</option>
            <option>Income Tax</option>
            <option>ROC</option>
            <option>Audit</option>
            <option>Advisory</option>
            <option>Other</option>
          </Select>
          <Input placeholder="Default Price" type="number" step="0.01" {...form.register('defaultPrice')} />
          {form.formState.errors.defaultPrice && (
            <p className="text-xs text-rose-600">{form.formState.errors.defaultPrice.message}</p>
          )}
          <Select {...form.register('billingCycle')}>
            {BILLING_LABELS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createM.isPending || updateM.isPending}>
              {createM.isPending || updateM.isPending ? 'Saving…' : editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
