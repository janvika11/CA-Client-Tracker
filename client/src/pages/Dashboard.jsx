import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  IndianRupee,
  LayoutGrid,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
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
import { useUIStore } from '../store/uiStore';
import { Card } from '../components/ui/card';
import { SkeletonBlock } from '../components/ui/skeleton';

dayjs.extend(advancedFormat);

const chartTooltipLight = {
  contentStyle: {
    borderRadius: '8px',
    border: '1px solid rgb(228 228 231)',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
    fontSize: '12px',
  },
  labelStyle: { fontWeight: 600, marginBottom: 4 },
};

const chartTooltipDark = {
  contentStyle: {
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    boxShadow: '0 12px 48px rgba(15,23,42,0.55)',
    fontSize: '12px',
  },
  labelStyle: { fontWeight: 600, marginBottom: 4, color: '#f1f5f9' },
};

const legendStyleLight = { fontSize: 12 };

const legendStyleDark = { fontSize: 12, color: '#94a3b8' };

/** Billed bars — mockup subtle blue `#1e3a5f`; collected bars accent `#059669`. */
const billedBarDark = '#1e3a5f';
const collectedBar = '#059669';

const AGING_BUCKET_ORDER = ['0-30', '31-60', '61-90', '90+'];
/** Donut slices: green → amber → coral → dark red */
const agingSliceColorsDark = ['#34d399', '#fbbf24', '#f87171', '#991b1b'];
const agingSliceColorsLight = ['#059669', '#d97706', '#dc2626', '#7f1d1d'];

export default function Dashboard() {
  const isDark = useUIStore((s) => s.isDark);
  const tooltipProps = isDark ? chartTooltipDark : chartTooltipLight;
  const legendProps = isDark ? legendStyleDark : legendStyleLight;
  const axisStroke = isDark ? '#475569' : '#a1a1aa';
  const tickFill = isDark ? '#94a3b8' : '#52525b';
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

  const asArray = (payload, keys) => {
    if (Array.isArray(payload)) return payload;
    for (const k of keys) {
      if (Array.isArray(payload?.[k])) return payload[k];
    }
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  };

  const clientRows = asArray(clients.data, ['clients']);
  const paymentRows = asArray(payments.data, ['payments']);
  const billingRows = asArray(billings.data, ['billings']);
  const serviceRows = asArray(services.data, ['services']);

  const now = dayjs();
  const welcomeDate = now.format('dddd, D MMMM YYYY').toUpperCase();
  const activeCount = clientRows.filter((client) => client.status === 'active').length;
  const totalClientCount = clientRows.length;
  const totalOutstanding = billingRows.reduce((sum, row) => sum + Number(row.balance || 0), 0);
  const collectedThisMonth = paymentRows
    .filter((row) => dayjs(row.receivedOn).month() === now.month() && dayjs(row.receivedOn).year() === now.year())
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const overdueAges = { over30: 0, over60: 0, over90: 0 };
  const agingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  billingRows.forEach((row) => {
    const balance = Number(row.balance || 0);
    if (!balance) return;
    const due = dayjs(row.dueDate);
    const age = Math.max(0, now.diff(due, 'day'));
    if (age > 30) overdueAges.over30 += balance;
    if (age > 60) overdueAges.over60 += balance;
    if (age > 90) overdueAges.over90 += balance;
    if (age <= 30) agingBuckets['0-30'] += balance;
    else if (age <= 60) agingBuckets['31-60'] += balance;
    else if (age <= 90) agingBuckets['61-90'] += balance;
    else agingBuckets['90+'] += balance;
  });

  const agingChartData = AGING_BUCKET_ORDER.map((name) => ({
    name,
    value: Number(agingBuckets[name] || 0),
  }));
  const agingTotal = agingChartData.reduce((sum, d) => sum + d.value, 0);

  const monthKeys = Array.from({ length: 6 }).map((_, index) => now.subtract(5 - index, 'month').format('MMM YY'));
  const monthlyMap = Object.fromEntries(monthKeys.map((key) => [key, { month: key, Billed: 0, Collected: 0 }]));
  billingRows.forEach((row) => {
    const key = dayjs(row.dueDate || row.createdAt).format('MMM YY');
    if (monthlyMap[key]) monthlyMap[key].Billed += Number(row.amount || 0);
  });
  paymentRows.forEach((row) => {
    const key = dayjs(row.receivedOn).format('MMM YY');
    if (monthlyMap[key]) monthlyMap[key].Collected += Number(row.amount || 0);
  });
  const monthlyChart = Object.values(monthlyMap);

  const topClientsMap = {};
  billingRows.forEach((row) => {
    const key = row.clientId?._id || row.clientId || 'unknown';
    const name = row.clientId?.name || 'Unknown Client';
    if (!topClientsMap[key]) topClientsMap[key] = { name, outstanding: 0 };
    topClientsMap[key].outstanding += Number(row.balance || 0);
  });
  const topClients = Object.values(topClientsMap).sort((a, b) => b.outstanding - a.outstanding).slice(0, 10);

  const revenueByService = serviceRows
    .map((service) => {
      const id = service._id || service.id;
      const revenue = billingRows
        .filter((row) => (row.serviceId?._id || row.serviceId) === id)
        .reduce((sum, row) => sum + Number(row.amountPaid || 0), 0);
      return { name: service.name, value: revenue };
    })
    .filter((row) => row.value > 0);

  const activityFeed = [
    ...paymentRows.slice(0, 20).map((row) => ({
      type: 'payment',
      date: row.receivedOn,
      clientName: row.clientId?.name || 'Client',
      text: `Payment ${formatINR(row.amount)} received from ${row.clientId?.name || 'client'}`,
    })),
    ...billingRows
      .filter((row) => row.status === 'overdue')
      .slice(0, 20)
      .map((row) => ({
        type: 'overdue',
        date: row.dueDate,
        clientName: row.clientId?.name || 'Client',
        text: `Overdue: ${row.clientId?.name || 'Client'} — ${formatINR(row.balance || row.amount)}`,
      })),
  ]
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
    .slice(0, 16);

  const colors = ['#059669', '#fbbf24', '#f87171', '#64748b', '#60a5fa', '#34d399'];

  const kpis = [
    {
      label: 'Total outstanding',
      value: formatINR(totalOutstanding),
      border: 'border-l-rose-500 dark:border-l-dm-danger',
      icon: AlertTriangle,
      iconWrap: 'bg-rose-100 text-rose-700 dark:bg-[#450a0a]/50 dark:text-dm-danger dark:shadow-[inset_0_0_0_1px_rgba(248,113,113,0.35)]',
      valueClass: 'dark:text-dm-danger',
    },
    {
      label: 'Collected this month',
      value: formatINR(collectedThisMonth),
      border: 'border-l-emerald-600 dark:border-l-dm-green',
      icon: Wallet,
      iconWrap:
        'bg-emerald-100 text-emerald-800 dark:bg-[#064e3b]/55 dark:text-dm-green dark:shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35)]',
      valueClass: 'dark:text-dm-green',
    },
    {
      label: 'Overdue 30 / 60 / 90+ days',
      value: `${formatINR(overdueAges.over30)} · ${formatINR(overdueAges.over60)} · ${formatINR(overdueAges.over90)}`,
      border: 'border-l-amber-500 dark:border-l-dm-warn',
      icon: TrendingUp,
      iconWrap:
        'bg-amber-100 text-amber-900 dark:bg-[#451a03]/55 dark:text-dm-warn dark:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.3)]',
      small: true,
      valueClass: 'dark:text-dm-warn',
    },
    {
      label: 'Active clients',
      value: String(activeCount),
      border: 'border-l-sky-600 dark:border-l-dm-info',
      icon: Users,
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
          const Icon = kpi.icon;
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
        <Card className="h-[340px] shadow-card dark:shadow-card-dark">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Monthly billed vs collected</h2>
              <p className="text-xs text-zinc-500 dark:text-[#475569]">Last six rolling months · bars in ₹</p>
            </div>
            <LayoutGrid className="mt-0.5 h-4 w-4 text-zinc-400 dark:text-dm-muted" aria-hidden />
          </div>
          <ResponsiveContainer width="100%" height="88%" minHeight={240}>
            <BarChart data={monthlyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickFill }} stroke={axisStroke} />
              <YAxis
                tick={{ fontSize: 11, fill: tickFill }}
                stroke={axisStroke}
                tickFormatter={(v) => (v >= 100000 ? `${Math.round(v / 1000)}k` : `${v}`)}
              />
              <Tooltip {...tooltipProps} formatter={(value) => formatINR(value)} />
              <Legend wrapperStyle={legendProps} />
              <Bar name="Billed" dataKey="Billed" fill={isDark ? billedBarDark : '#94a3b8'} radius={[4, 4, 0, 0]} />
              <Bar name="Collected" dataKey="Collected" fill={collectedBar} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="h-[340px] shadow-card dark:shadow-card-dark">
          <div className="mb-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Outstanding aging</h2>
            <p className="text-xs text-zinc-500 dark:text-[#475569]">0–30d · 31–60d · 61–90d · 90+d buckets</p>
          </div>
          <div className="relative h-[280px] w-full pt-1">
            {agingTotal > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={agingChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={2}
                    >
                      {AGING_BUCKET_ORDER.map((key, idx) => (
                        <Cell
                          key={key}
                          fill={(isDark ? agingSliceColorsDark : agingSliceColorsLight)[idx]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipProps} formatter={(value) => formatINR(value)} />
                    <Legend verticalAlign="bottom" height={32} wrapperStyle={legendProps} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-10">
                  <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-dm-fg">
                    {formatINRShort(agingTotal)}
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-[#475569]">
                    total outstanding
                  </span>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 text-center dark:border-dm-border dark:bg-dm-hover/25">
                <p className="text-sm font-medium text-zinc-600 dark:text-dm-muted">No receivables in aging buckets</p>
                <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-dm-dim">
                  Chart appears when there is outstanding balance with due dates.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="h-[380px] shadow-card dark:shadow-card-dark">
          <div className="mb-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Top clients by outstanding</h2>
            <p className="text-xs text-zinc-500 dark:text-dm-muted">Highest receivable balance</p>
          </div>
          {topClients.length > 0 ? (
            <ResponsiveContainer width="100%" height="88%" minHeight={260}>
              <BarChart layout="vertical" data={topClients} margin={{ left: 4, right: 12, top: 8 }}>
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: tickFill }}
                  stroke={axisStroke}
                  tickFormatter={(v) => formatINR(v)}
                />
                <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 11, fill: tickFill }} stroke={axisStroke} />
                <Tooltip {...tooltipProps} formatter={(value) => formatINR(value)} />
                <Bar name="Outstanding" dataKey="outstanding" fill="#f87171" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 text-center text-sm text-zinc-500 dark:border-dm-border dark:bg-dm-hover/20 dark:text-dm-muted">
              No client-level outstanding yet.
            </div>
          )}
        </Card>

        <Card className="h-[380px] shadow-card dark:shadow-card-dark">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-dm-fg">Service revenue (collected)</h2>
              <p className="text-xs text-zinc-500 dark:text-dm-muted">By service line</p>
            </div>
            <IndianRupee className="h-4 w-4 text-zinc-400 dark:text-dm-muted" aria-hidden />
          </div>
          {revenueByService.length > 0 ? (
            <ResponsiveContainer width="100%" height="88%" minHeight={260}>
              <PieChart>
                <Pie data={revenueByService} dataKey="value" nameKey="name" innerRadius={64} outerRadius={96} paddingAngle={2}>
                  {revenueByService.map((entry, idx) => (
                    <Cell key={entry.name} fill={colors[idx % colors.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip {...tooltipProps} formatter={(value) => formatINR(value)} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={isDark ? { ...legendProps, fontSize: 11 } : { fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
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
              const initials = getInitials(item.clientName || item.text, 2);
              const tone = getAvatarToneClass(item.clientName || String(index));
              return (
                <li key={`${item.type}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
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
                      {item.text}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-dm-muted">{formatDate(item.date)}</p>
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
