import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CheckCircle2, Undo2, MessageCircle } from 'lucide-react';
import { api, apiError } from '../lib/api';
import { CommissionMonth, CommissionRow } from '../lib/types';
import { formatCurrency } from '../lib/constants';
import { PageHeader, StatCard, LoadingState, ErrorState, EmptyState, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** wa.me link with a pre-filled commission statement (Indian numbers). */
function waStatementLink(row: CommissionRow, year: number, month: number): string | null {
  const digits = (row.phone ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length < 10) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  const pct = row.commissionPct !== null ? ` (@${row.commissionPct}%)` : '';
  const text =
    `Namaste ${row.name} Ji,\n` +
    `Hotel Kesari — commission statement for ${MONTH_NAMES[month - 1]} ${year}:\n` +
    `Rooms referred: ${row.rooms}\n` +
    `Room revenue: ${formatCurrency(row.revenue)}\n` +
    `Commission${pct}: ${formatCurrency(row.commission)}\n` +
    `Dhanyavad! 🙏`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

export default function Commissions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [actionError, setActionError] = useState('');

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const { data, isLoading, error } = useQuery({
    queryKey: ['commissions', year, month],
    queryFn: async () =>
      (await api.get<CommissionMonth>('/commissions', { params: { year, month } })).data,
  });

  const settle = useMutation({
    mutationFn: async (pujariId: string) =>
      (await api.post('/commissions/settle', { pujariId, year, month })).data,
    onSuccess: () => {
      setActionError('');
      qc.invalidateQueries({ queryKey: ['commissions'] });
    },
    onError: (e) => setActionError(apiError(e)),
  });

  const unsettle = useMutation({
    mutationFn: async (settlementId: string) =>
      (await api.delete(`/commissions/settle/${settlementId}`)).data,
    onSuccess: () => {
      setActionError('');
      qc.invalidateQueries({ queryKey: ['commissions'] });
    },
    onError: (e) => setActionError(apiError(e)),
  });

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  const paidCount = data?.rows.filter((r) => r.settlement).length ?? 0;
  const withActivity = data?.rows.filter((r) => r.rooms > 0).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Pujari Commissions"
        subtitle="Monthly referral commissions — amounts are locked at entry time, so later % changes never rewrite past months."
        action={
          <div className="flex items-center gap-1">
            <button className="rounded p-1 hover:bg-surface-low" onClick={() => shiftMonth(-1)} title="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[10rem] text-center text-sm font-medium">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              className="rounded p-1 hover:bg-surface-low disabled:opacity-30"
              onClick={() => shiftMonth(1)}
              disabled={isCurrentMonth}
              title="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        }
      />

      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}

      {data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Rooms Referred" value={data.totals.rooms} />
            <StatCard label="Referred Revenue" value={formatCurrency(data.totals.revenue)} accent="navy" />
            <StatCard label="Commission Payable" value={formatCurrency(data.totals.commission)} accent="gold" />
            <StatCard
              label="Settled"
              value={`${paidCount}/${withActivity || data.rows.length}`}
              accent={withActivity > 0 && paidCount >= withActivity ? 'success' : 'warning'}
              hint="Pujaris marked paid"
            />
          </div>

          {actionError && <div className="mb-3"><ErrorState message={actionError} /></div>}

          {data.rows.length === 0 ? (
            <EmptyState
              title="No Pujaris yet"
              description="Add Pujari Ji partners in Settings — their referred rooms from the Occupancy Manager will appear here."
            />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr>
                    <th className="table-th">Pujari</th>
                    <th className="table-th text-right">Rooms</th>
                    <th className="table-th text-right">Revenue</th>
                    <th className="table-th text-right">Commission</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => {
                    const key = r.pujariId ?? `legacy:${r.name}`;
                    const wa = waStatementLink(r, year, month);
                    const changedSincePaid =
                      r.settlement && Math.abs(r.settlement.commission - r.commission) > 0.5;
                    return (
                      <tr key={key} className="hover:bg-surface-low">
                        <td className="table-td">
                          <p className="font-medium">
                            {r.name}
                            {!r.active && <span className="ml-2 badge-neutral">INACTIVE</span>}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {r.phone || 'no phone'}
                            {r.commissionPct !== null && ` · ${r.commissionPct}%`}
                          </p>
                        </td>
                        <td className="table-td text-right tabular-nums">{r.rooms}</td>
                        <td className="table-td text-right tabular-nums">{formatCurrency(r.revenue)}</td>
                        <td className="table-td text-right font-semibold tabular-nums">{formatCurrency(r.commission)}</td>
                        <td className="table-td">
                          {r.settlement ? (
                            <div>
                              <span className="badge-success">PAID</span>
                              <p className="mt-1 text-xs text-on-surface-variant">
                                {formatCurrency(r.settlement.commission)} on{' '}
                                {new Date(r.settlement.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                                by {r.settlement.paidByName}
                              </p>
                              {changedSincePaid && (
                                <p className="mt-0.5 text-xs text-warning">
                                  ⚠ Entries changed since payment — now {formatCurrency(r.commission)}
                                </p>
                              )}
                            </div>
                          ) : r.rooms > 0 ? (
                            <span className="badge-warning">PENDING</span>
                          ) : (
                            <span className="text-xs text-on-surface-variant">No referrals</span>
                          )}
                        </td>
                        <td className="table-td text-right">
                          <div className="inline-flex items-center gap-2">
                            {wa && r.rooms > 0 && (
                              <a
                                className="inline-flex items-center gap-1 rounded-md border border-success/40 px-2 py-1 text-xs font-medium text-success hover:bg-success/5"
                                href={wa}
                                target="_blank"
                                rel="noreferrer"
                                title="Send statement on WhatsApp"
                              >
                                <MessageCircle className="h-3.5 w-3.5" /> Statement
                              </a>
                            )}
                            {isAdmin && r.pujariId && !r.settlement && r.rooms > 0 && (
                              <button
                                className="inline-flex items-center gap-1 rounded-md bg-navy px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                                disabled={settle.isPending}
                                onClick={() => settle.mutate(r.pujariId!)}
                                title="Freeze this month's amount and mark as paid"
                              >
                                {settle.isPending ? <Spinner className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                Mark Paid
                              </button>
                            )}
                            {isAdmin && r.settlement && (
                              <button
                                className="inline-flex items-center gap-1 rounded-md border border-outline-variant px-2 py-1 text-xs text-on-surface-variant hover:bg-surface-low disabled:opacity-50"
                                disabled={unsettle.isPending}
                                onClick={() => {
                                  if (window.confirm(`Undo the paid marker for ${r.name}?`)) unsettle.mutate(r.settlement!.id);
                                }}
                                title="Undo the paid marker"
                              >
                                <Undo2 className="h-3.5 w-3.5" /> Undo
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="table-td font-semibold">Total</td>
                    <td className="table-td text-right font-semibold tabular-nums">{data.totals.rooms}</td>
                    <td className="table-td text-right font-semibold tabular-nums">{formatCurrency(data.totals.revenue)}</td>
                    <td className="table-td text-right font-semibold tabular-nums">{formatCurrency(data.totals.commission)}</td>
                    <td className="table-td" colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <p className="mt-3 text-xs text-on-surface-variant">
            Amounts come from Occupancy Manager entries (end-of-day slot per date). "Mark Paid" freezes the amount — if
            entries for a paid month change later, a warning appears instead of silently changing the paid figure.
          </p>
        </>
      )}
    </div>
  );
}
