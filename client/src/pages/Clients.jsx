import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, MapPin, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { createClient, deleteClient, getClients, updateClient } from '../lib/api';
import { formatClientStatus, formatINR, getAvatarToneClass, getInitials } from '../lib/utils';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { SkeletonBlock } from '../components/ui/skeleton';

const clientFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  firmName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  pan: z.string().optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  status: z.enum(['active', 'inactive', 'onboarding']),
  tags: z.string().optional(),
});

const defaultFormValues = {
  name: '',
  firmName: '',
  contactPerson: '',
  email: '',
  phone: '',
  whatsapp: '',
  pan: '',
  gstin: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  status: 'active',
  tags: '',
};

function clientToFormValues(client) {
  if (!client || !client._id) return defaultFormValues;
  return {
    name: client.name || '',
    firmName: client.firmName || '',
    contactPerson: client.contactPerson || '',
    email: client.email || '',
    phone: client.phone || '',
    whatsapp: client.whatsapp || '',
    pan: client.pan || '',
    gstin: client.gstin || '',
    address: client.address || '',
    city: client.city || '',
    state: client.state || '',
    pincode: client.pincode || '',
    status: client.status || 'active',
    tags: Array.isArray(client.tags) ? client.tags.join(', ') : String(client.tags || ''),
  };
}

function buildPayload(values) {
  const tags = String(values.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const pan = String(values.pan || '').trim().toUpperCase();
  const gstin = String(values.gstin || '').trim().toUpperCase();
  return {
    name: values.name.trim(),
    firmName: values.firmName?.trim() || undefined,
    contactPerson: values.contactPerson?.trim() || undefined,
    email: values.email.trim().toLowerCase(),
    phone: values.phone?.trim() || undefined,
    whatsapp: values.whatsapp?.trim() || undefined,
    pan: pan || undefined,
    gstin: gstin || undefined,
    address: values.address?.trim() || undefined,
    city: values.city?.trim() || undefined,
    state: values.state?.trim() || undefined,
    pincode: values.pincode?.trim() || undefined,
    status: values.status,
    tags,
  };
}

export default function Clients() {
  const density = useUIStore((state) => state.density);
  const toggleDensity = useUIStore((state) => state.toggleDensity);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [tag, setTag] = useState('');
  const [service, setService] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selected, setSelected] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const form = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultFormValues,
  });

  const query = useQuery({
    queryKey: ['clients', search, status, city, tag, service, sortBy],
    queryFn: () => getClients({ limit: 200, search, status, city, tag, service, sortBy }),
  });

  const createM = useMutation({
    mutationFn: (payload) => createClient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setModalOpen(false);
      setEditingId(null);
      form.reset(defaultFormValues);
    },
  });

  const updateM = useMutation({
    mutationFn: ({ id, payload }) => updateClient({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setModalOpen(false);
      setEditingId(null);
      form.reset(defaultFormValues);
    },
  });

  const deleteM = useMutation({
    mutationFn: (id) => deleteClient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
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

  const openAdd = () => {
    createM.reset();
    updateM.reset();
    setEditingId(null);
    form.reset(defaultFormValues);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    createM.reset();
    updateM.reset();
    const id = row._id || row.id;
    setEditingId(id);
    form.reset(clientToFormValues(row));
    setModalOpen(true);
  };

  const onSubmitForm = (values) => {
    const payload = buildPayload(values);
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
    'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

  const saving = createM.isPending || updateM.isPending;
  const formError = [createM.error, updateM.error]
    .map((e) => e?.response?.data?.message)
    .find(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Clients</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage relationships, tags, and receivables by client.
          </p>
        </div>
        <Button className="h-11 shrink-0 gap-2" type="button" onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden />
          Add client
        </Button>
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
                <th className="w-36 px-4 py-3 text-right">Actions</th>
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
                    <td className={`px-4 ${compact ? 'py-2' : 'py-3.5'}`}>
                      <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {formatClientStatus(row.status)}
                      </span>
                    </td>
                    <td className={`px-4 text-zinc-600 dark:text-zinc-400 ${compact ? 'py-2' : 'py-3.5'}`}>{row.city || '—'}</td>
                    <td className={`max-w-[140px] truncate px-4 text-zinc-600 dark:text-zinc-400 ${compact ? 'py-2' : 'py-3.5'}`}>
                      {(row.tags || []).join(', ') || '—'}
                    </td>
                    <td
                      className={`px-4 text-right font-semibold tabular-nums ${compact ? 'py-2' : 'py-3.5'} ${o > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                    >
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
                        <button
                          type="button"
                          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-emerald-600 dark:hover:text-emerald-300"
                          title="Edit"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-rose-600 dark:hover:text-rose-300"
                          title="Delete"
                          onClick={() => onDelete(row)}
                          disabled={deleteM.isPending}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
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

      <Modal
        open={modalOpen}
        onClose={() => {
          createM.reset();
          updateM.reset();
          setModalOpen(false);
          setEditingId(null);
          form.reset(defaultFormValues);
        }}
        title={editingId ? 'Edit client' : 'Add client'}
        panelClassName="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmitForm)}>
          {formError && <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">{formError}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Name *</label>
              <Input placeholder="Name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Firm name</label>
              <Input placeholder="Firm name" {...form.register('firmName')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Contact person</label>
              <Input placeholder="Contact person" {...form.register('contactPerson')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Email *</label>
              <Input placeholder="Email" type="email" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Phone</label>
              <Input placeholder="Phone" {...form.register('phone')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">WhatsApp</label>
              <Input placeholder="WhatsApp" {...form.register('whatsapp')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">PAN</label>
              <Input placeholder="PAN" {...form.register('pan')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">GSTIN</label>
              <Input placeholder="GSTIN" {...form.register('gstin')} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-500">Address</label>
              <Input placeholder="Address" {...form.register('address')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">City</label>
              <Input placeholder="City" {...form.register('city')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">State</label>
              <Input placeholder="State" {...form.register('state')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Pincode</label>
              <Input placeholder="Pincode" {...form.register('pincode')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Status</label>
              <Select {...form.register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="onboarding">Onboarding</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-500">Tags (comma-separated)</label>
              <Input placeholder="e.g. GST, Audit" {...form.register('tags')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingId(null);
                form.reset(defaultFormValues);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
