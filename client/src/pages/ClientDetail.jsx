import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { getBillingEntries, getClient, getClientServices, getPayments, updateClient } from '../lib/api';
import {
  formatBillingCycle,
  formatDate,
  formatINR,
  formatInvoiceStatus,
  formatPaymentMode,
  getAvatarToneClass,
  getInitials,
} from '../lib/utils';
import { Card } from '../components/ui/card';
import { SkeletonBlock } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';

const tabs = ['Overview', 'Services', 'Billing History', 'Payments', 'Notes'];

export default function ClientDetail() {
  const { clientId } = useParams();
  const [tab, setTab] = useState('Overview');
  const [notesDraft, setNotesDraft] = useState('');
  const queryClient = useQueryClient();

  const [clientQ, servicesQ, billingQ, paymentsQ] = useQueries({
    queries: [
      { queryKey: ['client', clientId], queryFn: () => getClient(clientId) },
      { queryKey: ['client-services', clientId], queryFn: () => getClientServices(clientId) },
      { queryKey: ['billing', 'client', clientId], queryFn: () => getBillingEntries({ clientId, limit: 200 }) },
      { queryKey: ['payments', 'client', clientId], queryFn: () => getPayments({ clientId, limit: 200 }) },
    ],
  });

  const client = clientQ.data ?? {};

  useEffect(() => {
    if (client?.notes !== undefined) setNotesDraft(client.notes || '');
  }, [clientId, client?.notes]);

  const saveNotesM = useMutation({
    mutationFn: () =>
      updateClient({
        id: clientId,
        payload: { notes: notesDraft },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  if (clientQ.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-12 w-72" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-24 w-full" />
          ))}
        </div>
        <SkeletonBlock className="h-64 w-full" />
      </div>
    );
  }

  const services = servicesQ.data?.items || servicesQ.data?.services || [];
  const billings = billingQ.data?.billings || billingQ.data?.items || billingQ.data || [];
  const payments = paymentsQ.data?.payments || paymentsQ.data?.items || paymentsQ.data || [];

  const totalBilled = billings.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const collected = payments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const outstanding = billings.reduce((sum, row) => sum + Number(row.balance || 0), 0);
  const oldestUnpaid = billings.find((row) => Number(row.balance || 0) > 0)?.dueDate;

  const name = client.name || 'Client';
  const initials = getInitials(name, 2);
  const tone = getAvatarToneClass(name);

  const kpi = [
    { label: 'Total billed (FY)', value: formatINR(totalBilled), border: 'border-l-emerald-600 dark:border-l-emerald-500' },
    { label: 'Collected', value: formatINR(collected), border: 'border-l-sky-600 dark:border-l-sky-500' },
    {
      label: 'Outstanding',
      value: formatINR(outstanding),
      border: 'border-l-rose-500 dark:border-l-rose-400',
      valueClass: outstanding > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-400',
    },
    { label: 'Oldest unpaid due', value: formatDate(oldestUnpaid), border: 'border-l-amber-500 dark:border-l-amber-400', small: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-lg font-bold ${tone}`}>{initials}</span>
          <div className="min-w-0">
            <Link
              to="/clients"
              className="focus-ring inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Clients
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">{name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <Building2 className="h-4 w-4 shrink-0" aria-hidden />
              {client.email || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpi.map((item) => (
          <Card key={item.label} className={`border-l-4 ${item.border} p-4`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{item.label}</p>
            <p
              className={`mt-2 font-bold tabular-nums text-zinc-900 dark:text-white ${item.small ? 'text-sm' : 'text-xl'} ${item.valueClass || ''}`}
            >
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-1 dark:border-zinc-800">
        {tabs.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={tab === item ? 'default' : 'ghost'}
            className={tab === item ? '' : 'text-zinc-600 dark:text-zinc-400'}
            onClick={() => setTab(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      <Card>
        {tab === 'Overview' && (
          <div className="grid gap-4 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
            <p>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Phone</span>
              <br />
              {client.phone || '—'}
            </p>
            <p>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">PAN</span>
              <br />
              {client.pan || '—'}
            </p>
            <p>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">GSTIN</span>
              <br />
              {client.gstin || '—'}
            </p>
            <p>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">City</span>
              <br />
              {client.city || '—'}
            </p>
          </div>
        )}
        {tab === 'Services' && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="py-2 pr-4">Service name</th>
                  <th className="py-2 pr-4 text-right">Custom price</th>
                  <th className="py-2 pr-4">Billing cycle</th>
                  <th className="py-2 pr-4">Start date</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No services linked.
                    </td>
                  </tr>
                ) : (
                  services.map((s) => {
                    const svc = s.serviceId || s.service;
                    const svcName = svc?.name || '—';
                    const cycle = s.billingCycle || svc?.billingCycle;
                    const active = s.isActive !== false;
                    return (
                      <tr key={s._id || s.id}>
                        <td className="py-3 font-medium text-zinc-900 dark:text-white">{svcName}</td>
                        <td className="py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-200">
                          {formatINR(s.customPrice ?? svc?.defaultPrice)}
                        </td>
                        <td className="py-3 text-zinc-600 dark:text-zinc-400">{formatBillingCycle(cycle)}</td>
                        <td className="py-3 text-zinc-600 dark:text-zinc-400">{formatDate(s.startDate)}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                              active
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300'
                            }`}
                          >
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'Billing History' && (
          <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {billings.length === 0 ? (
              <li className="py-8 text-center text-zinc-500">No billing records.</li>
            ) : (
              billings.map((b) => (
                <li key={b._id || b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="text-zinc-600 dark:text-zinc-400">{formatDate(b.dueDate)}</span>
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-white">{formatINR(b.amount)}</span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {formatInvoiceStatus(b.status)}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
        {tab === 'Payments' && (
          <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {payments.length === 0 ? (
              <li className="py-8 text-center text-zinc-500">No payments recorded.</li>
            ) : (
              payments.map((p) => (
                <li key={p._id || p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="text-zinc-600 dark:text-zinc-400">{formatDate(p.receivedOn)}</span>
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-white">{formatINR(p.amount)}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{formatPaymentMode(p.mode)}</span>
                </li>
              ))
            )}
          </ul>
        )}
        {tab === 'Notes' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Client notes</label>
            <textarea
              className="focus-ring min-h-[160px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Engagement notes, reminders, or context for this client…"
            />
            {saveNotesM.error?.response?.data?.message && (
              <p className="text-sm text-rose-600">{saveNotesM.error.response.data.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNotesDraft(client.notes || '')}>
                Reset
              </Button>
              <Button type="button" onClick={() => saveNotesM.mutate()} disabled={saveNotesM.isPending}>
                {saveNotesM.isPending ? 'Saving…' : 'Save notes'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
