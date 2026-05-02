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
import { formatDate, formatINR, getAvatarToneClass, getInitials } from '../lib/utils';
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
    border: '1px solid rgb(63 63 70)',
    backgroundColor: 'rgb(39 39 42)',
    color: 'rgb(244 244 245)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
    fontSize: '12px',
  },
  labelStyle: { fontWeight: 600, marginBottom: 4, color: 'rgb(244 244 245)' },
};

export default function Dashboard() {
  const isDark = useUIStore((s) => s.isDark);
  const tooltipProps = isDark ? chartTooltipDark : chartTooltipLight;
  const clients = useQuery({ queryKey: ['clients', 'stats'], queryFn: () => getClients({ limit: 500 }) });
  const payments = useQuery({ queryKey: ['payments', 'dashboard'], queryFn: () => getPayments({ limit: 200 }) });
  const billings = useQuery({ queryKey: ['billing', 'dashboard'], queryFn: () => getBillingEntries({ limit: 1000 }) });
  const services = useQuery({ queryKey: ['services', 'dashboard'], queryFn: () => getServices({ limit: 500 }) });

  const loading = clients.isLoading || payments.isLoading || billings.isLoading || services.isLoading;
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

  const clientRows = clients.data?.items || clients.data || [];
  const paymentRows = payments.data?.payments || payments.data?.items || payments.data || [];
  const billingRows = billings.data?.billings || billings.data?.items || billings.data || [];
  const serviceRows = services.data?.services || services.data?.items || services.data || [];

  const now = dayjs();
  const welcomeDate = now.format('dddd, D MMMM YYYY');
  const activeCount = clientRows.filter((client) => client.status === 'active').length;
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

  const colors = ['#059669', '#f59e0b', '#f43f5e', '#64748b', '#0ea5e9', '#6366f1'];

  const kpis = [
    {
      label: 'Total outstanding',
      value: formatINR(totalOutstanding),
      border: 'border-l-rose-500 dark:border-l-rose-400',
      icon: AlertTriangle,
      iconWrap: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300',
    },
    {
      label: 'Collected this month',
      value: formatINR(collectedThisMonth),
      border: 'border-l-emerald-600 dark:border-l-emerald-400',
      icon: Wallet,
      iconWrap: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    },
    {
      label: 'Overdue 30 / 60 / 90+ days',
      value: `${formatINR(overdueAges.over30)} · ${formatINR(overdueAges.over60)} · ${formatINR(overdueAges.over90)}`,
      border: 'border-l-amber-500 dark:border-l-amber-400',
      icon: TrendingUp,
      iconWrap: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200',
      small: true,
    },
    {
      label: 'Active clients',
      value: String(activeCount),
      border: 'border-l-sky-600 dark:border-l-sky-400',
      icon: Users,
      iconWrap: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{welcomeDate}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Collections, receivables exposure, and recent practice activity at a glance.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className={`border-l-4 ${kpi.border} p-0`}>
              <div className="flex items-start gap-4 p-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${kpi.iconWrap}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{kpi.label}</p>
                  <p
                    className={`mt-1 font-bold tabular-nums text-zinc-900 dark:text-white ${kpi.small ? 'text-sm leading-relaxed' : 'text-2xl'}`}
                  >
                    {kpi.value}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="h-[340px]">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Monthly billed vs collected</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Last six months</p>
            </div>
            <LayoutGrid className="mt-0.5 h-4 w-4 text-zinc-400" aria-hidden />
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={monthlyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="rgb(161 161 170)" />
              <YAxis tick={{ fontSize: 11 }} stroke="rgb(161 161 170)" tickFormatter={(v) => (v >= 100000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
              <Tooltip {...tooltipProps} formatter={(value) => formatINR(value)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar name="Billed" dataKey="Billed" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar name="Collected" dataKey="Collected" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="h-[340px]">
          <div className="mb-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Outstanding aging</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">By days past due</p>
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie
                data={Object.entries(agingBuckets).map(([name, value]) => ({ name, value }))}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
              >
                {Object.keys(agingBuckets).map((key, idx) => (
                  <Cell key={key} fill={colors[idx % colors.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} formatter={(value) => formatINR(value)} />
              <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="h-[380px]">
          <div className="mb-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Top clients by outstanding</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Highest receivable balance</p>
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart layout="vertical" data={topClients} margin={{ left: 4, right: 12, top: 8 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="rgb(161 161 170)" tickFormatter={(v) => formatINR(v)} />
              <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 11 }} stroke="rgb(161 161 170)" />
              <Tooltip {...tooltipProps} formatter={(value) => formatINR(value)} />
              <Bar name="Outstanding" dataKey="outstanding" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="h-[380px]">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Service revenue (collected)</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">By service line</p>
            </div>
            <IndianRupee className="h-4 w-4 text-zinc-400" aria-hidden />
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie data={revenueByService} dataKey="value" nameKey="name" innerRadius={64} outerRadius={96} paddingAngle={2}>
                {revenueByService.map((entry, idx) => (
                  <Cell key={entry.name} fill={colors[idx % colors.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} formatter={(value) => formatINR(value)} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent activity</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Payments and overdue notices</p>

        {activityFeed.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-700">
            <Wallet className="h-10 w-10 text-zinc-300 dark:text-zinc-600" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">No recent activity yet</p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">Record payments or generate billing to see a live feed here.</p>
          </div>
        ) : (
          <ul className="relative mt-6 space-y-0 pl-2">
            <span
              className="absolute left-[19px] top-2 bottom-2 w-px bg-zinc-200 dark:bg-zinc-700"
              aria-hidden
            />
            {activityFeed.map((item, index) => {
              const initials = getInitials(item.clientName || item.text, 2);
              const tone = getAvatarToneClass(item.clientName || String(index));
              return (
                <li key={`${item.type}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
                  <span
                    className={`relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-4 ring-white dark:ring-zinc-900 ${tone}`}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        item.type === 'payment'
                          ? 'text-zinc-800 dark:text-zinc-100'
                          : 'text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {item.text}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{formatDate(item.date)}</p>
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
