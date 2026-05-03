import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Receipt } from 'lucide-react';
import { generateBilling, getBillingMatrix } from '../lib/api';
import { MONTH_COLUMNS } from '../lib/constants';
import { formatDate, formatINR, formatInvoiceStatus } from '../lib/utils';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { SkeletonBlock } from '../components/ui/skeleton';

const STATUS_RANK = {
  overdue: 5,
  partially_paid: 4,
  partial: 4,
  pending: 3,
  paid: 2,
  waived: 1,
};

const getMonthRows = (clientRow, month) => {
  const m = clientRow?.months;
  if (!m) return [];
  const candidates = [month, String(month), Number(month)];
  for (const key of candidates) {
    const rows = m[key];
    if (Array.isArray(rows) && rows.length) return rows;
  }
  return [];
};

const aggregateMonthRows = (rows) => {
  if (!rows.length) return null;
  const amount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const status = rows.reduce((best, row) => {
    const s = row.status || 'pending';
    return (STATUS_RANK[s] ?? 0) > (STATUS_RANK[best] ?? 0) ? s : best;
  }, rows[0].status || 'pending');
  const dueDates = rows.map((r) => r.dueDate).filter(Boolean);
  const firstDue = dueDates.length ? dueDates.sort((a, b) => new Date(a) - new Date(b))[0] : rows[0].dueDate;
  return {
    ...rows[0],
    amount,
    status,
    dueDate: firstDue,
    _rows: rows,
  };
};

const getMonthCell = (clientRow, month) => {
  const rows = getMonthRows(clientRow, month);
  return aggregateMonthRows(rows);
};

/** Light: solid status hues. Dark: brighter fills + luminous rings so cells read clearly on dm.bg. */
const matrixCellFill = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-emerald-600 ring-2 ring-emerald-700/35 shadow-sm dark:bg-emerald-500 dark:ring-emerald-200/45 dark:shadow-[0_0_18px_rgba(34,197,94,0.42)]';
    case 'partially_paid':
    case 'partial':
      return 'bg-amber-500 ring-2 ring-amber-700/35 shadow-sm dark:bg-amber-400 dark:ring-amber-100/50 dark:shadow-[0_0_18px_rgba(251,191,36,0.38)]';
    case 'overdue':
      return 'bg-rose-600 ring-2 ring-rose-800/35 shadow-sm dark:bg-rose-500 dark:ring-rose-100/45 dark:shadow-[0_0_18px_rgba(251,113,133,0.42)]';
    case 'waived':
      return 'bg-slate-400 ring-2 ring-slate-600/30 dark:bg-slate-500 dark:ring-slate-200/35 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]';
    default:
      return 'bg-slate-300 ring-2 ring-slate-500/25 shadow-sm dark:bg-slate-600 dark:ring-slate-300/35 dark:border dark:border-slate-400/45';
  }
};

const clientHasFYBilling = (clientRow) =>
  Number(clientRow?.totals?.totalAmount ?? 0) > 0 || Object.keys(clientRow?.months || {}).length > 0;

const monthColumnIndexFromJune = (colIndex) => colIndex >= 2;

function MatrixCell({ cell, onCellClick }) {
  return (
    <div className="group relative flex min-w-[6rem] items-center justify-center py-0.5 sm:min-w-[5.75rem]">
      {!cell ? (
        <div
          className="mx-auto h-[52px] min-h-[52px] w-full min-w-[5.75rem] max-w-[6.5rem] shrink-0 rounded-xl border border-slate-200/80 bg-slate-100 dark:border-dm-border dark:bg-dm-hover sm:max-w-none sm:w-[5.75rem]"
          aria-hidden
        />
      ) : (
        <>
          <button
            type="button"
            className={`relative z-0 h-[52px] min-h-[52px] w-full min-w-[5.75rem] max-w-[6.5rem] shrink-0 rounded-xl transition duration-200 hover:opacity-92 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-dm-accent sm:max-w-none sm:w-[5.75rem] ${matrixCellFill(cell.status)} ${cell._placeholder ? 'border-2 border-dashed border-slate-400/70 bg-slate-100/90 opacity-95 dark:border-dm-muted dark:bg-dm-hover/80 dark:opacity-100' : ''}`}
            onClick={() => {
              if (!cell._placeholder) onCellClick();
            }}
            aria-label={
              cell._placeholder
                ? 'Pending, no bill for this month'
                : [
                    formatINR(cell.amount),
                    formatInvoiceStatus(cell.status),
                    cell.dueDate ? `Due ${formatDate(cell.dueDate)}` : '',
                  ]
                    .filter(Boolean)
                    .join(', ')
            }
          />
          <div
            role="tooltip"
            className="pointer-events-none invisible absolute bottom-full left-1/2 z-[60] mb-2 w-max min-w-[12rem] max-w-[17rem] -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs opacity-0 shadow-xl shadow-slate-900/10 ring-1 ring-black/5 transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:border-dm-border dark:bg-dm-surface dark:shadow-dm-bg/50 dark:ring-white/10"
          >
            {cell._placeholder ? (
              <>
                <p className="font-semibold text-zinc-900 dark:text-dm-fg">Pending</p>
                <p className="mt-1 leading-snug text-zinc-500 dark:text-dm-muted">No billing entry for this month yet.</p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-bold tabular-nums text-zinc-900 dark:text-dm-fg">{formatINR(cell.amount)}</p>
                <p className="mt-0.5 text-zinc-600 dark:text-dm-fg">{formatInvoiceStatus(cell.status)}</p>
                {cell.dueDate ? (
                  <p className="mt-1 text-zinc-500 dark:text-dm-muted">Due {formatDate(cell.dueDate)}</p>
                ) : null}
                {cell._rows?.length > 1 ? (
                  <p className="mt-1.5 border-t border-zinc-100 pt-1.5 text-zinc-500 dark:border-dm-border dark:text-dm-muted">
                    {cell._rows.length} services in this month
                  </p>
                ) : null}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function Billing() {
  const fy = useUIStore((state) => state.currentFY);
  const queryClient = useQueryClient();
  const [selectedCell, setSelectedCell] = useState(null);
  const [generateNotice, setGenerateNotice] = useState(null);
  const matrixQ = useQuery({ queryKey: ['billing', 'matrix', fy], queryFn: () => getBillingMatrix(fy) });
  const generateM = useMutation({
    mutationFn: generateBilling,
    onSuccess: (data) => {
      const created = Number(data?.created ?? 0);
      const m = data?.month;
      const y = data?.year;
      const fyLabel = data?.fy ?? '';
      if (created > 0) {
        setGenerateNotice({
          kind: 'success',
          text: `Created ${created} billing ${created === 1 ? 'entry' : 'entries'} for ${m}/${y}${fyLabel ? ` (FY ${fyLabel})` : ''}.`,
        });
      } else {
        setGenerateNotice({
          kind: 'info',
          text: `No new entries for ${m}/${y}. Possible reasons: no active client-services, billing already exists for that period, billing cycle does not include this month (e.g. quarterly / annual), or services are one-time.`,
        });
      }
      void queryClient.invalidateQueries({ queryKey: ['billing', 'matrix', fy] });
      void queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not generate billing. Check that you are signed in and the API is reachable.';
      setGenerateNotice({ kind: 'error', text: msg });
    },
  });

  const rows = matrixQ.data?.matrix || matrixQ.data?.clients || matrixQ.data || [];
  const empty = useMemo(() => !rows || rows.length === 0, [rows]);

  const monthTotals = useMemo(
    () =>
      MONTH_COLUMNS.map((m) =>
        rows.reduce((sum, cr) => {
          const c = getMonthCell(cr, m.month);
          if (!c || c._placeholder) return sum;
          return sum + Number(c.amount || 0);
        }, 0)
      ),
    [rows]
  );

  const grandOutstanding = useMemo(
    () => rows.reduce((s, cr) => s + Number(cr.totals?.totalBalance ?? 0), 0),
    [rows]
  );

  if (matrixQ.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-[560px] w-full" />
      </div>
    );
  }

  const now = dayjs();
  const month = now.month() + 1;
  const year = now.year();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-dm-fg">Billing matrix</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-dm-muted">
            FY {fy} — colour shows status; hover a cell for amount and details.
          </p>
        </div>
        <Button
          type="button"
          variant="success"
          className="h-11 shrink-0 px-5"
          onClick={() => {
            setGenerateNotice(null);
            generateM.mutate({ month, year });
          }}
          disabled={generateM.isPending}
        >
          {generateM.isPending ? 'Generating…' : 'Generate billing (current month)'}
        </Button>
      </div>

      {generateNotice ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            generateNotice.kind === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-dm-danger/40 dark:bg-[#450a0a]/35 dark:text-dm-danger'
              : generateNotice.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800/40 dark:bg-amber-950/35 dark:text-amber-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{generateNotice.text}</p>
            <button
              type="button"
              className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold opacity-80 hover:opacity-100"
              onClick={() => setGenerateNotice(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <Card className="p-0 shadow-card dark:shadow-card-dark">
        {empty ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-dm-hover">
              <Receipt className="h-8 w-8 text-zinc-400 dark:text-dm-muted" aria-hidden />
            </span>
            <p className="mt-5 text-base font-semibold text-zinc-900 dark:text-dm-fg">No billing for FY {fy}</p>
            <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-dm-muted">
              Generate invoices for the current month or switch financial year in the header to see historical data.
            </p>
            <Button
              type="button"
              className="mt-6"
              disabled={generateM.isPending}
              onClick={() => {
                setGenerateNotice(null);
                generateM.mutate({ month, year });
              }}
            >
              {generateM.isPending ? 'Generating…' : 'Generate billing'}
            </Button>
          </div>
        ) : (
          <div className="touch-pan-x overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <p className="px-4 pt-3 text-xs text-zinc-500 dark:text-dm-muted sm:hidden">
              Swipe horizontally to see all months and status colours.
            </p>
            <table className="w-max min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-dm-subtle dark:bg-dm-surface dark:text-dm-muted">
                  <th className="sticky left-0 z-20 min-w-[11rem] max-w-[13rem] border-r border-zinc-200 bg-zinc-50 px-3 py-3 text-left shadow-[4px_0_12px_-6px_rgba(0,0,0,0.12)] dark:border-dm-subtle dark:bg-dm-surface dark:shadow-[4px_0_16px_-4px_rgba(0,0,0,0.45)] sm:min-w-[10rem] sm:px-4">
                    Client
                  </th>
                  {MONTH_COLUMNS.map((m) => (
                    <th
                      key={m.label}
                      className="min-w-[6rem] whitespace-nowrap px-2 py-3 text-center font-semibold text-zinc-700 dark:text-dm-muted sm:min-w-[5.75rem] sm:px-1"
                    >
                      <span className="inline-flex min-w-[4.5rem] flex-col items-center gap-0.5">
                        <CalendarRange className="mx-auto h-3.5 w-3.5 text-zinc-400 opacity-70 dark:text-dm-muted dark:opacity-90" aria-hidden />
                        {m.label}
                      </span>
                    </th>
                  ))}
                  <th className="sticky right-0 z-20 min-w-[7.5rem] border-l border-zinc-200 bg-zinc-50 px-3 py-3 text-right text-zinc-700 shadow-[-4px_0_12px_-6px_rgba(0,0,0,0.12)] dark:border-dm-subtle dark:bg-dm-surface dark:text-dm-muted dark:shadow-[-4px_0_16px_-4px_rgba(0,0,0,0.45)] sm:px-4">
                    Outstanding
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((clientRow) => {
                  const bal = Number(clientRow.totals?.totalBalance ?? 0);
                  return (
                    <tr
                      key={clientRow.clientId || clientRow._id}
                      className="border-t border-zinc-200 transition-colors hover:bg-zinc-50/80 dark:border-dm-subtle dark:hover:bg-dm-hover"
                    >
                      <td
                        className="sticky left-0 z-10 min-w-[11rem] max-w-[13rem] border-r border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-900 shadow-[4px_0_12px_-6px_rgba(0,0,0,0.08)] dark:border-dm-subtle dark:bg-dm-surface dark:text-dm-table dark:shadow-[4px_0_16px_-4px_rgba(0,0,0,0.35)] sm:px-4"
                        title={clientRow.clientName || clientRow.name}
                      >
                        <span className="block truncate">{clientRow.clientName || clientRow.name}</span>
                      </td>
                      {MONTH_COLUMNS.map((m, colIndex) => {
                        let cell = getMonthCell(clientRow, m.month);
                        const showFuturePending =
                          !cell && clientHasFYBilling(clientRow) && monthColumnIndexFromJune(colIndex);
                        if (showFuturePending) {
                          cell = {
                            status: 'pending',
                            amount: 0,
                            dueDate: null,
                            _rows: [],
                            _placeholder: true,
                          };
                        }
                        return (
                          <td
                            key={m.label}
                            className="min-w-[6rem] px-2 py-1.5 text-center align-middle sm:min-w-[5.75rem] sm:px-1"
                          >
                            <MatrixCell
                              cell={cell}
                              onCellClick={() =>
                                setSelectedCell({
                                  clientName: clientRow.clientName || clientRow.name,
                                  month: m.label,
                                  ...cell,
                                })
                              }
                            />
                          </td>
                        );
                      })}
                      <td
                        className={`sticky right-0 z-10 min-w-[7.5rem] border-l border-zinc-200 bg-white px-3 py-2 text-right text-sm font-semibold tabular-nums shadow-[-4px_0_12px_-6px_rgba(0,0,0,0.08)] dark:border-dm-subtle dark:bg-dm-surface dark:shadow-[-4px_0_16px_-4px_rgba(0,0,0,0.35)] sm:px-4 ${bal > 0 ? 'text-rose-600 dark:text-dm-danger' : 'text-emerald-600 dark:text-dm-green'}`}
                      >
                        {formatINR(bal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-300 bg-zinc-50 font-semibold dark:border-dm-subtle dark:bg-dm-surface">
                  <td className="sticky left-0 z-10 min-w-[11rem] border-r border-zinc-200 bg-zinc-50 px-3 py-3 text-zinc-900 shadow-[4px_0_12px_-6px_rgba(0,0,0,0.1)] dark:border-dm-subtle dark:bg-dm-surface dark:text-dm-fg dark:shadow-[4px_0_16px_-4px_rgba(0,0,0,0.4)] sm:px-4">
                    Totals
                  </td>
                  {monthTotals.map((total, idx) => (
                    <td
                      key={MONTH_COLUMNS[idx].label}
                      className="min-w-[6rem] whitespace-nowrap px-2 py-3 text-center text-xs tabular-nums text-zinc-700 dark:text-dm-table sm:min-w-[5.75rem]"
                    >
                      {total > 0 ? formatINR(total) : '—'}
                    </td>
                  ))}
                  <td className="sticky right-0 z-10 min-w-[7.5rem] border-l border-zinc-200 bg-zinc-50 px-3 py-3 text-right text-sm tabular-nums text-rose-700 shadow-[-4px_0_12px_-6px_rgba(0,0,0,0.1)] dark:border-dm-subtle dark:bg-dm-surface dark:text-dm-danger dark:shadow-[-4px_0_16px_-4px_rgba(0,0,0,0.4)] sm:px-4">
                    {formatINR(grandOutstanding)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {selectedCell && !selectedCell._placeholder && (
        <Card className="shadow-card dark:shadow-card-dark">
          <h3 className="font-semibold text-zinc-900 dark:text-dm-fg">
            {selectedCell.clientName} — {selectedCell.month}
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-dm-muted">
            Total: <span className="font-semibold text-zinc-900 dark:text-dm-fg">{formatINR(selectedCell.amount)}</span> · Status:{' '}
            <span>{formatInvoiceStatus(selectedCell.status)}</span> · Due: {formatDate(selectedCell.dueDate)}
          </p>
          {selectedCell._rows?.length > 1 && (
            <ul className="mt-4 space-y-2 border-t border-zinc-200 pt-4 text-sm dark:border-dm-subtle">
              {selectedCell._rows.map((row, idx) => (
                <li key={`${row.service}-${idx}`} className="flex justify-between gap-4 text-zinc-700 dark:text-dm-fg">
                  <span>{row.service}</span>
                  <span className="tabular-nums font-medium">
                    {formatINR(row.amount)}{' '}
                    <span className="text-xs font-normal text-zinc-500">({formatInvoiceStatus(row.status)})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
