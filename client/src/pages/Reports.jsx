import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BarChart3, FileSpreadsheet, PieChart, TrendingUp } from 'lucide-react';
import { getBillingEntries, getClients, getPayments, getServices } from '../lib/api';
import { formatINR, formatINRForPdf, formatInvoiceStatus } from '../lib/utils';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { SkeletonBlock } from '../components/ui/skeleton';

function downloadExcel(fileName, rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

function downloadPDF(title, headers, rows) {
  const doc = new jsPDF();
  doc.text(title, 14, 14);
  autoTable(doc, {
    startY: 20,
    head: [headers],
    body: rows,
    styles: { fontSize: 9 },
  });
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export default function Reports() {
  const fy = useUIStore((state) => state.currentFY);
  const [selectedClient, setSelectedClient] = useState('');
  const clientsQ = useQuery({ queryKey: ['clients', 'reports'], queryFn: () => getClients({ limit: 500 }) });
  const billingsQ = useQuery({ queryKey: ['billing', 'reports', fy], queryFn: () => getBillingEntries({ fy, limit: 2000 }) });
  const paymentsQ = useQuery({ queryKey: ['payments', 'reports'], queryFn: () => getPayments({ limit: 2000 }) });
  const servicesQ = useQuery({ queryKey: ['services', 'reports'], queryFn: () => getServices({ limit: 500 }) });

  const clients = clientsQ.data?.items || clientsQ.data || [];
  const billings = billingsQ.data?.billings || billingsQ.data?.items || billingsQ.data || [];
  const payments = paymentsQ.data?.payments || paymentsQ.data?.items || paymentsQ.data || [];
  const services = servicesQ.data?.services || servicesQ.data?.items || servicesQ.data || [];

  const billingClientKey = (row) => String(row.clientId?._id ?? row.clientId ?? '');
  const paymentClientKey = (row) => String(row.clientId?._id ?? row.clientId ?? '');

  const filteredBillings = useMemo(() => {
    if (!selectedClient) return billings;
    const key = String(selectedClient);
    return billings.filter((row) => billingClientKey(row) === key);
  }, [billings, selectedClient]);

  const filteredPayments = useMemo(() => {
    if (!selectedClient) return payments;
    const key = String(selectedClient);
    return payments.filter((row) => paymentClientKey(row) === key);
  }, [payments, selectedClient]);

  const aging = useMemo(() => {
    const result = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    const today = dayjs();
    filteredBillings.forEach((row) => {
      const balance = Number(row.balance || 0);
      if (balance <= 0) return;
      const days = today.diff(dayjs(row.dueDate), 'day');
      if (days <= 30) result['0-30'] += balance;
      else if (days <= 60) result['31-60'] += balance;
      else if (days <= 90) result['61-90'] += balance;
      else result['90+'] += balance;
    });
    return result;
  }, [filteredBillings]);

  const serviceRevenue = useMemo(
    () =>
      services.map((service) => ({
        service: service.name,
        revenue: filteredBillings
          .filter((row) => String(row.serviceId?._id || row.serviceId) === String(service._id || service.id))
          .reduce((sum, row) => sum + Number(row.amountPaid || 0), 0),
      })),
    [services, filteredBillings]
  );

  const pnlSummary = useMemo(() => {
    const billed = filteredBillings.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const collected = filteredPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const outstanding = filteredBillings.reduce((sum, row) => sum + Number(row.balance || 0), 0);
    return { fy, billed, collected, outstanding };
  }, [filteredBillings, filteredPayments, fy]);

  const clientStatementRows = useMemo(
    () =>
      filteredBillings.map((row) => ({
        client: row.clientId?.name || 'Client',
        service: row.serviceId?.name || '-',
        amount: Number(row.amount || 0),
        paid: Number(row.amountPaid || 0),
        balance: Number(row.balance || 0),
        dueDate: dayjs(row.dueDate).format('DD-MMM-YYYY'),
        status: row.status,
      })),
    [filteredBillings]
  );

  const selectedClientName =
    selectedClient && clients.find((c) => String(c._id || c.id) === String(selectedClient))?.name;

  if (clientsQ.isLoading || billingsQ.isLoading || paymentsQ.isLoading || servicesQ.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-10 w-48" />
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-dm-fg">Reports</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-dm-muted">
            Statements and workpapers for FY <span className="font-semibold text-zinc-800 dark:text-dm-fg">{fy}</span>.
          </p>
          {selectedClient ? (
            <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-dm-accent">
              Scope: <span className="text-zinc-900 dark:text-dm-fg">{selectedClientName || 'Selected client'}</span> · Aging,
              P&amp;L, and service revenue match this selection.
            </p>
          ) : (
            <p className="mt-2 text-xs text-zinc-500 dark:text-dm-muted">
              Choose a client to limit every section below to that practice. Leave as “All clients” for firm-wide totals.
            </p>
          )}
        </div>
        <div className="flex w-full max-w-sm shrink-0 flex-col gap-1.5">
          <label htmlFor="reports-client-scope" className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-dm-muted">
            Client scope
          </label>
          <Select
            id="reports-client-scope"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            aria-label="Filter all reports by client"
          >
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client._id || client.id} value={client._id || client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card className="space-y-3 shadow-card dark:shadow-card-dark">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-dm-fg">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-dm-accent" aria-hidden />
            Outstanding statement
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => downloadExcel('outstanding-statement', clientStatementRows)}
            >
              Export to Excel
            </Button>
            <Button
              onClick={() =>
                downloadPDF(
                  'Outstanding Statement',
                  ['Client', 'Service', 'Amount', 'Paid', 'Balance', 'Due Date', 'Status'],
                  clientStatementRows.map((row) => [
                    row.client,
                    row.service,
                    formatINRForPdf(row.amount),
                    formatINRForPdf(row.paid),
                    formatINRForPdf(row.balance),
                    row.dueDate,
                    formatInvoiceStatus(row.status),
                  ])
                )
              }
            >
              Export to PDF
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-2 shadow-card dark:shadow-card-dark">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-dm-fg">
            <PieChart className="h-5 w-5 text-emerald-600 dark:text-dm-accent" aria-hidden />
            Receivables aging (0–30 / 31–60 / 61–90 / 90+)
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadExcel('aging-report', Object.entries(aging).map(([bucket, amount]) => ({ bucket, amount })))}>
              Export to Excel
            </Button>
            <Button onClick={() => downloadPDF('Receivables Aging', ['Bucket', 'Amount'], Object.entries(aging).map(([bucket, amount]) => [bucket, formatINRForPdf(amount)]))}>
              Export to PDF
            </Button>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          {Object.entries(aging).map(([bucket, amount]) => (
            <div key={bucket} className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-dm-border dark:bg-dm-hover">
              <p className="text-zinc-500 dark:text-dm-muted">{bucket}</p>
              <p className="font-semibold tabular-nums text-zinc-900 dark:text-dm-green">{formatINR(amount)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-2 shadow-card dark:shadow-card-dark">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-dm-fg">
            <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-dm-accent" aria-hidden />
            Service-wise revenue
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadExcel('service-revenue', serviceRevenue)}>Export to Excel</Button>
            <Button onClick={() => downloadPDF('Service Revenue', ['Service', 'Revenue'], serviceRevenue.map((row) => [row.service, formatINRForPdf(row.revenue)]))}>
              Export to PDF
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-2 shadow-card dark:shadow-card-dark">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-dm-fg">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-dm-accent" aria-hidden />
            FY P&amp;L summary
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadExcel('fy-pnl-summary', [pnlSummary])}>Export to Excel</Button>
            <Button onClick={() => downloadPDF('FY P&L Summary', ['FY', 'Billed', 'Collected', 'Outstanding'], [[pnlSummary.fy, formatINRForPdf(pnlSummary.billed), formatINRForPdf(pnlSummary.collected), formatINRForPdf(pnlSummary.outstanding)]])}>
              Export to PDF
            </Button>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-dm-border dark:bg-dm-hover">
            <p className="text-sm text-zinc-500 dark:text-dm-muted">Billed</p>
            <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-dm-table">{formatINR(pnlSummary.billed)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-dm-border dark:bg-dm-hover">
            <p className="text-sm text-zinc-500 dark:text-dm-muted">Collected</p>
            <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-dm-green">{formatINR(pnlSummary.collected)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-dm-border dark:bg-dm-hover">
            <p className="text-sm text-zinc-500 dark:text-dm-muted">Outstanding</p>
            <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-dm-danger">{formatINR(pnlSummary.outstanding)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
