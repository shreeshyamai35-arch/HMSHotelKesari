import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, Info, Copy, ChevronLeft, ChevronRight, History, X } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api, apiError } from '../lib/api';
import {
  OccupancyAnalytics,
  OccupancyConfig,
  OccupancyDay,
  OccupancyHistory,
  OccupancySlotKey,
  Room,
  RoomSaleSource,
} from '../lib/types';
import { OCCUPANCY_SLOTS, ROOM_SALE_SOURCES, formatCurrency } from '../lib/constants';
import { PageHeader, StatCard, LoadingState, ErrorState, EmptyState, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

interface SaleRow {
  _key: string;
  roomId: string; // '' = not picked from the room list (legacy / free text)
  roomType: string;
  roomNumber: string;
  source: RoomSaleSource;
  sourceDetail: string;
  priceSold: string; // keep as string for controlled input
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

// ─── Draft persistence (survives dropped connections / reloads) ───
interface Draft {
  workingRooms: string;
  notes: string;
  rows: SaleRow[];
  savedAt: string;
}

const draftKey = (date: string, slot: string) => `kesari_occ_draft:${date}:${slot}`;

function readDraft(date: string, slot: string): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(date, slot));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!Array.isArray(parsed.rows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearDraft(date: string, slot: string) {
  localStorage.removeItem(draftKey(date, slot));
}

/** The slot whose data naturally precedes the given one (for "copy from"). */
function previousSlotRef(date: string, slot: OccupancySlotKey): { date: string; slot: OccupancySlotKey; label: string } {
  if (slot === 'SLOT_1000') {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() - 1);
    return { date: toYMD(d), slot: 'SLOT_2200', label: "yesterday's 10 PM" };
  }
  if (slot === 'SLOT_1600') return { date, slot: 'SLOT_1000', label: "today's 10 AM" };
  return { date, slot: 'SLOT_1600', label: "today's 4 PM" };
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
  const [draftRestored, setDraftRestored] = useState<string | null>(null); // savedAt when restored
  const [copyMsg, setCopyMsg] = useState('');

  // Guards so the draft autosave never writes another slot's data.
  const dirtyRef = useRef(false);
  const slotKeyRef = useRef(`${date}:${slot}`);

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
  const roomList: Room[] = config.data?.rooms ?? [];
  const hasRooms = roomList.length > 0;

  function loadFromServer() {
    if (current?.data) {
      setWorkingRooms(String(current.data.workingRooms));
      setNotes(current.data.notes ?? '');
      setRows(
        current.data.sales.map((s) => {
          // Re-link legacy sales (saved before the room list existed) by number.
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
    } else {
      setWorkingRooms('');
      setNotes('');
      setRows([]);
    }
  }

  // Load the selected slot: an unsaved draft wins over server data.
  useEffect(() => {
    setFormError('');
    setCopyMsg('');
    slotKeyRef.current = `${date}:${slot}`;
    const draft = readDraft(date, slot);
    if (draft) {
      setWorkingRooms(draft.workingRooms);
      setNotes(draft.notes);
      setRows(draft.rows.map((r) => ({ ...newRow(), ...r })));
      setDraftRestored(draft.savedAt);
      dirtyRef.current = true;
      return;
    }
    setDraftRestored(null);
    dirtyRef.current = false;
    loadFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.data?.id, slot, date, config.isSuccess]);

  // Autosave the draft while editing (400 ms debounce).
  useEffect(() => {
    if (!dirtyRef.current) return;
    const key = slotKeyRef.current;
    const t = setTimeout(() => {
      if (key !== slotKeyRef.current) return;
      const [d, s] = key.split(':').length >= 2 ? [key.slice(0, 10), key.slice(11)] : [date, slot];
      const isEmpty = !workingRooms && !notes && rows.length === 0;
      if (isEmpty) {
        localStorage.removeItem(draftKey(d, s));
      } else {
        localStorage.setItem(
          draftKey(d, s),
          JSON.stringify({ workingRooms, notes, rows, savedAt: new Date().toISOString() } satisfies Draft)
        );
      }
    }, 400);
    return () => clearTimeout(t);
  }, [workingRooms, notes, rows, date, slot]);

  function touch() {
    dirtyRef.current = true;
  }

  const working = parseInt(workingRooms || '0', 10) || 0;
  const outOfOrder = Math.max(0, totalRooms - working);
  const roomsSold = rows.length;
  const revenue = rows.reduce((s, r) => s + (parseFloat(r.priceSold) || 0), 0);
  const occupancy = working > 0 ? (roomsSold / working) * 100 : 0;
  const zeroPriceCount = rows.filter((r) => !(parseFloat(r.priceSold) > 0)).length;

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        date,
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
      setDraftRestored(null);
      dirtyRef.current = false;
      clearDraft(date, slot);
      qc.invalidateQueries({ queryKey: ['occupancy', date] });
      qc.invalidateQueries({ queryKey: ['occupancy-analytics'] });
      qc.invalidateQueries({ queryKey: ['occupancy-history'] });
    },
    onError: (err) => setFormError(apiError(err)),
  });

  function validate(): string | null {
    if (totalRooms <= 0) return 'Total rooms is not set. Ask an Admin to configure rooms in Settings.';
    if (!workingRooms) return 'Enter the number of working rooms.';
    if (working > totalRooms) return `Working rooms cannot exceed total rooms (${totalRooms}).`;
    if (roomsSold > working) return `Rooms sold (${roomsSold}) cannot exceed working rooms (${working}).`;
    for (const r of rows) {
      if (!r.roomNumber.trim()) return hasRooms ? 'A room row has no room selected.' : 'A room row is missing its room number.';
      if (!r.roomType) return `Room ${r.roomNumber}: missing room type.`;
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
    touch();
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
      // Auto-fill the type from the room; keep any manual type when the room has none.
      ...(room.roomTypeName ? { roomType: room.roomTypeName } : {}),
    });
  }

  async function copyFromPrevious() {
    const prev = previousSlotRef(date, slot);
    setCopyMsg('');
    try {
      let sourceSlot = null;
      if (prev.date === date) {
        sourceSlot = day.data?.slots.find((s) => s.slot === prev.slot)?.data ?? null;
      } else {
        const res = (await api.get<OccupancyDay>('/occupancy', { params: { date: prev.date } })).data;
        sourceSlot = res.slots.find((s) => s.slot === prev.slot)?.data ?? null;
      }
      if (!sourceSlot) {
        setCopyMsg(`No submitted report found for ${prev.label}.`);
        return;
      }
      if (rows.length > 0 && !window.confirm('Replace the rooms currently in the form with the copied ones?')) {
        return;
      }
      touch();
      setWorkingRooms(String(sourceSlot.workingRooms));
      setRows(
        sourceSlot.sales.map((s) => ({
          _key: Math.random().toString(36).slice(2),
          roomId: s.roomId ?? roomList.find((r) => r.number === s.roomNumber)?.id ?? '',
          roomType: s.roomType,
          roomNumber: s.roomNumber,
          source: s.source,
          sourceDetail: s.sourceDetail ?? '',
          priceSold: String(s.priceSold),
        }))
      );
      setCopyMsg(`Copied ${sourceSlot.sales.length} room(s) from ${prev.label}. Adjust and submit.`);
    } catch (err) {
      setCopyMsg(apiError(err));
    }
  }

  function discardDraft() {
    clearDraft(date, slot);
    setDraftRestored(null);
    dirtyRef.current = false;
    loadFromServer();
  }

  const slotMeta = OCCUPANCY_SLOTS.find((s) => s.value === slot)!;
  const prevRef = previousSlotRef(date, slot);
  const usedRoomIds = new Set(rows.map((r) => r.roomId).filter(Boolean));

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
            const daySlot = day.data?.slots.find((x) => x.slot === s.value);
            const submitted = daySlot?.submitted;
            const hasDraft = !!readDraft(date, s.value);
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
                  {submitted ? '✓ Submitted' : hasDraft ? '● Draft' : 'Pending'}
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
              <span>No rooms configured yet. An Admin must add rooms (or set a total) under Settings before submitting occupancy.</span>
            </div>
          )}

          {/* Metric cards */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total Rooms" value={totalRooms} hint={hasRooms ? 'From the Rooms list' : 'Fixed in Settings'} />
            <StatCard label="Working Rooms" value={working} accent="success" />
            <StatCard label="Out of Order" value={outOfOrder} accent={outOfOrder > 0 ? 'danger' : 'navy'} hint="Auto: total − working" />
            <StatCard label="Occupancy" value={`${occupancy.toFixed(1)}%`} accent="gold" hint={`${roomsSold} sold`} />
          </div>

          {/* Slot form */}
          <div className="card mb-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-navy">
                {slotMeta.label} Report <span className="text-sm font-normal text-on-surface-variant">({slotMeta.window})</span>
              </h2>
              <div className="flex items-center gap-3">
                {canSubmit && !current?.data && (
                  <button className="btn-secondary" onClick={copyFromPrevious} title={`Copy rooms from ${prevRef.label}`}>
                    <Copy className="h-4 w-4" /> Copy from {prevRef.label}
                  </button>
                )}
                {current?.data && (
                  <span className="text-xs text-on-surface-variant">Last submitted by {current.data.submittedByName}</span>
                )}
              </div>
            </div>

            {draftRestored && (
              <div className="mb-4 flex items-center justify-between gap-2 rounded-md border border-gold/40 bg-gold-container/30 px-3 py-2 text-sm text-on-surface">
                <span>
                  Unsaved draft restored (saved {new Date(draftRestored).toLocaleString()}). It is kept on this device
                  until you submit.
                </span>
                <button className="inline-flex shrink-0 items-center gap-1 text-danger hover:opacity-70" onClick={discardDraft}>
                  <X className="h-4 w-4" /> Discard draft
                </button>
              </div>
            )}
            {copyMsg && <p className="mb-3 text-sm text-on-surface-variant">{copyMsg}</p>}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                  onChange={(e) => {
                    touch();
                    setWorkingRooms(e.target.value);
                  }}
                />
              </div>
              <div>
                <label className="label">Out of order (puncture)</label>
                <input className="input bg-surface-low" value={outOfOrder} disabled />
              </div>
            </div>

            {/* Room sales */}
            <div className="mt-6 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy">
                Rooms Sold <span className="text-on-surface-variant">({roomsSold})</span>
              </h3>
              {canSubmit && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    touch();
                    setRows((p) => [...p, newRow()]);
                  }}
                >
                  <Plus className="h-4 w-4" /> Add Room
                </button>
              )}
            </div>

            {/* Column headers (desktop only) */}
            {rows.length > 0 && (
              <div className="mb-1 hidden grid-cols-[1.1fr_1fr_1fr_1.2fr_110px_36px] gap-2 px-1 sm:grid">
                <span className="table-th !p-0">Room</span>
                <span className="table-th !p-0">Type</span>
                <span className="table-th !p-0">Source</span>
                <span className="table-th !p-0">Source Detail</span>
                <span className="table-th !p-0 text-right">Price (₹)</span>
                <span />
              </div>
            )}

            {rows.length === 0 && (
              <p className="rounded-md border border-dashed border-outline-variant bg-surface-low py-6 text-center text-sm text-on-surface-variant">
                No rooms added yet.
              </p>
            )}

            <div className="space-y-3 sm:space-y-1.5">
              {rows.map((r) => {
                const selectedRoom = r.roomId ? roomList.find((x) => x.id === r.roomId) : undefined;
                const legacyUnmatched = hasRooms && !r.roomId && !!r.roomNumber;
                const typeLocked = !!selectedRoom?.roomTypeName;
                return (
                  <div
                    key={r._key}
                    className="grid grid-cols-2 gap-2 rounded-md border border-outline-variant p-3 sm:grid-cols-[1.1fr_1fr_1fr_1.2fr_110px_36px] sm:items-center sm:border-0 sm:p-0"
                  >
                    {/* Room */}
                    <div>
                      <label className="label sm:hidden">Room</label>
                      {hasRooms && !legacyUnmatched ? (
                        <select
                          className="input"
                          value={r.roomId}
                          disabled={!canSubmit}
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
                          disabled={!canSubmit}
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
                      )}
                    </div>
                    {/* Source */}
                    <div>
                      <label className="label sm:hidden">Source</label>
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
                    </div>
                    {/* Source detail */}
                    <div>
                      <label className="label sm:hidden">Source Detail</label>
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
                        disabled={!canSubmit}
                        onChange={(e) => updateRow(r._key, { priceSold: e.target.value })}
                      />
                    </div>
                    {/* Remove */}
                    <div className="flex items-center justify-end">
                      {canSubmit && (
                        <button
                          className="text-danger hover:opacity-70"
                          title="Remove room"
                          onClick={() => {
                            touch();
                            setRows((p) => p.filter((x) => x._key !== r._key));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {rows.length > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-outline-variant pt-3 text-sm">
                <span className="font-semibold">Total revenue ({roomsSold} rooms)</span>
                <span className="font-semibold tabular-nums">{formatCurrency(revenue)}</span>
              </div>
            )}
            {zeroPriceCount > 0 && (
              <p className="mt-2 text-xs text-warning">
                ⚠ {zeroPriceCount} room(s) have a price of ₹0 — double-check before submitting.
              </p>
            )}

            <div className="mt-4">
              <label className="label">Notes (optional)</label>
              <textarea
                className="input"
                rows={2}
                value={notes}
                disabled={!canSubmit}
                onChange={(e) => {
                  touch();
                  setNotes(e.target.value);
                }}
              />
            </div>

            {formError && (
              <div className="mt-3 text-sm">
                <p className="text-danger">{formError}</p>
                {save.isError && (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Your entry is kept as a draft on this device — nothing is lost. Fix the issue (or your connection) and
                    press Submit again.
                  </p>
                )}
              </div>
            )}

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

          <HistoryCard
            onPick={(d) => {
              setDate(d);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          <OccupancyAnalyticsPanel />
        </>
      )}
    </div>
  );
}

// ─── Month history (day-by-day) ───────────────────────────
function HistoryCard({ onPick }: { onPick: (date: string) => void }) {
  const [month, setMonth] = useState(todayStr().slice(0, 7)); // YYYY-MM
  const currentMonth = todayStr().slice(0, 7);

  const { data, isLoading } = useQuery({
    queryKey: ['occupancy-history', month],
    queryFn: async () => (await api.get<OccupancyHistory>('/occupancy/history', { params: { month } })).data,
  });

  function shiftMonth(delta: number) {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="card mb-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
          <History className="h-5 w-5" /> Month History
        </h2>
        <div className="flex items-center gap-1">
          <button className="rounded p-1 hover:bg-surface-low" onClick={() => shiftMonth(-1)} title="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[9rem] text-center text-sm font-medium">{monthLabel}</span>
          <button
            className="rounded p-1 hover:bg-surface-low disabled:opacity-30"
            onClick={() => shiftMonth(1)}
            disabled={month >= currentMonth}
            title="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isLoading && <LoadingState label="Loading history…" />}
      {data && data.days.length === 0 && (
        <EmptyState title="No reports this month" description="Submitted days will appear here." />
      )}
      {data && data.days.length > 0 && (
        <>
          <p className="mb-2 text-sm text-on-surface-variant">
            {data.totals.daysReported} days reported · {formatCurrency(data.totals.revenue)} · avg occupancy{' '}
            {data.totals.avgOccupancy.toFixed(1)}%
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th text-center">10 AM</th>
                  <th className="table-th text-center">4 PM</th>
                  <th className="table-th text-center">10 PM</th>
                  <th className="table-th text-right">Occupancy</th>
                  <th className="table-th text-right">Rooms</th>
                  <th className="table-th text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[...data.days].reverse().map((d) => (
                  <tr
                    key={d.date}
                    className="cursor-pointer hover:bg-surface-low"
                    title="Open this day in the form above"
                    onClick={() => onPick(d.date)}
                  >
                    <td className="table-td font-medium">
                      {new Date(`${d.date}T00:00:00`).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        weekday: 'short',
                      })}
                    </td>
                    {(['SLOT_1000', 'SLOT_1600', 'SLOT_2200'] as OccupancySlotKey[]).map((s) => (
                      <td key={s} className="table-td text-center">
                        {d.submittedSlots.includes(s) ? (
                          <span className="text-success">✓</span>
                        ) : (
                          <span className="text-on-surface-variant/40">—</span>
                        )}
                      </td>
                    ))}
                    <td className="table-td text-right tabular-nums">{d.occupancy.toFixed(1)}%</td>
                    <td className="table-td text-right tabular-nums">{d.roomsSold}</td>
                    <td className="table-td text-right tabular-nums">{formatCurrency(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Analytics panel (date range + trend + breakdowns) ────
function OccupancyAnalyticsPanel() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toYMD(d);
  });
  const [to, setTo] = useState(todayStr());

  const { data, isLoading } = useQuery({
    queryKey: ['occupancy-analytics', from, to],
    queryFn: async () =>
      (await api.get<OccupancyAnalytics>('/occupancy/analytics', { params: { from, to } })).data,
  });

  const sourceLabels: Record<string, string> = { ONLINE: 'Online', WALK_IN: 'Walk-in', PUJARI: 'Pujari Ji' };
  const pujariEntries = Object.entries(data?.byPujari ?? {});
  const otaEntries = Object.entries(data?.byOta ?? {});
  const roomEntries = Object.entries(data?.byRoom ?? {}).sort((a, b) => b[1].revenue - a[1].revenue);
  const roomTypeEntries = Object.entries(data?.byRoomType ?? {}).sort((a, b) => b[1].revenue - a[1].revenue);

  const chartData = (data?.trend ?? []).map((t) => ({
    label: new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: t.revenue,
    occupancy: t.occupancy,
  }));

  return (
    <div className="card">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy">Occupancy Analytics</h2>
          {data && (
            <p className="mt-1 text-sm text-on-surface-variant">
              {data.totalRoomsSold} rooms sold · {formatCurrency(data.totalRevenue)} · ADR {formatCurrency(data.avgAdr)} ·
              Avg occupancy {data.avgOccupancy.toFixed(1)}%
            </p>
          )}
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              className="input"
              value={to}
              min={from}
              max={todayStr()}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading && <LoadingState label="Loading analytics…" />}

      {data && data.totalRoomsSold === 0 && (
        <EmptyState title="No occupancy data in this range" description="Submit occupancy reports to see analytics." />
      )}

      {data && data.totalRoomsSold > 0 && (
        <>
          {/* Trend chart */}
          {chartData.length > 1 && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-navy">Daily Revenue & Occupancy</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={16} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 11 }} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                  <YAxis yAxisId="occ" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'Occupancy %' ? [`${value.toFixed(1)}%`, name] : [formatCurrency(value), name]
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="rev" dataKey="revenue" name="Revenue" fill="#131b2e" radius={[3, 3, 0, 0]} />
                  <Line
                    yAxisId="occ"
                    type="monotone"
                    dataKey="occupancy"
                    name="Occupancy %"
                    stroke="#7c580f"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

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

            <div className="lg:col-span-2">
              <h3 className="mb-2 text-sm font-semibold text-navy">By Room (best to least sold)</h3>
              {roomEntries.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No room data.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {roomEntries.slice(0, 12).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded-md bg-surface-low px-3 py-2 text-sm">
                      <span className="font-medium">Room {k}</span>
                      <span className="tabular-nums text-on-surface-variant">
                        {v.rooms}× · {formatCurrency(v.revenue)}
                      </span>
                    </div>
                  ))}
                  {roomEntries.length > 12 && (
                    <p className="px-1 text-xs text-on-surface-variant">…and {roomEntries.length - 12} more rooms.</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-navy">By Room Type</h3>
              {roomTypeEntries.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No data.</p>
              ) : (
                <div className="space-y-2">
                  {roomTypeEntries.map(([k, v]) => (
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
          </div>
        </>
      )}
    </div>
  );
}
