import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, MapPin, Pencil, Search, Users } from 'lucide-react';
import { getClients } from '../lib/api';
import { formatINR, getAvatarToneClass, getInitials } from '../lib/utils';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { SkeletonBlock } from '../components/ui/skeleton';

export default function Clients() {
  const density = useUIStore((state) => state.density);
  const toggleDensity = useUIStore((state) => state.toggleDensity);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [tag, setTag] = useState('');
  const [service, setService] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selected, setSelected] = useState([]);

  const query = useQuery({
    queryKey: ['clients', search, status, city, tag, service, sortBy],
    queryFn: () => getClients({ limit: 200, search, status, city, tag, service, sortBy }),
  });

  const rows = query.data?.items || query.data || [];
  const uniqueCities = useMemo(
    () => [...new Set(rows.map((row) => row.city).filter(Boolean))],
    [rows]
  );

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-24 w-full" />
          ))}
        </div>
        <SkeletonBlock className="h-[480px] w-full" />
      </div>
    );
  }

  const outstanding = rows.reduce((sum, row) => sum + Number(row.outstanding || 0), 0);
  const activeCount = rows.filter((row) => row.status === 'active').length;
  const compact = density === 'compact';

  const toggleRow = (id) =>
    setSelected((current) => (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]));

  const statClass =
    'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Clients</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Manage relationships, tags, and receivables by client.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`${statClass} border-l-4 border-l-emerald-600 dark:border-l-emerald-500`}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <Users className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total clients</p>
              <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">{rows.length}</p>
            </div>
          </div>
        </div>
        <div className={`${statClass} border-l-4 border-l-sky-600 dark:border-l-sky-500`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Active</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">{activeCount}</p>
        </div>
        <div className={`${statClass} border-l-4 border-l-rose-500 dark:border-l-rose-400`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Outstanding total</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-rose-700 dark:text-rose-300">{formatINR(outstanding)}</p>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
              <Input
                className="pl-9"
                placeholder="Search name, email, PAN…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="onboarding">Onboarding</option>
            </Select>
            <Select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">City</option>
              {uniqueCities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Input placeholder="Tag" value={tag} onChange={(e) => setTag(e.target.value)} />
            <Input placeholder="Service" value={service} onChange={(e) => setService(e.target.value)} />
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort: Name</option>
              <option value="-createdAt">Newest</option>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={toggleDensity}>
              Density: {compact ? 'Compact' : 'Comfortable'}
            </Button>
            {selected.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                <span className="font-medium">{selected.length} selected</span>
                <Button size="sm" variant="outline">
                  Export
                </Button>
                <Button size="sm" variant="danger">
                  Mark inactive
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/95 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="w-28 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td className="px-6 py-16 text-center dark:text-zinc-300" colSpan={7}>
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <MapPin className="h-7 w-7 text-zinc-400" aria-hidden />
                      </span>
                      <p className="mt-4 text-base font-semibold text-zinc-900 dark:text-white">No clients match your filters</p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Clear search or add a new client from your practice workflow.</p>
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const id = row._id || row.id;
                const o = Number(row.outstanding || 0);
                const name = row.name || '—';
                const initials = getInitials(name, 2);
                const tone = getAvatarToneClass(name);
                return (
                  <tr
                    key={id}
                    className="group border-t border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <td className={`px-4 ${compact ? 'py-2' : 'py-3.5'}`}>
                      <input
                        type="checkbox"
                        className="focus-ring rounded border-zinc-300 dark:border-zinc-600"
                        checked={selected.includes(id)}
                        onChange={() => toggleRow(id)}
                      />
                    </td>
                    <td className={`px-4 ${compact ? 'py-2' : 'py-3.5'}`}>
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${tone}`}
                        >
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <Link
                            to={`/clients/${id}`}
                            className="font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                          >
                            {name}
                          </Link>
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{row.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 capitalize ${compact ? 'py-2' : 'py-3.5'}`}>
                      <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {row.status || '—'}
                      </span>
                    </td>
                    <td className={`px-4 text-zinc-600 dark:text-zinc-400 ${compact ? 'py-2' : 'py-3.5'}`}>{row.city || '—'}</td>
                    <td className={`max-w-[140px] truncate px-4 text-zinc-600 dark:text-zinc-400 ${compact ? 'py-2' : 'py-3.5'}`}>
                      {(row.tags || []).join(', ') || '—'}
                    </td>
                    <td className={`px-4 text-right font-semibold tabular-nums ${compact ? 'py-2' : 'py-3.5'} ${o > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatINR(o)}
                    </td>
                    <td className={`px-4 text-right ${compact ? 'py-2' : 'py-3.5'}`}>
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Link
                          to={`/clients/${id}`}
                          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-emerald-600 dark:hover:text-emerald-300"
                          title="View"
                        >
                          <Eye className="h-4 w-4" aria-hidden />
                        </Link>
                        <Link
                          to={`/clients/${id}`}
                          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-emerald-600 dark:hover:text-emerald-300"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
