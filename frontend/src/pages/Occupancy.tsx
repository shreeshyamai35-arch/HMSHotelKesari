import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, Info } from 'lucide-react';
import { api, apiError } from '../lib/api';
import { OccupancyAnalytics, OccupancyConfig, OccupancyDay, OccupancySlotKey, RoomSaleSource } from '../lib/types';
import { OCCUPANCY_SLOTS, ROOM_SALE_SOURCES, formatCurrency } from '../lib/constants';
import { PageHeader, StatCard, LoadingState, ErrorState, EmptyState, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

interface SaleRow {
  _key: string;
  roomType: string;
  roomNumber: string;
  source: RoomSaleSource;
  sourceDetail: string;
  priceSold: string; // keep as string for controlled input
}

function todayStr(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function newRow(defaultType = ''): SaleRow {
  return {
    _key: Math.random().toString(36).slice(2),
    roomType: defaultType,
    roomNumber: '',
    source: 'ONLINE',
    sourceDetail: '',
    priceSold: '',
  };
}

export default function Occupancy() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canSubmit = user?.role === 'ADMIN' || user?.role === 'FRONT_OFFICE';

  const [date, setDate] = useState(todayStr());
  const [slot, setSlot] = useState<OccupancySlotKey>('SLOT_1000');

  const [workingRooms, setWorkingRooms] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [formError, setFormError] = useState('');

  const config = useQuery({
    queryKey: ['occupancy-config'],
    queryFn: async () => (await api.get<OccupancyConfig>('/occupancy/config')).data,
  });

  const day = useQuery({
    queryKey: ['occupancy', date],
    queryFn: async () => (await api.get<OccupancyDay>('/occupancy', { params: { date } })).data,
  });

  const current = day.data?.slots.find((s) => s.slot === slot);
  const totalRooms = config.data?.totalRooms ?? 0;

  // Load the selected slot's saved data into the form.
  useEffect(() => {
    setFormError('');
    if (current?.data) {
      setWorkingRooms(String(current.data.workingRooms));
      setNotes(current.data.notes ?? '');
      setRows(
        current.data.sales.map((s) => ({
          _key: s.id,
          roomType: s.roomType,
          roomNumber: s.roomNumber,
          source: s.source,
          sourceDetail: s.sourceDetail ?? '',
          priceSold: String(s.priceSold),
        }))
      );
    } else {
      setWorkingRooms('');
      setNotes('');
      setRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.data?.id, slot, date]);

  const working = parseInt(workingRooms || '0', 10) || 0;
  const outOfOrder = Math.max(0, totalRooms - working);
  const roomsSold = rows.length;
  const revenue = rows.reduce((s, r) => s + (parseFloat(r.priceSold) || 0), 0);
  const occupancy = working > 0 ? (roomsSold / working) * 100 : 0;

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        date,
        slot,
        workingRooms: working,
        notes: notes || null,
        sales: rows.map((r) => ({
          roomType: r.roomType,
          roomNumber: r.roomNumber.trim(),
          source: r.source,
          sourceDetail: r.source === 'WALK_IN' ? null : r.sourceDetail || null,
          priceSold: parseFloat(r.priceSold) || 0,
        })),
      };
      return (await api.post('/occupancy', payload)).data;
    },
    onSuccess: () => {
      setFormError('');
      qc.invalidateQueries({ queryKey: ['occupancy', date] });
      qc.invalidateQueries({ queryKey: ['occupancy-analytics'] });
    },
    onError: (err) => setFormError(apiError(err)),
  });

  function validate(): string | null {
    if (totalRooms <= 0) return 'Total rooms is not set. Ask an Admin to configure it in Settings.';
    if (!workingRooms) return 'Enter the number of working rooms.';
    if (working > totalRooms) return `Working rooms cannot exceed total rooms (${totalRooms}).`;
    if (roomsSold > working) return `Rooms sold (${roomsSold}) cannot exceed working rooms (${working}).`;
    for (const r of rows) {
      if (!r.roomType) return `A room row is missing its room type.`;
      if (!r.roomNumber.trim()) return `A room row is missing its room number.`;
      if (r.source === 'ONLINE' && !r.sourceDetail) return `Room ${r.roomNumber || '?'}: select the online source.`;
      if (r.source === 'PUJARI' && !r.sourceDetail) return `Room ${r.roomNumber || '?'}: select the Pujari.`;
    }
    const nums = rows.map((r) => r.roomNumber.trim().toLowerCase()).filter(Boolean);
    const dup = nums.find((n, i) => nums.indexOf(n) !== i);
    if (dup) return `Duplicate room number: ${dup}`;
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    save.mutate();
  }

  function updateRow(key: string, patch: Partial<SaleRow>) {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  }

  const slotMeta = OCCUPANCY_SLOTS.find((s) => s.value === slot)!;

  return (
    <div>
      <PageHeader
        title="Occupancy Manager"
        subtitle="Record room occupancy and sales for each daily reporting slot."
      />

      {/* Date + slot selector */}
      <div className="card-compact mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label className="label">Report date</label>
          <input type="date" className="input w-48" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {OCCUPANCY_SLOTS.map((s) => {
            const submitted = day.data?.slots.find((x) => x.slot === s.value)?.submitted;
            return (
              <button
                key={s.value}
                onClick={() => setSlot(s.value as OccupancySlotKey)}
                className={
                  'flex flex-col items-center rounded-md border px-4 py-2 text-sm transition-colors ' +
                  (slot === s.value
                    ? 'border-navy bg-navy text-white'
                    : 'border-outline-variant bg-surface-lowest text-on-surface hover:bg-surface-low')
                }
              >
                <span className="font-semibold">{s.label}</span>
                <span className={'text-[10px] ' + (slot === s.value ? 'text-white/70' : 'text-on-surface-variant')}>
                  {submitted ? '✓ Submitted' : 'Pending'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {(config.isLoading || day.isLoading) && <LoadingState />}
      {config.error && <ErrorState message={apiError(config.error)} />}

      {config.data && day.data && (
        <>
          {totalRooms <= 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-3 text-sm text-warning">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Total rooms is not configured yet. An Admin must set it under Settings before submitting occupancy.</span>
            </div>
          )}

          {/* Metric cards */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total Rooms" value={totalRooms} hint="Fixed in Settings" />
            <StatCard label="Working Rooms" value={working} accent="success" />
            <StatCard label="Out of Order" value={outOfOrder} accent={outOfOrder > 0 ? 'danger' : 'navy'} hint="Auto: total − working" />
            <StatCard label="Occupancy" value={`${occupancy.toFixed(1)}%`} accent="gold" hint={`${roomsSold} sold`} />
          </div>

          {/* Slot form */}
          <div className="card mb-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy">
                {slotMeta.label} Report <span className="text-sm font-normal text-on-surface-variant">({slotMeta.window})</span>
              </h2>
              {current?.data && (
                <span className="text-xs text-on-surface-variant">
                  Last submitted by {current.data.submittedByName}
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Total rooms in hotel</label>
                <input className="input bg-surface-low" value={totalRooms} disabled />
              </div>
              <div>
                <label className="label">Total working rooms</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={totalRooms}
                  value={workingRooms}
                  disabled={!canSubmit}
                  onChange={(e) => setWorkingRooms(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Out of order (puncture)</label>
                <input className="input bg-surface-low" value={outOfOrder} disabled />
              </div>
            </div>

            {/* Room sales table */}
            <div className="mt-6 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy">
                Rooms Sold <span className="text-on-surface-variant">({roomsSold})</span>
              </h3>
              {canSubmit && (
                <button
                  className="btn-secondary"
                  onClick={() => setRows((p) => [...p, newRow(config.data!.roomTypes[0]?.name ?? '')])}
                >
                  <Plus className="h-4 w-4" /> Add Room
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr>
                    <th className="table-th">Room Type</th>
                    <th className="table-th">Room No.</th>
                    <th className="table-th">Source</th>
                    <th className="table-th">Source Detail</th>
                    <th className="table-th text-right">Price Sold</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="table-td text-center text-on-surface-variant">
                        No rooms added yet.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r._key}>
                      <td className="table-td">
                        <select
                          className="input"
                          value={r.roomType}
                          disabled={!canSubmit}
                          onChange={(e) => updateRow(r._key, { roomType: e.target.value })}
                        >
                          <option value="">Select…</option>
                          {config.data!.roomTypes.map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="table-td">
                        <input
                          className="input w-24"
                          value={r.roomNumber}
                          disabled={!canSubmit}
                          onChange={(e) => updateRow(r._key, { roomNumber: e.target.value })}
                        />
                      </td>
                      <td className="table-td">
                        <select
                          className="input"
                          value={r.source}
                          disabled={!canSubmit}
                          onChange={(e) => updateRow(r._key, { source: e.target.value as RoomSaleSource, sourceDetail: '' })}
                        >
                          {ROOM_SALE_SOURCES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="table-td">
                        {r.source === 'ONLINE' && (
                          <select
                            className="input"
                            value={r.sourceDetail}
                            disabled={!canSubmit}
                            onChange={(e) => updateRow(r._key, { sourceDetail: e.target.value })}
                          >
                            <option value="">Select OTA…</option>
                            {config.data!.onlineSources.map((o) => (
                              <option key={o.id} value={o.name}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {r.source === 'PUJARI' && (
                          <select
                            className="input"
                            value={r.sourceDetail}
                            disabled={!canSubmit}
                            onChange={(e) => updateRow(r._key, { sourceDetail: e.target.value })}
                          >
                            <option value="">Select Pujari…</option>
                            {config.data!.pujaris.map((p) => (
                              <option key={p.id} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {r.source === 'WALK_IN' && <span className="text-sm text-on-surface-variant">—</span>}
                      </td>
                      <td className="table-td text-right">
                        <input
                          className="input w-28 text-right"
                          type="number"
                          min={0}
                          value={r.priceSold}
                          disabled={!canSubmit}
                          onChange={(e) => updateRow(r._key, { priceSold: e.target.value })}
                        />
                      </td>
                      <td className="table-td text-right">
                        {canSubmit && (
                          <button
                            className="text-danger hover:opacity-70"
                            onClick={() => setRows((p) => p.filter((x) => x._key !== r._key))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr>
                      <td className="table-td font-semibold" colSpan={4}>
                        Total revenue ({roomsSold} rooms)
                      </td>
                      <td className="table-td text-right font-semibold tabular-nums">{formatCurrency(revenue)}</td>
                      <td className="table-td"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="mt-4">
              <label className="label">Notes (optional)</label>
              <textarea
                className="input"
                rows={2}
                value={notes}
                disabled={!canSubmit}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {formError && <p className="mt-3 text-sm text-danger">{formError}</p>}

            {canSubmit && (
              <div className="mt-4 flex items-center gap-2">
                <button className="btn-primary" disabled={save.isPending || totalRooms <= 0} onClick={handleSave}>
                  {save.isPending ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {current?.data ? 'Update' : 'Submit'} {slotMeta.label} Report
                </button>
                {save.isSuccess && !save.isPending && <span className="text-sm text-success">Saved ✓</span>}
                {slot === 'SLOT_2200' && (
                  <span className="text-xs text-on-surface-variant">The 10 PM report feeds Revenue Analytics.</span>
                )}
              </div>
            )}
          </div>

          <OccupancyAnalyticsPanel />
        </>
      )}
    </div>
  );
}

// ─── Analytics panel (last 30 days) ───────────────────────
function OccupancyAnalyticsPanel() {
  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['occupancy-analytics', from],
    queryFn: async () => (await api.get<OccupancyAnalytics>('/occupancy/analytics', { params: { from } })).data,
  });

  if (isLoading) return <LoadingState label="Loading analytics…" />;
  if (!data) return null;

  const sourceLabels: Record<string, string> = { ONLINE: 'Online', WALK_IN: 'Walk-in', PUJARI: 'Pujari Ji' };
  const pujariEntries = Object.entries(data.byPujari);
  const otaEntries = Object.entries(data.byOta);

  return (
    <div className="card">
      <h2 className="mb-1 text-lg font-semibold text-navy">Source Mix — Last 30 Days</h2>
      <p className="mb-4 text-sm text-on-surface-variant">
        {data.totalRoomsSold} rooms sold · {formatCurrency(data.totalRevenue)} · ADR {formatCurrency(data.avgAdr)} · Avg occupancy{' '}
        {data.avgOccupancy.toFixed(1)}%
      </p>

      {data.totalRoomsSold === 0 ? (
        <EmptyState title="No occupancy data yet" description="Submit occupancy reports to see the source breakdown." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-navy">By Source</h3>
            <div className="space-y-2">
              {Object.entries(data.sourceMix).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-md bg-surface-low px-3 py-2 text-sm">
                  <span>{sourceLabels[k] ?? k}</span>
                  <span className="tabular-nums text-on-surface-variant">
                    {v.rooms} · {formatCurrency(v.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-navy">By OTA</h3>
            {otaEntries.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No online bookings.</p>
            ) : (
              <div className="space-y-2">
                {otaEntries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-md bg-surface-low px-3 py-2 text-sm">
                    <span>{k}</span>
                    <span className="tabular-nums text-on-surface-variant">
                      {v.rooms} · {formatCurrency(v.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-navy">By Pujari (commission)</h3>
            {pujariEntries.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No Pujari referrals.</p>
            ) : (
              <div className="space-y-2">
                {pujariEntries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-md bg-surface-low px-3 py-2 text-sm">
                    <span>{k}</span>
                    <span className="tabular-nums text-on-surface-variant">
                      {v.rooms} · {formatCurrency(v.revenue)} · comm {formatCurrency(v.commission)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
