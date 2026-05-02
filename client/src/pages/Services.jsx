import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createService, deleteService, getServices, updateService } from '../lib/api';
import { formatBillingCycle } from '../lib/utils';
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Services</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Catalogue, default pricing, and billing cycles.</p>
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

      <Card className="overflow-hidden p-0">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Briefcase className="h-7 w-7 text-zinc-400" aria-hidden />
            </span>
            <p className="mt-4 font-semibold text-zinc-900 dark:text-white">No services in catalogue</p>
            <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">Define GST, audit, and advisory lines so billing can attach to clients.</p>
            <Button className="mt-6" onClick={() => setOpen(true)}>
              Create service
            </Button>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/90 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row._id || row.id}
                    className="border-t border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{row.name}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.code}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.category}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatBillingCycle(row.billingCycle)}</td>
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
            <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">{apiError}</p>
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
