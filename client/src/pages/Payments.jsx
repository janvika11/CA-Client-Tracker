import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Wallet } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import { getBillingEntries, getClients, getPayments, recordPayment } from '../lib/api';
import { formatDate, formatINR, formatINRForPdf, formatPaymentMode } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { Select } from '../components/ui/select';
import { SkeletonBlock } from '../components/ui/skeleton';

const MODES = ['cash', 'upi', 'bank_transfer', 'cheque'];

function formatPeriodLabel(period) {
  if (!period || typeof period !== 'object') return '—';
  if (period.label) return String(period.label);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (period.year != null && period.month != null && period.month >= 1 && period.month <= 12) {
    return `${months[period.month - 1]} ${period.year}`;
  }
  if (period.quarter != null && period.year != null) return `Q${period.quarter} ${period.year}`;
  return '—';
}

/** Align API allocations (allocatedAmount, invoiceId) with UI preview shape and enrich from unpaid rows. */
function mergeAllocationsForReceipt(apiAllocations, previewAllocations, unpaidRows) {
  const raw = apiAllocations?.length ? apiAllocations : previewAllocations || [];
  return raw
    .map((item) => {
      const invId = String(item.invoiceId ?? item.id ?? '');
      const inv = unpaidRows.find((r) => String(r._id || r.id) === invId);
      const allocated = Number(item.allocatedAmount ?? item.allocated ?? 0);
      const dueDate = item.dueDate ?? inv?.dueDate;
      const serviceName =
        item.serviceName || inv?.serviceId?.name || inv?.service?.name || '—';
      const periodLabel = item.periodLabel || formatPeriodLabel(item.period ?? inv?.period);
      return { dueDate, allocated, serviceName, periodLabel };
    })
    .filter((row) => row.allocated > 0);
}

function buildFifoAllocations(invoices, amount, checkedIds) {
  let remaining = Number(amount || 0);
  const allocations = [];
  invoices
    .filter((invoice) => checkedIds.includes(invoice._id || invoice.id))
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
    .forEach((invoice) => {
      if (remaining <= 0) return;
      const outstanding = Number(invoice.balance || invoice.amount || 0);
      if (outstanding <= 0) return;
      const allocated = Math.min(outstanding, remaining);
      remaining -= allocated;
      allocations.push({
        id: invoice._id || invoice.id,
        dueDate: invoice.dueDate,
        outstanding,
        allocated,
      });
    });
  return { allocations, remaining };
}

function generateReceiptPDF(paymentData) {
  const doc = new jsPDF();
  const lines = paymentData.allocations || [];
  doc.setFontSize(16);
  doc.text('Payment Receipt', 14, 18);
  doc.setFontSize(11);
  doc.text(`Client: ${paymentData.clientName}`, 14, 30);
  doc.text(`Amount: ${formatINRForPdf(paymentData.amount)}`, 14, 38);
  doc.text(`Mode: ${formatPaymentMode(paymentData.mode)}`, 14, 46);
  doc.text(`Reference: ${paymentData.reference}`, 14, 54);
  doc.text(`Date: ${formatDate(paymentData.receivedOn)}`, 14, 62);
  doc.text(`Allocated to ${lines.length} invoice(s)`, 14, 70);
  let y = 80;
  const maxW = 182;
  lines.forEach((item, idx) => {
    const line = `${idx + 1}. ${item.serviceName} · ${item.periodLabel} · Due ${formatDate(item.dueDate)} · ${formatINRForPdf(item.allocated)}`;
    const wrapped = doc.splitTextToSize(line, maxW);
    doc.text(wrapped, 14, y);
    y += wrapped.length * 5 + 3;
  });
  doc.save(`receipt-${dayjs().format('YYYYMMDD-HHmmss')}.pdf`);
}

export default function Payments() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('');
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [receivedOn, setReceivedOn] = useState(dayjs().format('YYYY-MM-DD'));
  const [checkedInvoices, setCheckedInvoices] = useState([]);

  const paymentsQ = useQuery({
    queryKey: ['payments', search, mode],
    queryFn: () => getPayments({ limit: 200, mode }),
  });
  const clientsQ = useQuery({ queryKey: ['clients', 'payment-form'], queryFn: () => getClients({ limit: 500 }) });
  const unpaidQ = useQuery({
    queryKey: ['billing', 'unpaid', clientId],
    enabled: Boolean(clientId),
    queryFn: () => getBillingEntries({ clientId, limit: 500 }),
  });

  const saveM = useMutation({
    mutationFn: recordPayment,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      const client = clients.find((item) => (item._id || item.id) === clientId);
      generateReceiptPDF({
        clientName: client?.name || 'Client',
        amount: Number(amount),
        mode: paymentMode,
        reference,
        receivedOn,
        allocations: mergeAllocationsForReceipt(result?.allocations, allocationState.allocations, unpaidRows),
      });
      resetModal();
    },
  });

  const allRows = paymentsQ.data?.payments || paymentsQ.data?.items || paymentsQ.data || [];
  const rows = allRows.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(row.reference || '').toLowerCase().includes(q) ||
      String(row.clientId?.name || '').toLowerCase().includes(q)
    );
  });
  const clients = clientsQ.data?.items || clientsQ.data || [];
  const unpaidRows = useMemo(
    () =>
      (unpaidQ.data?.billings || unpaidQ.data?.items || unpaidQ.data || []).filter((row) =>
        ['pending', 'partially_paid', 'overdue'].includes(row.status)
      ),
    [unpaidQ.data]
  );
  const invoicesSyncKey = useMemo(
    () =>
      `${clientId}:${unpaidRows
        .map((row) => row._id || row.id)
        .sort()
        .join(',')}`,
    [clientId, unpaidRows]
  );
  const lastSyncedInvoicesKey = useRef('');

  useEffect(() => {
    if (!clientId) {
      lastSyncedInvoicesKey.current = '';
      return;
    }
    if (!unpaidQ.isSuccess) return;
    if (lastSyncedInvoicesKey.current === invoicesSyncKey) return;
    lastSyncedInvoicesKey.current = invoicesSyncKey;
    setCheckedInvoices(unpaidRows.map((row) => row._id || row.id));
  }, [clientId, unpaidQ.isSuccess, invoicesSyncKey, unpaidRows]);

  const allocationState = useMemo(
    () => buildFifoAllocations(unpaidRows, amount, checkedInvoices),
    [unpaidRows, amount, checkedInvoices]
  );

  const resetModal = () => {
    setOpen(false);
    setClientId('');
    setAmount('');
    setPaymentMode('bank_transfer');
    setReference('');
    setReceivedOn(dayjs().format('YYYY-MM-DD'));
    setCheckedInvoices([]);
  };

  const toggleInvoice = (id) => {
    setCheckedInvoices((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  if (paymentsQ.isLoading || clientsQ.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-10 w-48" />
        <SkeletonBlock className="h-[480px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Payments</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">FIFO allocation, receipts, and collection history.</p>
        </div>
        <Button className="h-11 shrink-0 px-5" onClick={() => setOpen(true)}>
          Record payment
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Search reference / client…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="">All modes</option>
              {MODES.map((item) => (
                <option key={item} value={item}>
                  {formatPaymentMode(item)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/90 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Reference</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td className="px-6 py-16 text-center dark:text-zinc-300" colSpan={5}>
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <Wallet className="h-7 w-7 text-zinc-400" aria-hidden />
                      </span>
                      <p className="mt-4 font-semibold text-zinc-900 dark:text-white">No payments yet</p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Record a receipt to start your ledger.</p>
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr
                  key={row._id || row.id}
                  className="border-t border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(row.receivedOn)}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{row.clientId?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-900 dark:text-white">{formatINR(row.amount)}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatPaymentMode(row.mode)}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={resetModal} title="Record Payment">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            saveM.mutate({
              clientId,
              amount: Number(amount),
              mode: paymentMode,
              reference,
              receivedOn,
              invoiceIds: allocationState.allocations.map((item) => item.id),
            });
          }}
        >
          <Select
            value={clientId}
            onChange={(event) => {
              const value = event.target.value;
              setClientId(value);
              setCheckedInvoices([]);
            }}
            required
          >
            <option value="">Select client</option>
            {clients.map((item) => <option key={item._id || item.id} value={item._id || item.id}>{item.name}</option>)}
          </Select>

          {clientId && (
            <div className="max-h-48 overflow-auto rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-800">
              {unpaidRows.length === 0 ? (
                <p className="text-zinc-500">No unpaid entries for this client.</p>
              ) : (
                unpaidRows
                  .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
                  .map((item) => {
                    const id = item._id || item.id;
                    const checked = checkedInvoices.includes(id);
                    return (
                      <label key={id} className="mb-1 flex items-center gap-2 rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <input
                          type="checkbox"
                          className="focus-ring"
                          checked={checked}
                          onChange={() => toggleInvoice(id)}
                        />
                        <span>{formatDate(item.dueDate)} - {formatINR(item.balance || item.amount)}</span>
                      </label>
                    );
                  })
              )}
            </div>
          )}

          <Input type="number" min="1" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} required>
            {MODES.map((item) => (
              <option key={item} value={item}>
                {formatPaymentMode(item)}
              </option>
            ))}
          </Select>
          <Input placeholder="Reference" value={reference} onChange={(e) => setReference(e.target.value)} required />
          <Input type="date" value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} required />

          <div className="rounded-md bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
            <p className="font-medium">FIFO allocation preview</p>
            <p className="mt-1">Allocated: {formatINR(Number(amount || 0) - allocationState.remaining)}</p>
            <p>Unallocated: {formatINR(allocationState.remaining)}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetModal}>Cancel</Button>
            <Button type="submit" disabled={saveM.isPending || allocationState.allocations.length === 0}>
              {saveM.isPending ? 'Saving...' : 'Save Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
