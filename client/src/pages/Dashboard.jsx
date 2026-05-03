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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getBillingEntries, getClients, getPayments, getServices } from '../lib/api';
import { formatDate, formatINR, formatINRShort, getAvatarToneClass, getInitials } from '../lib/utils';
import { DashboardErrorBoundary } from '../components/DashboardErrorBoundary';
import { Card } from '../components/ui/card';
import { SkeletonBlock } from '../components/ui/skeleton';
import { useUIStore } from '../store/uiStore';

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
const AGING_DONUT_COLORS = ['#34d399', '#fbbf24', '#fb923c', '#f87171'];
const SERVICE_CHART_COLORS = ['#8b5cf6', '#34d399', '#fbbf24', '#fb7185', '#22d3ee', '#a78bfa'];

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
  const isDark = useUIStore((state) => state.isDark);
  const chartGrid = isDark ? '#2a2a42' : '#e8e8f0';
  const chartAxis = isDark ? '#8b8ba8' : '#64748b';
  const chartTooltipStyle = {
    borderRadius: 12,
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
    backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.45)' : '0 4px 16px rgba(0,0,0,0.08)',
  };

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

  const agingDonutData = AGING_BUCKET_ORDER.map((key) => ({
    name: AGING_LABELS[key] ?? key,
    key,
    value: Number(agingBuckets[key] || 0),
  }));

  const serviceBarChartData = [...revenueByService]
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 10)
    .map((row, idx) => ({
      name: row.name.length > 22 ? `${row.name.slice(0, 20)}…` : row.name,
      fullName: row.name,
      value: Number(row.value || 0),
      fill: SERVICE_CHART_COLORS[idx % SERVICE_CHART_COLORS.length],
    }));

  const kpis = [
    {
      label: 'Total outstanding',
      value: formatINR(totalOutstanding),
      icon: DashboardIcons.AlertTriangle,
      iconWrap:
        'bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/25 dark:bg-rose-500/10 dark:text-dm-danger dark:ring-rose-400/20',
      valueClass: 'text-rose-700 dark:text-dm-danger',
    },
    {
      label: 'Collected this month',
      value: formatINR(collectedThisMonth),
      icon: DashboardIcons.Wallet,
      iconWrap:
        'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-dm-green dark:ring-emerald-400/20',
      valueClass: 'text-emerald-800 dark:text-dm-green',
    },
    {
      label: 'Overdue 30 / 60 / 90+ days',
      value: `${formatINR(overdueAges.over30)} · ${formatINR(overdueAges.over60)} · ${formatINR(overdueAges.over90)}`,
      icon: DashboardIcons.Activity,
      iconWrap:
        'bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/25 dark:bg-amber-500/10 dark:text-dm-warn dark:ring-amber-400/20',
      small: true,
      valueClass: 'text-amber-900 dark:text-dm-warn',
    },
    {
      label: 'Active clients',
      value: String(activeCount),
      sub: `${totalClientCount} total in workspace`,
      icon: DashboardIcons.Users,
      iconWrap:
        'bg-violet-500/15 text-violet-700 ring-1 ring-violet-500/25 dark:bg-violet-500/10 dark:text-dm-accent dark:ring-violet-400/25',
      valueClass: 'text-slate-900 dark:text-dm-fg',
    },
  ];

  const monthlyTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl px-3 py-2 text-xs shadow-lg" style={chartTooltipStyle}>
        <p className="mb-1.5 font-semibold text-zinc-800 dark:text-dm-fg">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="tabular-nums text-zinc-600 dark:text-dm-muted">
            <span className="font-medium text-zinc-500 dark:text-dm-dim">{entry.name}:</span>{' '}
            <span className="text-zinc-900 dark:text-dm-fg">{formatINR(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  };

  const agingTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    if (!row) return null;
    return (
      <div className="rounded-xl px-3 py-2 text-xs shadow-lg" style={chartTooltipStyle}>
        <p className="font-semibold text-zinc-800 dark:text-dm-fg">{row.name}</p>
        <p className="mt-0.5 tabular-nums text-zinc-900 dark:text-dm-fg">{formatINR(row.value)}</p>
      </div>
    );
  };

  const serviceTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    if (!row) return null;
    return (
      <div className="max-w-xs rounded-xl px-3 py-2 text-xs shadow-lg" style={chartTooltipStyle}>
        <p className="font-semibold text-zinc-800 dark:text-dm-fg">{row.fullName}</p>
        <p className="mt-0.5 tabular-nums text-zinc-900 dark:text-dm-fg">{formatINR(row.value)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-8 dark:border-white/[0.06] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-dm-accent">
            {welcomeDate}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-dm-fg sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-dm-muted">
            Collections, aging, and receivables exposure at a glance for your CA practice.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon ?? DashboardIcons.Activity;
          return (
            <Card key={kpi.label} className="p-0 shadow-card dark:shadow-card-dark">
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-dm-dim">
                    {kpi.label}
                  </p>
                  <p
                    className={`mt-3 font-semibold tabular-nums tracking-tight ${kpi.valueClass ?? 'text-slate-900 dark:text-dm-fg'} ${kpi.small ? 'text-sm leading-relaxed sm:text-[13px]' : 'text-3xl sm:text-[2rem]'}`}
                  >
                    {kpi.value}
                  </p>
                  {kpi.sub ? (
                    <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-dm-muted">{kpi.sub}</p>
                  ) : null}
                </div>
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${kpi.iconWrap}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="p-5 shadow-card dark:shadow-card-dark xl:col-span-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Monthly billed vs collected</h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-dm-muted">Last six months · grouped bars (₹)</p>
            </div>
            <LayoutGrid className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-dm-dim" aria-hidden />
          </div>
          <div className="mb-3 flex flex-wrap gap-4 text-[11px] font-medium text-zinc-500 dark:text-dm-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-500" /> Billed
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Collected
            </span>
          </div>
          <div className="h-[min(22rem,50vw)] w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="18%">
                <CartesianGrid stroke={chartGrid} strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: chartAxis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatINRShort(v)}
                  tick={{ fill: chartAxis, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip content={monthlyTooltip} cursor={{ fill: isDark ? 'rgba(167,139,250,0.06)' : 'rgba(139,92,246,0.08)' }} />
                <Bar dataKey="Billed" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Collected" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 shadow-card dark:shadow-card-dark xl:col-span-2">
          <div className="mb-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Outstanding aging</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-dm-muted">Share of receivables by due-date bucket</p>
          </div>
          {agingTotal > 0 ? (
            <div className="relative mt-2">
              <div className="h-[min(20rem,55vw)] w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={agingDonutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="82%"
                      paddingAngle={2}
                      stroke={isDark ? '#1a1a2e' : '#fff'}
                      strokeWidth={2}
                    >
                      {agingDonutData.map((entry, index) => (
                        <Cell key={entry.key} fill={AGING_DONUT_COLORS[index % AGING_DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={agingTooltip} />
                    <Legend
                      verticalAlign="bottom"
                      height={28}
                      formatter={(value) => <span className="text-[11px] text-zinc-600 dark:text-dm-muted">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pointer-events-none absolute left-1/2 top-[42%] z-[1] -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-dm-dim">Total</p>
                <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-dm-fg">{formatINRShort(agingTotal)}</p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 text-center dark:border-white/[0.08] dark:bg-dm-hover/20">
              <p className="text-sm font-medium text-zinc-600 dark:text-dm-muted">No receivables in aging buckets</p>
              <p className="mt-1 max-w-xs px-4 text-xs text-zinc-500 dark:text-dm-dim">
                Chart appears when there is outstanding balance with due dates.
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5 shadow-card dark:shadow-card-dark">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Top clients by outstanding</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-dm-muted">Highest receivable balance</p>
          </div>
          {topClients.length > 0 ? (
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {topClients.map((c, i) => {
                if (c == null || typeof c !== 'object') return null;
                const name = c.name ?? 'Unknown';
                const out = Number(c.outstanding ?? 0);
                const maxO = Math.max(Number(topClients[0]?.outstanding ?? 0), 1);
                const w = Math.round((out / maxO) * 100);
                return (
                  <div
                    key={`${name}-${i}`}
                    className="rounded-xl border border-zinc-100/90 bg-zinc-50/50 px-3 py-2.5 dark:border-white/[0.06] dark:bg-dm-bg/30"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate font-medium text-zinc-800 dark:text-dm-fg">
                        {i + 1}. {name}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-rose-600 dark:text-dm-danger">
                        {formatINR(out)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200/90 dark:bg-dm-subtle">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 dark:from-rose-500/90 dark:to-dm-danger"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 text-center text-sm text-zinc-500 dark:border-white/[0.08] dark:bg-dm-hover/15 dark:text-dm-muted">
              No client-level outstanding yet.
            </div>
          )}
        </Card>

        <Card className="p-5 shadow-card dark:shadow-card-dark">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Service revenue (collected)</h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-dm-muted">Horizontal bars by service line</p>
            </div>
            <IndianRupee className="h-4 w-4 shrink-0 text-zinc-400 dark:text-dm-dim" aria-hidden />
          </div>
          {serviceBarChartData.length > 0 ? (
            <div className="h-[min(22rem,70vw)] w-full min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={serviceBarChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                  barCategoryGap="16%"
                >
                  <CartesianGrid stroke={chartGrid} strokeDasharray="4 4" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatINRShort(v)}
                    tick={{ fill: chartAxis, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={108}
                    tick={{ fill: chartAxis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={serviceTooltip} cursor={{ fill: isDark ? 'rgba(167,139,250,0.06)' : 'rgba(139,92,246,0.06)' }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={22}>
                    {serviceBarChartData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 text-center text-sm text-zinc-500 dark:border-white/[0.08] dark:bg-dm-hover/15 dark:text-dm-muted">
              No collected revenue by service line yet.
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5 shadow-card dark:shadow-card-dark">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Recent activity</h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-dm-muted">Payments and overdue notices</p>

        {activityFeed.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-12 text-center dark:border-white/[0.08]">
            <Wallet className="h-10 w-10 text-zinc-300 dark:text-dm-muted" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-dm-muted">No recent activity yet</p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-dm-dim">
              Record payments or generate billing to see a live feed here.
            </p>
          </div>
        ) : (
          <ul className="relative mt-6 space-y-0 pl-2">
            <span
              className="absolute left-[19px] top-2 bottom-2 w-px bg-zinc-200 dark:bg-dm-border"
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
