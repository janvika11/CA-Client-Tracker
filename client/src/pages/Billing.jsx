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

const matrixCellFill = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-emerald-600 ring-2 ring-emerald-700/35 shadow-sm dark:bg-emerald-500 dark:ring-emerald-300/35';
    case 'partially_paid':
    case 'partial':
      return 'bg-amber-500 ring-2 ring-amber-700/35 shadow-sm dark:bg-amber-600 dark:ring-amber-300/30';
    case 'overdue':
      return 'bg-rose-600 ring-2 ring-rose-800/35 shadow-sm dark:bg-rose-500 dark:ring-rose-300/35';
    case 'waived':
      return 'bg-slate-400 ring-2 ring-slate-600/30 dark:bg-zinc-500 dark:ring-zinc-400/25';
    default:
      return 'bg-slate-300 ring-2 ring-slate-500/25 dark:bg-zinc-600 dark:ring-zinc-500/25';
  }
};

const clientHasFYBilling = (clientRow) =>
  Number(clientRow?.totals?.totalAmount ?? 0) > 0 || Object.keys(clientRow?.months || {}).length > 0;

const monthColumnIndexFromJune = (colIndex) => colIndex >= 2;

function MatrixCell({ cell, onCellClick }) {
  return (
    <div className="group relative flex items-center justify-center py-0.5">
      {!cell ? (
        <div className="h-[52px] w-[5.75rem] shrink-0 rounded-xl bg-slate-100 dark:bg-zinc-800" aria-hidden />
      ) : (
        <>
          <button
            type="button"
            className={`relative z-0 h-[52px] w-[5.75rem] shrink-0 rounded-xl transition duration-200 hover:opacity-92 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${matrixCellFill(cell.status)} ${cell._placeholder ? 'border-2 border-dashed border-slate-400/65 opacity-90 dark:border-zinc-500/50' : ''}`}
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
            className="pointer-events-none invisible absolute bottom-full left-1/2 z-[60] mb-2 w-max min-w-[12rem] max-w-[17rem] -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs opacity-0 shadow-xl shadow-slate-900/10 ring-1 ring-black/5 transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:border-zinc-600 dark:bg-zinc-900 dark:shadow-black/40 dark:ring-white/10"
          >
            {cell._placeholder ? (
              <>
                <p className="font-semibold text-zinc-900 dark:text-white">Pending</p>
                <p className="mt-1 leading-snug text-zinc-500 dark:text-zinc-400">No billing entry for this month yet.</p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-bold tabular-nums text-zinc-900 dark:text-white">{formatINR(cell.amount)}</p>
                <p className="mt-0.5 text-zinc-600 dark:text-zinc-300">{formatInvoiceStatus(cell.status)}</p>
                {cell.dueDate ? (
                  <p className="mt-1 text-zinc-500 dark:text-zinc-400">Due {formatDate(cell.dueDate)}</p>
                ) : null}
                {cell._rows?.length > 1 ? (
                  <p className="mt-1.5 border-t border-zinc-100 pt-1.5 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
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
  const matrixQ = useQuery({ queryKey: ['billing', 'matrix', fy], queryFn: () => getBillingMatrix(fy) });
  const generateM = useMutation({
    mutationFn: generateBilling,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing', 'matrix', fy] }),
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Billing matrix</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            FY {fy} — colour shows status; hover a cell for amount and details.
          </p>
        </div>
        <Button
          variant="success"
          className="h-11 shrink-0 px-5"
          onClick={() => generateM.mutate({ month, year })}
          disabled={generateM.isPending}
        >
          {generateM.isPending ? 'Generating…' : 'Generate billing (current month)'}
        </Button>
      </div>

      <Card className="overflow-hidden p-0 shadow-card dark:shadow-card-dark">
        {empty ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Receipt className="h-8 w-8 text-zinc-400 dark:text-zinc-500" aria-hidden />
            </span>
            <p className="mt-5 text-base font-semibold text-zinc-900 dark:text-white">No billing for FY {fy}</p>
            <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Generate invoices for the current month or switch financial year in the header to see historical data.
            </p>
            <Button className="mt-6" onClick={() => generateM.mutate({ month, year })}>
              Generate billing
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/90 dark:text-zinc-400">
                  <th className="sticky left-0 z-20 min-w-[10rem] border-r border-zinc-200 bg-zinc-50 px-4 py-3 text-left dark:border-zinc-800 dark:bg-zinc-800/90">
                    Client
                  </th>
                  {MONTH_COLUMNS.map((m) => (
                    <th key={m.label} className="px-1 py-3 text-center font-semibold text-zinc-700 dark:text-zinc-200">
                      <span className="inline-flex min-w-[3.5rem] flex-col items-center gap-0.5">
                        <CalendarRange className="mx-auto h-3.5 w-3.5 opacity-60" aria-hidden />
                        {m.label}
                      </span>
                    </th>
                  ))}
                  <th className="sticky right-0 z-20 min-w-[7.5rem] border-l border-zinc-200 bg-zinc-50 px-4 py-3 text-right text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/90 dark:text-zinc-200">
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
                      className="border-t border-zinc-200 transition-colors hover:bg-zinc-50/80 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                    >
                      <td
                        className="sticky left-0 z-10 max-w-[13rem] border-r border-zinc-200 bg-white px-4 py-2 font-medium text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
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
                          <td key={m.label} className="px-1 py-1 text-center align-middle">
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
                        className={`sticky right-0 z-10 border-l border-zinc-200 bg-white px-4 py-2 text-right text-sm font-semibold tabular-nums dark:border-zinc-800 dark:bg-zinc-900 ${bal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                      >
                        {formatINR(bal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-300 bg-zinc-50 font-semibold dark:border-zinc-600 dark:bg-zinc-800/80">
                  <td className="sticky left-0 z-10 border-r border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-white">
                    Totals
                  </td>
                  {monthTotals.map((total, idx) => (
                    <td
                      key={MONTH_COLUMNS[idx].label}
                      className="px-2 py-3 text-center text-xs tabular-nums text-zinc-700 dark:text-zinc-200"
                    >
                      {total > 0 ? formatINR(total) : '—'}
                    </td>
                  ))}
                  <td className="sticky right-0 z-10 border-l border-zinc-200 bg-zinc-50 px-4 py-3 text-right text-sm tabular-nums text-rose-700 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-rose-300">
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
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            {selectedCell.clientName} — {selectedCell.month}
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Total: <span className="font-semibold text-zinc-900 dark:text-white">{formatINR(selectedCell.amount)}</span> · Status:{' '}
            <span>{formatInvoiceStatus(selectedCell.status)}</span> · Due: {formatDate(selectedCell.dueDate)}
          </p>
          {selectedCell._rows?.length > 1 && (
            <ul className="mt-4 space-y-2 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-700">
              {selectedCell._rows.map((row, idx) => (
                <li key={`${row.service}-${idx}`} className="flex justify-between gap-4 text-zinc-700 dark:text-zinc-300">
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
