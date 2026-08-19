import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Info, AlertCircle } from 'lucide-react';
import { api, apiError } from '../lib/api';
import { OccupancyConfig, OccupancyDay, OccupancySlotKey, RoomSaleSource } from '../lib/types';
import { OCCUPANCY_SLOTS, ROOM_SALE_SOURCES, formatCurrency } from '../lib/constants';
import { PageHeader, StatCard, LoadingState, ErrorState, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

interface SaleRow {
  _key: string;
  roomId: string;
  roomType: string;
  roomNumber: string;
  source: RoomSaleSource;
  sourceDetail: string;
  priceSold: string;
}

function toYMD(input: Date): string {
  const d = new Date(input);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function todayStr(): string {
  return toYMD(new Date());
}

function newRow(): SaleRow {
  return {
    _key: Math.random().toString(36).slice(2),
    roomId: '',
    roomType: '',
    roomNumber: '',
    source: 'ONLINE',
    sourceDetail: '',
    priceSold: '',
  };
}

// Map slot enum to time window labels
const SLOT_WINDOWS: Record<OccupancySlotKey, string> = {
  'SLOT_1000': '10:00 AM - 11:59 AM',
  'SLOT_1600': '4:00 PM - 6:00 PM',
  'SLOT_2200': '10:00 PM - 11:59 PM',
};

// Check if current IST time is within a slot's window (client-side approximation)
function isSlotWindowActive(slot: OccupancySlotKey): boolean {
  const now = new Date();
  const hour = now.getHours();

  if (slot === 'SLOT_1000') return hour >= 10 && hour <= 11;
  if (slot === 'SLOT_1600') return hour >= 16 && hour <= 18;
  if (slot === 'SLOT_2200') return hour >= 22 && hour <= 23;
  return false;
}

export default function OccupancyNew() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canSubmit = user?.role === 'ADMIN' || user?.role === 'FRONT_OFFICE' || user?.role === 'MANAGEMENT';

  const today = todayStr();
  const [slot, setSlot] = useState<OccupancySlotKey>('SLOT_1000');

  // New flow: Total → Working → Out of Order → Sold (auto-expand table)
  const [totalRooms, setTotalRooms] = useState('');
  const [workingRooms, setWorkingRooms] = useState('');
  const [outOfOrder, setOutOfOrder] = useState('');
  const [soldRooms, setSoldRooms] = useState('');
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState('');

  const config = useQuery({
    queryKey: ['occupancy-config'],
    queryFn: async () => (await api.get<OccupancyConfig>('/occupancy/config')).data,
  });

  const day = useQuery({
    queryKey: ['occupancy', today],
    queryFn: async () => (await api.get<OccupancyDay>('/occupancy', { params: { date: today } })).data,
  });

  const current = day.data?.slots.find((s) => s.slot === slot);
  const configTotalRooms = config.data?.totalRooms ?? 0;
  const roomList = config.data?.rooms ?? [];
  const hasRooms = roomList.length > 0;

  // Load existing slot data when slot changes
  useEffect(() => {
    setFormError('');
    if (current?.data) {
      setTotalRooms(String(current.data.totalRooms));
      setWorkingRooms(String(current.data.workingRooms));
      setOutOfOrder(String(current.data.outOfOrder));
      setSoldRooms(String(current.data.roomsSold));
      setRows(
        current.data.sales.map((s) => {
          const matched = s.roomId ?? roomList.find((r) => r.number === s.roomNumber)?.id ?? '';
          return {
            _key: s.id,
            roomId: matched,
            roomType: s.roomType,
            roomNumber: s.roomNumber,
            source: s.source,
            sourceDetail: s.sourceDetail ?? '',
            priceSold: String(s.priceSold),
          };
        })
      );
      setNotes(current.data.notes ?? '');
    } else {
      setTotalRooms(String(configTotalRooms));
      setWorkingRooms('');
      setOutOfOrder('');
      setSoldRooms('');
      setRows([]);
      setNotes('');
    }
  }, [current?.data?.id, slot, configTotalRooms, roomList]);

  // Auto-expand/contract rows when soldRooms changes
  useEffect(() => {
    const target = parseInt(soldRooms || '0', 10);
    if (target > rows.length) {
      const toAdd = target - rows.length;
      setRows((prev) => [...prev, ...Array.from({ length: toAdd }, newRow)]);
    } else if (target < rows.length) {
      setRows((prev) => prev.slice(0, target));
    }
  }, [soldRooms, rows.length]);

  // Auto-calculate working rooms when total/outOfOrder changes
  useEffect(() => {
    const total = parseInt(totalRooms || '0', 10);
    const ooo = parseInt(outOfOrder || '0', 10);
    if (total > 0 && ooo >= 0) {
      const working = Math.max(0, total - ooo);
      setWorkingRooms(String(working));
    }
  }, [totalRooms, outOfOrder]);

  const total = parseInt(totalRooms || '0', 10);
  const working = parseInt(workingRooms || '0', 10);
  const ooo = parseInt(outOfOrder || '0', 10);
  const sold = parseInt(soldRooms || '0', 10);
  const revenue = rows.reduce((s, r) => s + (parseFloat(r.priceSold) || 0), 0);
  const occupancy = working > 0 ? (sold / working) * 100 : 0;

  const isWindowActive = isSlotWindowActive(slot);
  const isLocked = !!(current?.data && !isWindowActive);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        date: today,
        slot,
        workingRooms: working,
        notes: notes || null,
        sales: rows.map((r) => ({
          roomId: r.roomId || null,
          roomType: r.roomType || null,
          roomNumber: r.roomNumber.trim() || null,
          source: r.source,
          sourceDetail: r.source === 'WALK_IN' ? null : r.sourceDetail || null,
          priceSold: parseFloat(r.priceSold) || 0,
        })),
      };
      return (await api.post('/occupancy', payload)).data;
    },
    onSuccess: () => {
      setFormError('');
      qc.invalidateQueries({ queryKey: ['occupancy', today] });
      qc.invalidateQueries({ queryKey: ['occupancy-analytics'] });
      qc.invalidateQueries({ queryKey: ['occupancy-history'] });
    },
    onError: (err) => setFormError(apiError(err)),
  });

  function validate(): string | null {
    if (total <= 0) return 'Total rooms must be set.';
    if (!soldRooms) return 'Enter the number of sold rooms.';
    if (sold > working) return `Sold rooms (${sold}) cannot exceed working rooms (${working}).`;
    for (const r of rows) {
      if (!r.roomNumber.trim()) return 'A room row is missing its room number.';
      if (!r.roomType) return `Room ${r.roomNumber}: missing room type.`;
      if (r.source === 'ONLINE' && !r.sourceDetail) return `Room ${r.roomNumber}: select the online source.`;
      if (r.source === 'PUJARI' && !r.sourceDetail) return `Room ${r.roomNumber}: select the Pujari.`;
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

  function pickRoom(rowKey: string, roomId: string) {
    const room = roomList.find((r) => r.id === roomId);
    if (!room) {
      updateRow(rowKey, { roomId: '' });
      return;
    }
    updateRow(rowKey, {
      roomId: room.id,
      roomNumber: room.number,
      ...(room.roomTypeName ? { roomType: room.roomTypeName } : {}),
    });
  }

  const slotMeta = OCCUPANCY_SLOTS.find((s) => s.value === slot)!;
  const usedRoomIds = new Set(rows.map((r) => r.roomId).filter(Boolean));

  return (
    <div>
      <PageHeader
        title="Occupancy Manager"
        subtitle="Submit today's occupancy reports during designated time windows. Only today's date is allowed."
      />

      {/* Slot selector */}
      <div className="card-compact mb-4 flex justify-end gap-2">
        {OCCUPANCY_SLOTS.map((s) => {
          const daySlot = day.data?.slots.find((x) => x.slot === s.value);
          const submitted = daySlot?.submitted;
          const active = isSlotWindowActive(s.value as OccupancySlotKey);
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
                {submitted ? '✓ Submitted' : active ? '● Open' : 'Locked'}
              </span>
            </button>
          );
        })}
      </div>

      {(config.isLoading || day.isLoading) && <LoadingState />}
      {config.error && <ErrorState message={apiError(config.error)} />}

      {config.data && day.data && (
        <>
          {!isWindowActive && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-3 text-sm text-warning">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                The {slotMeta.label} slot is outside its submission window ({SLOT_WINDOWS[slot]}).
                {isLocked ? ' This slot is locked and cannot be edited.' : ' Wait for the window to open.'}
              </span>
            </div>
          )}

          {/* Metric cards */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total Rooms" value={total} />
            <StatCard label="Working Rooms" value={working} accent="success" />
            <StatCard label="Out of Order" value={ooo} accent={ooo > 0 ? 'danger' : 'navy'} />
            <StatCard label="Occupancy" value={`${occupancy.toFixed(1)}%`} accent="gold" hint={`${sold} sold`} />
          </div>

          {/* Slot form */}
          <div className="card mb-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-navy">
                {slotMeta.label} Report <span className="text-sm font-normal text-on-surface-variant">({SLOT_WINDOWS[slot]})</span>
              </h2>
              {current?.data && (
                <p className="text-xs text-on-surface-variant">Last submitted by {current.data.submittedByName}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="label">Total rooms in hotel</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={totalRooms}
                  disabled={!canSubmit || isLocked}
                  onChange={(e) => setTotalRooms(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Out of order (puncture)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={total}
                  value={outOfOrder}
                  disabled={!canSubmit || isLocked}
                  onChange={(e) => setOutOfOrder(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Working rooms (auto)</label>
                <input className="input bg-surface-low" value={working} disabled />
              </div>
              <div>
                <label className="label">Sold rooms</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={working}
                  value={soldRooms}
                  disabled={!canSubmit || isLocked}
                  onChange={(e) => setSoldRooms(e.target.value)}
                />
              </div>
            </div>

            {/* Auto-expanding room sales table */}
            {rows.length > 0 && (
              <>
                <div className="mt-6 mb-2">
                  <h3 className="text-sm font-semibold text-navy">
                    Room Details <span className="text-on-surface-variant">({rows.length} rows)</span>
                  </h3>
                </div>

                {/* Column headers (desktop only) */}
                <div className="mb-1 hidden grid-cols-[1.1fr_1fr_1fr_1.2fr_110px] gap-2 px-1 sm:grid">
                  <span className="table-th !p-0">Room</span>
                  <span className="table-th !p-0">Type</span>
                  <span className="table-th !p-0">Source</span>
                  <span className="table-th !p-0">Source Detail</span>
                  <span className="table-th !p-0 text-right">Price (₹)</span>
                </div>

                <div className="space-y-3 sm:space-y-1.5">
                  {rows.map((r) => {
                    const selectedRoom = r.roomId ? roomList.find((x) => x.id === r.roomId) : undefined;
                    const typeLocked = !!selectedRoom?.roomTypeName;
                    return (
                      <div
                        key={r._key}
                        className="grid grid-cols-2 gap-2 rounded-md border border-outline-variant p-3 sm:grid-cols-[1.1fr_1fr_1fr_1.2fr_110px] sm:items-center sm:border-0 sm:p-0"
                      >
                        {/* Room */}
                        <div>
                          <label className="label sm:hidden">Room</label>
                          {hasRooms ? (
                            <select
                              className="input"
                              value={r.roomId}
                              disabled={!canSubmit || isLocked}
                              onChange={(e) => pickRoom(r._key, e.target.value)}
                            >
                              <option value="">Select room…</option>
                              {roomList.map((room) => (
                                <option key={room.id} value={room.id} disabled={usedRoomIds.has(room.id) && room.id !== r.roomId}>
                                  {room.number}
                                  {room.roomTypeName ? ` — ${room.roomTypeName}` : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="input"
                              value={r.roomNumber}
                              placeholder="Room no."
                              disabled={!canSubmit || isLocked}
                              onChange={(e) => updateRow(r._key, { roomNumber: e.target.value, roomId: '' })}
                            />
                          )}
                        </div>
                        {/* Type */}
                        <div>
                          <label className="label sm:hidden">Type</label>
                          {typeLocked ? (
                            <input className="input bg-surface-low" value={r.roomType} disabled title="Auto from the room" />
                          ) : (
                            <select
                              className="input"
                              value={r.roomType}
                              disabled={!canSubmit || isLocked}
                              onChange={(e) => updateRow(r._key, { roomType: e.target.value })}
                            >
                              <option value="">Select…</option>
                              {config.data!.roomTypes.map((t) => (
                                <option key={t.id} value={t.name}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        {/* Source */}
                        <div>
                          <label className="label sm:hidden">Source</label>
                          <select
                            className="input"
                            value={r.source}
                            disabled={!canSubmit || isLocked}
                            onChange={(e) => updateRow(r._key, { source: e.target.value as RoomSaleSource, sourceDetail: '' })}
                          >
                            {ROOM_SALE_SOURCES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Source detail */}
                        <div>
                          <label className="label sm:hidden">Source Detail</label>
                          {r.source === 'ONLINE' && (
                            <select
                              className="input"
                              value={r.sourceDetail}
                              disabled={!canSubmit || isLocked}
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
                              disabled={!canSubmit || isLocked}
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
                          {r.source === 'WALK_IN' && (
                            <span className="block py-2 text-sm text-on-surface-variant">—</span>
                          )}
                        </div>
                        {/* Price */}
                        <div>
                          <label className="label sm:hidden">Price (₹)</label>
                          <input
                            className="input text-right"
                            type="number"
                            min={0}
                            value={r.priceSold}
                            disabled={!canSubmit || isLocked}
                            onChange={(e) => updateRow(r._key, { priceSold: e.target.value })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-outline-variant pt-3 text-sm">
                  <span className="font-semibold">Total revenue ({sold} rooms)</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(revenue)}</span>
                </div>
              </>
            )}

            {rows.length === 0 && sold > 0 && (
              <div className="mt-6 rounded-md border border-dashed border-outline-variant bg-surface-low py-6 text-center text-sm text-on-surface-variant">
                Enter "Sold rooms" above to auto-expand the table.
              </div>
            )}

            <div className="mt-4">
              <label className="label">Notes (optional)</label>
              <textarea
                className="input"
                rows={2}
                value={notes}
                disabled={!canSubmit || isLocked}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {formError && (
              <div className="mt-3 text-sm">
                <p className="text-danger">{formError}</p>
              </div>
            )}

            {canSubmit && !isLocked && (
              <div className="mt-4 flex items-center gap-2">
                <button className="btn-primary" disabled={save.isPending || !isWindowActive} onClick={handleSave}>
                  {save.isPending ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {current?.data ? 'Update' : 'Submit'} {slotMeta.label} Report
                </button>
                {save.isSuccess && !save.isPending && <span className="text-sm text-success">Saved ✓</span>}
              </div>
            )}

            {isLocked && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>This slot is locked (time window has passed). Only admins can delete and re-submit if needed.</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
