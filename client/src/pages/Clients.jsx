import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, MapPin, Maximize2, Minimize2, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import {
  createClient,
  deleteClient,
  getClients,
  getServices,
  listClientServiceLinks,
  updateClient,
} from '../lib/api';
import { cn, formatClientStatus, formatINR, getAvatarToneClass, getInitials } from '../lib/utils';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { SkeletonBlock } from '../components/ui/skeleton';

const clientSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email(),
  phone: z.string().optional(),
  city: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  status: z.enum(['active', 'inactive', 'onboarding']),
  tagsCsv: z.string().optional(),
});

function clientLifecyclePillClass(status) {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600/15 dark:bg-[#064e3b] dark:text-[#34d399] dark:ring-transparent';
    case 'onboarding':
      return 'bg-sky-50 text-sky-900 ring-1 ring-sky-500/15 dark:bg-[#1e3a5f] dark:text-[#60a5fa] dark:ring-transparent';
    case 'inactive':
    default:
      return 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-500/15 dark:bg-dm-surface dark:text-[#64748b] dark:ring-1 dark:ring-dm-border';
  }
}

const defaultFormValues = {
  name: '',
  email: '',
  phone: '',
  city: '',
  gstin: '',
  pan: '',
  status: 'onboarding',
  tagsCsv: '',
};

export default function Clients() {
  const density = useUIStore((s) => s.density);
  const toggleDensity = useUIStore((s) => s.toggleDensity);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [tag, setTag] = useState('');
  const [service, setService] = useState('');
  const [sortBy] = useState('-createdAt');
  const [selected, setSelected] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const queryClient = useQueryClient();

  const clientsQ = useQuery({
    queryKey: ['clients', search, status, city, sortBy],
    queryFn: () => getClients({ limit: 500, search, status: status || undefined, city: city || undefined, sortBy }),
  });

  const servicesQ = useQuery({
    queryKey: ['services', 'clients-page'],
    queryFn: () => getServices({ limit: 300 }),
  });

  const linksQ = useQuery({
    queryKey: ['client-service-links'],
    queryFn: () => listClientServiceLinks({ limit: 3000 }),
  });

  const form = useForm({ resolver: zodResolver(clientSchema), defaultValues: defaultFormValues });

  const createM = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setModalOpen(false);
      setEditingId(null);
      form.reset(defaultFormValues);
    },
  });

  const updateM = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setModalOpen(false);
      setEditingId(null);
      form.reset(defaultFormValues);
    },
  });

  const deleteM = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const rowsRaw = clientsQ.data?.items || clientsQ.data || [];

  const serviceIdsByClient = useMemo(() => {
    const m = new Map();
    const links = linksQ.data?.items || linksQ.data?.clientServices || [];
    const list = Array.isArray(links) ? links : [];
    list.forEach((row) => {
      const cid = String(row.clientId?._id ?? row.clientId ?? '');
      const sid = String(row.serviceId?._id ?? row.serviceId ?? '');
      if (!cid || !sid) return;
      if (!m.has(cid)) m.set(cid, new Set());
      m.get(cid).add(sid);
    });
    return m;
  }, [linksQ.data]);

  const rows = useMemo(() => {
    let out = rowsRaw;
    const t = tag.trim().toLowerCase();
    if (t) {
      out = out.filter((r) =>
        (r.tags || []).some((x) => String(x || '').toLowerCase().includes(t))
      );
    }
    if (service) {
      out = out.filter((r) => {
        const id = String(r._id || r.id);
        const set = serviceIdsByClient.get(id);
        return set?.has(service);
      });
    }
    return out;
  }, [rowsRaw, tag, service, serviceIdsByClient]);

  const uniqueCities = useMemo(
    () => [...new Set(rowsRaw.map((row) => row.city).filter(Boolean))].sort(),
    [rowsRaw]
  );

  const serviceOptions = servicesQ.data?.items || servicesQ.data || [];

  if (clientsQ.isLoading || linksQ.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-10 w-48" />
        <SkeletonBlock className="h-[560px] w-full" />
      </div>
    );
  }

  const outstanding = rows.reduce((sum, row) => sum + Number(row.outstanding || 0), 0);
  const activeCount = rows.filter((row) => row.status === 'active').length;

  const compact = density === 'compact';

  const toggleRow = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const openAdd = () => {
    setEditingId(null);
    form.reset(defaultFormValues);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row._id || row.id);
    form.reset({
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      city: row.city || '',
      gstin: row.gstin || '',
      pan: row.pan || '',
      status: row.status || 'onboarding',
      tagsCsv: (row.tags || []).join(', '),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    form.reset(defaultFormValues);
  };

  const onSubmit = (values) => {
    const tags = String(values.tagsCsv || '')
      .split(/[,;\n]/g)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      city: values.city || undefined,
      gstin: values.gstin || undefined,
      pan: values.pan || undefined,
      status: values.status,
      tags,
    };

    if (editingId) updateM.mutate({ id: editingId, payload });
    else createM.mutate(payload);
  };

  const onDelete = (row) => {
    const id = row._id || row.id;
    const name = row.name || 'this client';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    deleteM.mutate(id);
  };

  const statClass =
    'rounded-lg border border-slate-200/90 bg-white p-4 shadow-sm dark:border-dm-border dark:bg-dm-surface';

  const saving = createM.isPending || updateM.isPending;
  const formError = [createM.error, updateM.error].map((e) => e?.response?.data?.message).find(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-dm-fg">Clients</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-dm-muted">
            Manage relationships, tags, and receivables by client.
          </p>
        </div>
        <Button className="h-11 shrink-0 gap-2" type="button" onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden />
          Add client
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`${statClass} border-l-4 border-l-emerald-600 dark:border-l-dm-accent`}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-[#064e3b]/80 dark:text-dm-green">
              <Users className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-dm-muted">Total clients</p>
              <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-dm-fg">{rows.length}</p>
            </div>
          </div>
        </div>
        <div className={`${statClass} border-l-4 border-l-sky-600 dark:border-l-dm-info`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-dm-muted">Active</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-900 dark:text-dm-fg">{activeCount}</p>
        </div>
        <div className={`${statClass} border-l-4 border-l-rose-500 dark:border-l-dm-danger`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-dm-muted">Outstanding</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-rose-700 dark:text-dm-danger">{formatINR(outstanding)}</p>
        </div>
      </div>

      <Card className="overflow-hidden p-0 shadow-card dark:shadow-card-dark">
        <div className="border-b border-slate-200 p-4 dark:border-dm-border">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="relative sm:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-dm-muted" />
                <Input
                  className="border-slate-200 pl-10 dark:border-dm-border"
                  placeholder="Search name, email, PAN, GSTIN…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="onboarding">Onboarding</option>
                <option value="inactive">Inactive</option>
              </Select>
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All cities</option>
                {uniqueCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Input placeholder="Tag contains…" value={tag} onChange={(e) => setTag(e.target.value)} />
              <Select value={service} onChange={(e) => setService(e.target.value)}>
                <option value="">Any service</option>
                {serviceOptions.map((s) => (
                  <option key={s._id || s.id} value={String(s._id || s.id)}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="outline" className="h-11 justify-center gap-2" onClick={toggleDensity}>
                {compact ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                {compact ? 'Comfortable' : 'Compact'}
              </Button>
            </div>

            {selected.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-dm-border dark:bg-dm-hover">
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

        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-full table-fixed border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wide text-slate-500 backdrop-blur-sm dark:border-dm-subtle dark:bg-dm-surface dark:text-dm-dim">
              <tr>
                <th className="w-10 px-3 py-3 pl-4">#</th>
                <th className="min-w-[200px] px-3 py-3 xl:w-[28%]">Client</th>
                <th className="w-28 px-3 py-3">Status</th>
                <th className="w-36 px-3 py-3">City</th>
                <th className="hidden px-3 py-3 md:table-cell md:w-[18%]">Tags</th>
                <th className="w-36 px-3 py-3 text-right">Outstanding</th>
                <th className="w-36 px-3 py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td className="px-6 py-16 text-center dark:text-dm-fg" colSpan={7}>
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 ring-4 ring-emerald-100 dark:bg-[#064e3b]/30 dark:ring-[#059669]/20">
                        <Users className="h-8 w-8 text-emerald-600 dark:text-dm-accent" aria-hidden />
                      </span>
                      <p className="mt-5 text-lg font-semibold text-slate-900 dark:text-dm-fg">No clients here yet</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-dm-muted">
                        {search || status || city || tag || service
                          ? 'Nothing matches those filters — try adjusting search or clearing filters.'
                          : 'Create your first client to start billing and collections.'}
                      </p>
                      <Button className="mt-6 gap-2" type="button" onClick={openAdd}>
                        <Plus className="h-4 w-4" aria-hidden />
                        Add client
                      </Button>
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
                    className="group border-t border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-dm-subtle dark:hover:bg-dm-hover"
                  >
                    <td className={`px-4 ${compact ? 'py-2' : 'py-3.5'}`}>
                      <input
                        type="checkbox"
                        className="focus-ring rounded border-zinc-300 dark:border-dm-border"
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
                            className="font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline dark:text-dm-accent dark:hover:text-dm-green"
                          >
                            {name}
                          </Link>
                          <p className="truncate text-xs text-zinc-500 dark:text-dm-muted">{row.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-3 ${compact ? 'py-2' : 'py-3.5'}`}>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                          clientLifecyclePillClass(row.status)
                        )}
                      >
                        {formatClientStatus(row.status)}
                      </span>
                    </td>
                    <td className={`truncate px-3 text-slate-600 dark:text-dm-table ${compact ? 'py-2' : 'py-3.5'}`}>
                      {row.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                          {row.city}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={`hidden max-w-0 truncate px-3 text-slate-600 dark:text-dm-muted md:table-cell ${compact ? 'py-2' : 'py-3.5'}`}>
                      {(row.tags || []).join(', ') || '—'}
                    </td>
                    <td
                      className={`px-3 pr-4 text-right text-sm font-bold tabular-nums ${compact ? 'py-2' : 'py-3.5'} ${o > 0 ? 'text-rose-600 dark:text-dm-danger' : 'text-emerald-600 dark:text-dm-green'}`}
                    >
                      {formatINR(o)}
                    </td>
                    <td className={`px-3 pr-4 text-right ${compact ? 'py-2' : 'py-3.5'}`}>
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/clients/${id}`}
                          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-dm-border dark:bg-dm-surface dark:hover:border-dm-accent dark:hover:text-dm-green"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-dm-border dark:bg-dm-surface dark:hover:border-dm-accent dark:hover:text-dm-green"
                          title="Edit"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-dm-border dark:bg-dm-surface dark:hover:border-dm-danger dark:hover:text-dm-danger"
                          title="Delete"
                          onClick={() => onDelete(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit client' : 'Add client'} panelClassName="max-w-lg">
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <Input placeholder="Name" {...form.register('name')} />
          <Input type="email" placeholder="Email" {...form.register('email')} />
          <Input placeholder="Phone" {...form.register('phone')} />
          <Input placeholder="City" {...form.register('city')} />
          <Input placeholder="GSTIN" {...form.register('gstin')} />
          <Input placeholder="PAN" {...form.register('pan')} />
          <Select {...form.register('status')}>
            <option value="active">Active</option>
            <option value="onboarding">Onboarding</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Input placeholder="Tags (comma-separated)" {...form.register('tagsCsv')} />
          {formError && (
            <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:bg-[#450a0a]/30 dark:text-dm-danger">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create client'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
