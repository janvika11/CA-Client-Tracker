import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { createClient } from '../lib/api';
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
        if (!normalized.name) errors.push('Name required');
        if (!normalized.email || !String(normalized.email).includes('@')) errors.push('Valid email required');
        return { index, normalized, errors };
      }),
    [rows, mapping]
  );

  const commitM = useMutation({
    mutationFn: async () => {
      let success = 0;
      let skipped = 0;
      let failed = 0;
      for (const item of validated) {
        if (item.errors.length) {
          skipped += 1;
          continue;
        }
        try {
          await createClient({
            ...item.normalized,
            status: item.normalized.status || 'active',
            tags: String(item.normalized.tags || '')
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean),
          });
          success += 1;
        } catch (error) {
          failed += 1;
        }
      }
      return { success, skipped, failed };
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Bulk upload</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Import clients from CSV or Excel with column mapping.</p>
        </div>
        <Button variant="outline" className="h-11 shrink-0" onClick={downloadTemplate}>
          Download template
        </Button>
      </div>

      <Card>
        <label
          className="focus-ring flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 px-4 py-14 text-center transition hover:border-emerald-400/60 hover:bg-emerald-50/30 dark:border-zinc-600 dark:hover:border-emerald-600/40 dark:hover:bg-emerald-950/20"
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
                  {headers.map((header) => <option key={header} value={header}>{header}</option>)}
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
              <thead>
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Errors</th>
                </tr>
              </thead>
              <tbody>
                {validated.map((item) => (
                  <tr key={item.index} className={`border-t border-zinc-200 dark:border-zinc-800 ${item.errors.length ? 'bg-rose-500/10' : ''}`}>
                    <td className="p-2">{item.index + 1}</td>
                    <td className="p-2">{item.normalized.name || '-'}</td>
                    <td className="p-2">{item.normalized.email || '-'}</td>
                    <td className="p-2">{item.normalized.status || '-'}</td>
                    <td className="p-2 text-rose-500">{item.errors.join(', ') || 'OK'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {summary && (
        <Card className="text-sm">
          <p>Upload summary</p>
          <p className="mt-1 text-emerald-600">Success: {summary.success}</p>
          <p className="text-amber-500">Skipped: {summary.skipped}</p>
          <p className="text-rose-500">Failed: {summary.failed}</p>
        </Card>
      )}
    </div>
  );
}
