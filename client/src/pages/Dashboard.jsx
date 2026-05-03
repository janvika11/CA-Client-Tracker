import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  IndianRupee,
  LayoutGrid,
  Users,
  Wallet,
} from 'lucide-react';
import { getBillingEntries, getClients, getPayments, getServices } from '../lib/api';
import { formatDate, formatINR, formatINRShort, getAvatarToneClass, getInitials } from '../lib/utils';
import { DashboardErrorBoundary } from '../components/DashboardErrorBoundary';
import { Card } from '../components/ui/card';
import { SkeletonBlock } from '../components/ui/skeleton';

/** KPI rows store `icon` as a component ref — keep these at module scope (same bindings as top-level imports). */
const DashboardIcons = {
  Activity,
  AlertTriangle,
  IndianRupee,
  LayoutGrid,
  Users,
  Wallet,
};

dayjs.extend(advancedFormat);

const AGING_BUCKET_ORDER = ['0-30', '31-60', '61-90', '90+'];
const AGING_LABELS = { '0-30': '0–30d', '31-60': '31–60d', '61-90': '61–90d', '90+': '90+d' };

function asArray(payload, keys) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== 'object') return [];
  for (const k of keys) {
    if (Array.isArray(payload?.[k])) return payload[k];
  }
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function DashboardBody({ clientsData, paymentsData, billingsData, servicesData }) {

  const clientRows = asArray(clientsData, ['clients']).filter(Boolean);
  const paymentRows = asArray(paymentsData, ['payments']).filter(Boolean);
  const billingRows = asArray(billingsData, ['billings']).filter(Boolean);
  const serviceRows = asArray(servicesData, ['services']).filter(Boolean);

  const now = dayjs();
  const welcomeDate = now.format('dddd, D MMMM YYYY').toUpperCase();
  const activeCount = clientRows.filter((client) => client?.status === 'active').length;
  const totalClientCount = clientRows.length;
  const totalOutstanding = billingRows.reduce((sum, row) => sum + Number(row?.balance || 0), 0);
  const collectedThisMonth = paymentRows
    .filter((row) => {
      const received = row?.receivedOn;
      if (received == null) return false;
      const d = dayjs(received);
      return d.isValid() && d.month() === now.month() && d.year() === now.year();
    })
    .reduce((sum, row) => sum + Number(row?.amount ?? 0), 0);

  const overdueAges = { over30: 0, over60: 0, over90: 0 };
  const agingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  billingRows.forEach((row) => {
    const balance = Number(row?.balance || 0);
    if (!balance) return;
    const due = dayjs(row?.dueDate);
    if (!due.isValid()) return;
    const age = Math.max(0, now.diff(due, 'day'));
    if (age > 30) overdueAges.over30 += balance;
    if (age > 60) overdueAges.over60 += balance;
    if (age > 90) overdueAges.over90 += balance;
    if (age <= 30) agingBuckets['0-30'] += balance;
    else if (age <= 60) agingBuckets['31-60'] += balance;
    else if (age <= 90) agingBuckets['61-90'] += balance;
    else agingBuckets['90+'] += balance;
  });

  const agingTotal = AGING_BUCKET_ORDER.reduce((sum, key) => sum + Number(agingBuckets[key] || 0), 0);

  const monthKeys = Array.from({ length: 6 }).map((_, index) => now.subtract(5 - index, 'month').format('MMM YY'));
  const monthlyMap = Object.fromEntries(monthKeys.map((key) => [key, { month: key, Billed: 0, Collected: 0 }]));
  billingRows.forEach((row) => {
    const d = dayjs(row?.dueDate || row?.createdAt);
    if (!d.isValid()) return;
    const key = d.format('MMM YY');
    if (monthlyMap[key]) monthlyMap[key].Billed += Number(row?.amount || 0);
  });
  paymentRows.forEach((row) => {
    const d = dayjs(row?.receivedOn);
    if (!d.isValid()) return;
    const key = d.format('MMM YY');
    if (monthlyMap[key]) monthlyMap[key].Collected += Number(row?.amount || 0);
  });
  const monthlyChart = Object.values(monthlyMap);
  const monthlyMax = Math.max(
    1,
    ...monthlyChart.map((m) => Math.max(Number(m.Billed) || 0, Number(m.Collected) || 0))
  );

  const topClientsMap = {};
  billingRows.forEach((row) => {
    const key = row?.clientId?._id || row?.clientId || 'unknown';
    const name = row?.clientId?.name || 'Unknown Client';
    if (!topClientsMap[key]) topClientsMap[key] = { name, outstanding: 0 };
    topClientsMap[key].outstanding += Number(row?.balance || 0);
  });
  const topClients = Object.values(topClientsMap).sort((a, b) => b.outstanding - a.outstanding).slice(0, 10);

  const revenueByService = serviceRows
    .map((service) => {
      if (service == null || typeof service !== 'object') return { name: 'Service', value: 0 };
      const id = service?._id ?? service?.id;
      const sid = id != null ? String(id) : '';
      const revenue = billingRows
        .filter((row) => String(row?.serviceId?._id ?? row?.serviceId ?? '') === sid)
        .reduce((sum, row) => sum + Number(row?.amountPaid ?? 0), 0);
      const name = service?.name || 'Service';
      return { name, value: revenue };
    })
    .filter((row) => Number(row?.value) > 0);

  const activityFeed = [
    ...paymentRows.slice(0, 20).map((row) => ({
      type: 'payment',
      date: row?.receivedOn,
      clientName: row?.clientId?.name || 'Client',
      text: `Payment ${formatINR(row?.amount)} received from ${row?.clientId?.name || 'client'}`,
    })),
    ...billingRows
      .filter((row) => row?.status === 'overdue')
      .slice(0, 20)
      .map((row) => ({
        type: 'overdue',
        date: row?.dueDate,
        clientName: row?.clientId?.name || 'Client',
        text: `Overdue: ${row?.clientId?.name || 'Client'} — ${formatINR(row?.balance || row?.amount)}`,
      })),
  ]
    .sort((a, b) => (dayjs(b.date).valueOf() || 0) - (dayjs(a.date).valueOf() || 0))
    .slice(0, 16);

  const serviceBarHue = [
    'bg-emerald-600 dark:bg-emerald-500',
    'bg-amber-500 dark:bg-amber-500',
    'bg-rose-500 dark:bg-rose-500',
    'bg-slate-500 dark:bg-slate-400',
    'bg-sky-500 dark:bg-sky-400',
    'bg-teal-600 dark:bg-teal-500',
  ];

  const kpis = [
    {
      label: 'Total outstanding',
      value: formatINR(totalOutstanding),
      border: 'border-l-rose-500 dark:border-l-dm-danger',
      icon: DashboardIcons.AlertTriangle,
      iconWrap: 'bg-rose-100 text-rose-700 dark:bg-[#450a0a]/50 dark:text-dm-danger dark:shadow-[inset_0_0_0_1px_rgba(248,113,113,0.35)]',
      valueClass: 'dark:text-dm-danger',
    },
    {
      label: 'Collected this month',
      value: formatINR(collectedThisMonth),
      border: 'border-l-emerald-600 dark:border-l-dm-green',
      icon: DashboardIcons.Wallet,
      iconWrap:
        'bg-emerald-100 text-emerald-800 dark:bg-[#064e3b]/55 dark:text-dm-green dark:shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35)]',
      valueClass: 'dark:text-dm-green',
    },
    {
      label: 'Overdue 30 / 60 / 90+ days',
      value: `${formatINR(overdueAges.over30)} · ${formatINR(overdueAges.over60)} · ${formatINR(overdueAges.over90)}`,
      border: 'border-l-amber-500 dark:border-l-dm-warn',
      icon: DashboardIcons.Activity,
      iconWrap:
        'bg-amber-100 text-amber-900 dark:bg-[#451a03]/55 dark:text-dm-warn dark:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.3)]',
      small: true,
      valueClass: 'dark:text-dm-warn',
    },
    {
      label: 'Active clients',
      value: String(activeCount),
      border: 'border-l-sky-600 dark:border-l-dm-info',
      icon: DashboardIcons.Users,
      iconWrap:
        'bg-sky-100 text-sky-800 dark:bg-[#1e3a5f]/65 dark:text-dm-info dark:shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35)]',
      valueClass: 'dark:text-dm-green',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-6 dark:border-dm-border sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#059669] dark:text-dm-accent">{welcomeDate}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-dm-fg">Dashboard</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-dm-muted">
            Collections, aging, and receivables exposure at a glance for your CA practice.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon ?? DashboardIcons.Activity;
          return (
            <Card key={kpi.label} className={`border-l-4 ${kpi.border} p-0 shadow-card`}>
              <div className="flex items-start gap-4 p-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${kpi.iconWrap}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-[#94a3b8]">{kpi.label}</p>
                  {kpi.kind === 'activeSplit' ? (
                    <p className="mt-2">
                      <span className="text-3xl font-bold tabular-nums text-sky-600 dark:text-[#60a5fa]">{activeCount}</span>
                      <span className="ml-1.5 text-sm font-medium tabular-nums text-zinc-500 dark:text-dm-muted">
                        out of {totalClientCount} total
                      </span>
                    </p>
                  ) : (
                    <p
                      className={`mt-1 font-bold tabular-nums ${kpi.valueClass ?? 'text-slate-900 dark:text-dm-fg'} ${kpi.small ? 'text-sm leading-relaxed sm:text-[13px]' : 'text-[1.65rem] leading-tight tracking-tight'}`}
                    >
                      {kpi.value}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="shadow-card dark:shadow-card-dark">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Monthly billed vs collected</h2>
              <p className="text-xs text-zinc-500 dark:text-[#475569]">Last six rolling months · bars in ₹</p>
            </div>
            <LayoutGrid className="mt-0.5 h-4 w-4 text-zinc-400 dark:text-dm-muted" aria-hidden />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 dark:text-dm-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-zinc-400 dark:bg-slate-500" /> Billed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-emerald-600 dark:bg-emerald-500" /> Collected
            </span>
          </div>
          <div className="mt-4 flex h-44 items-end justify-between gap-1 border-t border-zinc-100 pt-4 dark:border-dm-border">
            {monthlyChart.map((m, mi) => {
              if (m == null || typeof m !== 'object') return null;
              const label = m.month ?? `m-${mi}`;
              const billed = Number(m.Billed) || 0;
              const collected = Number(m.Collected) || 0;
              const denom = Number.isFinite(monthlyMax) && monthlyMax > 0 ? monthlyMax : 1;
              const pctB = Math.round((billed / denom) * 100);
              const pctC = Math.round((collected / denom) * 100);
              const hasMonth = billed > 0 || collected > 0;
              return (
                <div key={label} className="flex min-w-0 flex-1 flex-col items-center">
                  <div className="mx-auto flex h-36 w-full max-w-[3.5rem] items-end justify-center gap-1">
                    <div
                      className="min-h-0 w-[42%] max-w-3 rounded-t bg-zinc-400 dark:bg-slate-500"
                      style={{ height: `${hasMonth ? Math.max(pctB, billed ? 2 : 0) : 0}%` }}
                      title={`Billed ${formatINR(billed)}`}
                    />
                    <div
                      className="min-h-0 w-[42%] max-w-3 rounded-t bg-emerald-600 dark:bg-emerald-500"
                      style={{ height: `${hasMonth ? Math.max(pctC, collected ? 2 : 0) : 0}%` }}
                      title={`Collected ${formatINR(collected)}`}
                    />
                  </div>
                  <span className="mt-2 truncate text-center text-[10px] font-semibold text-zinc-500 dark:text-dm-muted">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="shadow-card dark:shadow-card-dark">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Outstanding aging</h2>
            <p className="text-xs text-zinc-500 dark:text-[#475569]">0–30d · 31–60d · 61–90d · 90+d buckets</p>
          </div>
          {agingTotal > 0 ? (
            <div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {AGING_BUCKET_ORDER.map((key) => {
                  const val = Number(agingBuckets[key] || 0);
                  const share = agingTotal > 0 ? Math.round((val / agingTotal) * 100) : 0;
                  const barTone = {
                    '0-30': 'bg-emerald-500/90 dark:bg-emerald-500/80',
                    '31-60': 'bg-amber-500/90 dark:bg-amber-500/80',
                    '61-90': 'bg-orange-500/90 dark:bg-orange-500/70',
                    '90+': 'bg-red-700/90 dark:bg-red-600/85',
                  };
                  const toneClass = barTone[key] ?? 'bg-zinc-400 dark:bg-zinc-500';
                  return (
                    <div
                      key={key}
                      className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-dm-border dark:bg-dm-hover/30"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-dm-muted">
                        {AGING_LABELS[key] ?? key}
                      </p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-zinc-900 dark:text-dm-fg">{formatINR(val)}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-dm-subtle">
                        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${share}%` }} />
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-500 dark:text-dm-dim">{share}% of total</p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-sm tabular-nums text-zinc-700 dark:text-dm-muted">
                <span className="font-semibold text-zinc-900 dark:text-dm-fg">{formatINRShort(agingTotal)}</span>
                <span className="ml-1 text-xs font-medium uppercase tracking-wide"> total outstanding</span>
              </p>
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 text-center dark:border-dm-border dark:bg-dm-hover/25">
              <p className="text-sm font-medium text-zinc-600 dark:text-dm-muted">No receivables in aging buckets</p>
              <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-dm-dim">
                Chart appears when there is outstanding balance with due dates.
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="shadow-card dark:shadow-card-dark">
          <div className="mb-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Top clients by outstanding</h2>
            <p className="text-xs text-zinc-500 dark:text-dm-muted">Highest receivable balance</p>
          </div>
          {topClients.length > 0 ? (
            <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {topClients.map((c, i) => {
                if (c == null || typeof c !== 'object') return null;
                const name = c.name ?? 'Unknown';
                const out = Number(c.outstanding ?? 0);
                const maxO = Math.max(Number(topClients[0]?.outstanding ?? 0), 1);
                const w = Math.round((out / maxO) * 100);
                return (
                  <div
                    key={`${name}-${i}`}
                    className="rounded-lg border border-zinc-100 bg-white/80 px-3 py-2 dark:border-dm-border dark:bg-dm-bg/40"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate font-medium text-zinc-800 dark:text-dm-fg">
                        {i + 1}. {name}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-rose-600 dark:text-red-400">
                        {formatINR(out)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-dm-subtle">
                      <div
                        className="h-full rounded-full bg-rose-400 dark:bg-rose-500/90"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 text-center text-sm text-zinc-500 dark:border-dm-border dark:bg-dm-hover/20 dark:text-dm-muted">
              No client-level outstanding yet.
            </div>
          )}
        </Card>

        <Card className="shadow-card dark:shadow-card-dark">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Service revenue (collected)</h2>
              <p className="text-xs text-zinc-500 dark:text-dm-muted">By service line</p>
            </div>
            <IndianRupee className="h-4 w-4 text-zinc-400 dark:text-dm-muted" aria-hidden />
          </div>
          {revenueByService.length > 0 ? (
            <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {revenueByService.map((row, idx) => {
                if (row == null || typeof row !== 'object') return null;
                const rowName = row.name ?? 'Service';
                const rowVal = Number(row.value ?? 0);
                const maxRev = Math.max(
                  1,
                  ...revenueByService.map((r) => Number(r?.value ?? 0)).filter((n) => Number.isFinite(n))
                );
                const safeMax = Number.isFinite(maxRev) && maxRev > 0 ? maxRev : 1;
                const w = Math.round((rowVal / safeMax) * 100);
                return (
                  <div
                    key={`${rowName}-${idx}`}
                    className="rounded-lg border border-zinc-100 bg-white/80 px-3 py-2 dark:border-dm-border dark:bg-dm-bg/40"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate font-medium text-zinc-800 dark:text-dm-fg">{rowName}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatINR(rowVal)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-dm-subtle">
                      <div
                        className={`h-full rounded-full ${serviceBarHue[idx % serviceBarHue.length]}`}
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 text-center text-sm text-zinc-500 dark:border-dm-border dark:bg-dm-hover/20 dark:text-dm-muted">
              No collected revenue by service line yet.
            </div>
          )}
        </Card>
      </div>

      <Card className="shadow-card dark:shadow-card-dark">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Recent activity</h2>
        <p className="text-xs text-zinc-500 dark:text-dm-muted">Payments and overdue notices</p>

        {activityFeed.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 py-12 text-center dark:border-dm-border">
            <Wallet className="h-10 w-10 text-zinc-300 dark:text-dm-muted" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-dm-muted">No recent activity yet</p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">Record payments or generate billing to see a live feed here.</p>
          </div>
        ) : (
          <ul className="relative mt-6 space-y-0 pl-2">
            <span
              className="absolute left-[19px] top-2 bottom-2 w-px bg-zinc-200 dark:bg-dm-subtle"
              aria-hidden
            />
            {activityFeed.map((item, index) => {
              if (item == null || typeof item !== 'object') return null;
              const initials = getInitials(item.clientName ?? item.text ?? '', 2);
              const tone = getAvatarToneClass(item.clientName ?? String(index));
              return (
                <li key={`${item.type ?? 'row'}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
                  <span
                    className={`relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-md ring-4 ring-white dark:ring-dm-bg ${tone}`}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        item.type === 'payment'
                          ? 'text-zinc-800 dark:text-dm-table'
                          : 'text-rose-800 dark:text-dm-danger'
                      }`}
                    >
                      {item.text ?? '—'}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-dm-muted">{formatDate(item?.date)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const clients = useQuery({ queryKey: ['clients', 'stats'], queryFn: () => getClients({ limit: 500 }) });
  const payments = useQuery({ queryKey: ['payments', 'dashboard'], queryFn: () => getPayments({ limit: 200 }) });
  const billings = useQuery({ queryKey: ['billing', 'dashboard'], queryFn: () => getBillingEntries({ limit: 1000 }) });
  const services = useQuery({ queryKey: ['services', 'dashboard'], queryFn: () => getServices({ limit: 500 }) });

  const dashboardQueries = [clients, payments, billings, services];
  const loading = dashboardQueries.some((q) => q.isPending);
  const failedQuery = dashboardQueries.find((q) => q.isError);

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="text-sm font-medium text-slate-600 dark:text-dm-muted">Loading dashboard…</p>
        <SkeletonBlock className="h-16 w-full max-w-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-28 w-full" />
          ))}
        </div>
        <SkeletonBlock className="h-[360px] w-full" />
      </div>
    );
  }

  if (failedQuery) {
    const msg =
      failedQuery.error?.response?.data?.message ||
      failedQuery.error?.message ||
      'Request failed. Check that you are signed in and the API is reachable.';
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50/90 p-6 text-rose-900 dark:border-dm-danger/40 dark:bg-[#450a0a]/35 dark:text-dm-danger">
        <p className="font-semibold">Could not load dashboard</p>
        <p className="mt-1 text-sm opacity-90">{msg}</p>
        <button
          type="button"
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 dark:bg-dm-danger dark:hover:opacity-90"
          onClick={() => dashboardQueries.forEach((q) => void q.refetch())}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <DashboardBody
        clientsData={clients.data}
        paymentsData={payments.data}
        billingsData={billings.data}
        servicesData={services.data}
      />
    </DashboardErrorBoundary>
  );
}
