import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { createClient } from '../lib/api';
import { formatClientStatus } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select } from '../components/ui/select';

const TARGET_COLUMNS = ['name', 'email', 'phone', 'pan', 'gstin', 'city', 'status', 'tags'];

function parseRows(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result.data || []),
        error: reject,
      });
      return;
    }
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const workbook = XLSX.read(event.target?.result, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(firstSheet));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
      return;
    }
    reject(new Error('Only CSV and XLSX files are supported.'));
  });
}

function rowApiMessage(error) {
  const data = error?.response?.data;
  if (!data) return error?.message || 'Request failed';
  if (typeof data.message === 'string') return data.message;
  if (Array.isArray(data.errors)) {
    return data.errors.map((e) => e?.message || e).filter(Boolean).join('; ') || 'Validation failed';
  }
  return 'Request failed';
}

export default function BulkUpload() {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [summary, setSummary] = useState(null);
  const headers = useMemo(() => Object.keys(rows[0] || {}), [rows]);

  const validated = useMemo(
    () =>
      rows.map((row, index) => {
        const normalized = {};
        TARGET_COLUMNS.forEach((key) => {
          const source = mapping[key];
          normalized[key] = source ? row[source] : '';
        });
        const errors = [];
        if (!String(normalized.name || '').trim()) errors.push('Name required');
        if (!String(normalized.email || '').trim().includes('@')) errors.push('Valid email required');
        const st = String(normalized.status || '').trim().toLowerCase();
        if (st && !['active', 'inactive', 'onboarding'].includes(st)) errors.push('Status must be active, inactive, or onboarding');
        const pan = String(normalized.pan || '').trim().toUpperCase();
        if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) errors.push('Invalid PAN format');
        const gst = String(normalized.gstin || '').trim().toUpperCase();
        if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) errors.push('Invalid GSTIN format');
        return { index, normalized, errors };
      }),
    [rows, mapping]
  );

  const commitM = useMutation({
    mutationFn: async () => {
      let success = 0;
      let skipped = 0;
      let failed = 0;
      const failures = [];
      for (const item of validated) {
        if (item.errors.length) {
          skipped += 1;
          continue;
        }
        const tags = String(item.normalized.tags || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
        const statusRaw = String(item.normalized.status || '').trim().toLowerCase();
        const status = ['active', 'inactive', 'onboarding'].includes(statusRaw) ? statusRaw : 'active';
        const pan = String(item.normalized.pan || '').trim().toUpperCase();
        const gstin = String(item.normalized.gstin || '').trim().toUpperCase();
        const payload = {
          name: String(item.normalized.name || '').trim(),
          email: String(item.normalized.email || '').trim().toLowerCase(),
          status,
          tags,
          city: String(item.normalized.city || '').trim() || undefined,
        };
        const phone = String(item.normalized.phone || '').trim();
        if (phone) payload.phone = phone;
        if (pan && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) payload.pan = pan;
        if (gstin && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) payload.gstin = gstin;
        try {
          await createClient(payload);
          success += 1;
        } catch (error) {
          failed += 1;
          failures.push({ row: item.index + 1, reason: rowApiMessage(error) });
        }
      }
      return { success, skipped, failed, failures };
    },
    onSuccess: (result) => {
      setSummary(result);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const onFile = async (file) => {
    const parsed = await parseRows(file);
    setRows(parsed);
    const firstHeaders = Object.keys(parsed[0] || {});
    const initialMapping = {};
    TARGET_COLUMNS.forEach((target) => {
      const match = firstHeaders.find((header) => header.toLowerCase() === target);
      initialMapping[target] = match || '';
    });
    setMapping(initialMapping);
    setSummary(null);
  };

  const downloadTemplate = () => {
    const template = 'name,email,phone,pan,gstin,city,status,tags\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'clients-template.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-dm-fg">Bulk upload</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-dm-muted">Import clients from CSV or Excel with column mapping.</p>
        </div>
        <Button variant="outline" className="h-11 shrink-0" onClick={downloadTemplate}>
          Download template
        </Button>
      </div>

      <Card>
        <label
          className="focus-ring flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 px-4 py-14 text-center transition hover:border-emerald-400/60 hover:bg-emerald-50/30 dark:border-dm-subtle dark:hover:border-dm-accent dark:hover:bg-dm-hover"
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) onFile(file);
          }}
          onDragOver={(event) => event.preventDefault()}
        >
          <Upload className="mb-2" />
          <p className="text-sm">Drag and drop .csv or .xlsx file here</p>
          <p className="mt-1 text-xs text-zinc-500">or click to select</p>
          <input
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </label>
      </Card>

      {rows.length > 0 && (
        <Card className="space-y-3">
          <h2 className="text-lg font-medium">Column mapping</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {TARGET_COLUMNS.map((target) => (
              <div key={target} className="flex items-center gap-2">
                <span className="w-24 text-sm">{target}</span>
                <Select value={mapping[target] || ''} onChange={(e) => setMapping((prev) => ({ ...prev, [target]: e.target.value }))}>
                  <option value="">-- Unmapped --</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        </Card>
      )}

      {validated.length > 0 && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">Preview</h2>
            <Button onClick={() => commitM.mutate()} disabled={commitM.isPending}>
              {commitM.isPending ? 'Committing...' : 'Commit Upload'}
            </Button>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-dm-subtle dark:bg-dm-surface dark:text-dm-dim">
                <tr>
                  <th className="p-2 text-left font-semibold">#</th>
                  <th className="p-2 text-left font-semibold">Name</th>
                  <th className="p-2 text-left font-semibold">Email</th>
                  <th className="p-2 text-left font-semibold">Status</th>
                  <th className="p-2 text-left font-semibold">Errors</th>
                </tr>
              </thead>
              <tbody>
                {validated.map((item) => (
                  <tr
                    key={item.index}
                    className={`border-t border-zinc-200 transition-colors dark:border-dm-subtle dark:hover:bg-dm-hover ${item.errors.length ? 'bg-rose-500/10 dark:bg-[#450a0a]/25' : ''}`}
                  >
                    <td className="p-2 dark:text-dm-muted">{item.index + 1}</td>
                    <td className="p-2 dark:text-dm-table">{item.normalized.name || '-'}</td>
                    <td className="p-2 dark:text-dm-table">{item.normalized.email || '-'}</td>
                    <td className="p-2 dark:text-dm-table">{formatClientStatus(item.normalized.status || 'active')}</td>
                    <td className="p-2 text-rose-500 dark:text-dm-danger">{item.errors.join(', ') || 'OK'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {summary && (
        <Card className="text-sm">
          <p className="font-medium dark:text-dm-fg">Upload summary</p>
          <p className="mt-1 text-emerald-600 dark:text-dm-green">Success: {summary.success}</p>
          <p className="text-amber-500 dark:text-dm-warn">Skipped: {summary.skipped}</p>
          <p className="text-rose-500 dark:text-dm-danger">Failed: {summary.failed}</p>
          {summary.failures?.length > 0 && (
            <ul className="mt-3 list-inside list-disc space-y-1 text-rose-700 dark:text-dm-danger">
              {summary.failures.map((f) => (
                <li key={f.row}>
                  Row {f.row}: {f.reason}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
