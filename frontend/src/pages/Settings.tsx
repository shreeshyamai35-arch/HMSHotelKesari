import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, Power } from 'lucide-react';
import { api, apiError } from '../lib/api';
import { Room, RoomType, SettingsData } from '../lib/types';
import { PageHeader, LoadingState, ErrorState, Spinner } from '../components/ui';

export default function Settings() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<SettingsData>('/settings')).data,
  });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure hotel rooms and Occupancy Manager dropdown lists." />

      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}

      {data && (
        <div className="space-y-4">
          <RoomsManager
            rooms={data.rooms ?? []}
            roomTypes={data.roomTypes}
            onChange={() => qc.invalidateQueries({ queryKey: ['settings'] })}
          />

          <TotalRoomsCard
            total={data.totalRooms}
            activeRoomCount={(data.rooms ?? []).filter((r) => r.active).length}
            onSaved={() => qc.invalidateQueries({ queryKey: ['settings'] })}
          />

          <ListManager
            title="Room Types"
            description="Shown as a dropdown when adding sold rooms."
            items={data.roomTypes}
            endpoint="/settings/room-types"
            onChange={() => qc.invalidateQueries({ queryKey: ['settings'] })}
          />

          <ListManager
            title="Online Sources (OTAs)"
            description="Options shown when a room's source is 'Online'."
            items={data.onlineSources}
            endpoint="/settings/online-sources"
            onChange={() => qc.invalidateQueries({ queryKey: ['settings'] })}
          />

          <PujariManager pujaris={data.pujaris} onChange={() => qc.invalidateQueries({ queryKey: ['settings'] })} />

          <RevenueTiersCard
            low={data.revenueTiers?.low ?? null}
            high={data.revenueTiers?.high ?? null}
            onSaved={() => qc.invalidateQueries({ queryKey: ['settings'] })}
          />
        </div>
      )}
    </div>
  );
}

function RevenueTiersCard({ low, high, onSaved }: { low: number | null; high: number | null; onSaved: () => void }) {
  const [lowV, setLowV] = useState(low === null ? '' : String(low));
  const [highV, setHighV] = useState(high === null ? '' : String(high));
  useEffect(() => {
    setLowV(low === null ? '' : String(low));
    setHighV(high === null ? '' : String(high));
  }, [low, high]);

  const save = useMutation({
    mutationFn: async () =>
      (
        await api.put('/settings/revenue-tiers', {
          low: lowV === '' ? null : parseFloat(lowV),
          high: highV === '' ? null : parseFloat(highV),
        })
      ).data,
    onSuccess: onSaved,
  });

  const isAuto = lowV === '' && highV === '';

  return (
    <div className="card">
      <h2 className="mb-1 text-lg font-semibold text-navy">Revenue Calendar Tiers</h2>
      <p className="mb-3 text-sm text-on-surface-variant">
        Daily revenue color-coding on the Analytics calendar. Leave both blank for automatic (relative to each month's
        average). Set values for fixed thresholds.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="label">Low below (₹)</label>
          <input className="input w-40" type="number" min={0} placeholder="auto" value={lowV} onChange={(e) => setLowV(e.target.value)} />
        </div>
        <div>
          <label className="label">High at/above (₹)</label>
          <input className="input w-40" type="number" min={0} placeholder="auto" value={highV} onChange={(e) => setHighV(e.target.value)} />
        </div>
        <button className="btn-primary" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Save
        </button>
        <span className="pb-2 text-xs text-on-surface-variant">{isAuto ? 'Mode: Automatic' : 'Mode: Fixed thresholds'}</span>
        {save.isSuccess && !save.isPending && <span className="pb-2 text-sm text-success">Saved ✓</span>}
      </div>
    </div>
  );
}

function TotalRoomsCard({
  total,
  activeRoomCount,
  onSaved,
}: {
  total: number;
  activeRoomCount: number;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(String(total));
  useEffect(() => setValue(String(total)), [total]);

  const save = useMutation({
    mutationFn: async () => (await api.put('/settings/total-rooms', { totalRooms: parseInt(value, 10) || 0 })).data,
    onSuccess: onSaved,
  });

  return (
    <div className="card">
      <h2 className="mb-1 text-lg font-semibold text-navy">Total Rooms in Hotel</h2>
      <p className="mb-3 text-sm text-on-surface-variant">
        {activeRoomCount > 0
          ? `Currently derived from the Rooms list above (${activeRoomCount} active rooms). This manual value is used only when no rooms are defined.`
          : 'Set once — auto-filled in every occupancy report. Tip: add your rooms in the Rooms list above and this becomes automatic.'}
      </p>
      <div className="flex items-end gap-2">
        <div>
          <label className="label">Total rooms</label>
          <input className="input w-40" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <button className="btn-primary" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Save
        </button>
        {save.isSuccess && !save.isPending && <span className="pb-2 text-sm text-success">Saved ✓</span>}
      </div>
    </div>
  );
}

function RoomsManager({
  rooms,
  roomTypes,
  onChange,
}: {
  rooms: Room[];
  roomTypes: RoomType[];
  onChange: () => void;
}) {
  const [numbers, setNumbers] = useState('');
  const [typeId, setTypeId] = useState('');
  const [err, setErr] = useState('');

  const add = useMutation({
    mutationFn: async () =>
      (await api.post('/settings/rooms', { numbers: numbers.trim(), roomTypeId: typeId || null })).data,
    onSuccess: () => {
      setNumbers('');
      setErr('');
      onChange();
    },
    onError: (e) => setErr(apiError(e)),
  });

  const patch = useMutation({
    mutationFn: async (input: { id: string; data: Partial<Pick<Room, 'roomTypeId' | 'active'>> }) =>
      (await api.patch(`/settings/rooms/${input.id}`, input.data)).data,
    onSuccess: () => {
      setErr('');
      onChange();
    },
    onError: (e) => setErr(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/settings/rooms/${id}`)).data,
    onSuccess: onChange,
    onError: (e) => setErr(apiError(e)),
  });

  const activeCount = rooms.filter((r) => r.active).length;

  return (
    <div className="card">
      <h2 className="mb-1 text-lg font-semibold text-navy">Rooms</h2>
      <p className="mb-3 text-sm text-on-surface-variant">
        Your hotel's physical rooms. The Occupancy Manager picks from this list (no more typing room numbers), and the
        total room count is derived from it automatically.
      </p>

      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_200px_auto]">
        <div>
          <label className="label">Room number(s) — comma-separated for many</label>
          <input
            className="input"
            value={numbers}
            placeholder="e.g. 101, 102, 103"
            onChange={(e) => setNumbers(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && numbers.trim() && add.mutate()}
          />
        </div>
        <div>
          <label className="label">Room type</label>
          <select className="input" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            <option value="">No type</option>
            {roomTypes
              .filter((t) => t.active)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-primary" disabled={!numbers.trim() || add.isPending} onClick={() => add.mutate()}>
            {add.isPending ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </div>
      </div>
      {err && <p className="mb-2 text-sm text-danger">{err}</p>}

      {rooms.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No rooms added yet.</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-on-surface-variant">
            {rooms.length} rooms · {activeCount} active
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr>
                  <th className="table-th">Room No.</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id} className={r.active ? 'hover:bg-surface-low' : 'opacity-50 hover:bg-surface-low'}>
                    <td className="table-td font-medium">{r.number}</td>
                    <td className="table-td">
                      <select
                        className="input py-1"
                        value={r.roomTypeId ?? ''}
                        onChange={(e) => patch.mutate({ id: r.id, data: { roomTypeId: e.target.value || null } })}
                      >
                        <option value="">No type</option>
                        {roomTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="table-td">
                      <span className={r.active ? 'badge-success' : 'badge-neutral'}>
                        {r.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="table-td text-right">
                      <div className="inline-flex items-center gap-3">
                        <button
                          className="text-on-surface-variant hover:text-navy"
                          title={r.active ? 'Deactivate (renovation / long-term block)' : 'Activate'}
                          onClick={() => patch.mutate({ id: r.id, data: { active: !r.active } })}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          className="text-danger hover:opacity-70"
                          title="Delete room (past reports keep their data)"
                          onClick={() => remove.mutate(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
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

interface NamedItem {
  id: string;
  name: string;
  active: boolean;
}

function ListManager({
  title,
  description,
  items,
  endpoint,
  onChange,
}: {
  title: string;
  description: string;
  items: NamedItem[];
  endpoint: string;
  onChange: () => void;
}) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  const add = useMutation({
    mutationFn: async () => (await api.post(endpoint, { name: name.trim() })).data,
    onSuccess: () => {
      setName('');
      setErr('');
      onChange();
    },
    onError: (e) => setErr(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`${endpoint}/${id}`)).data,
    onSuccess: onChange,
  });

  return (
    <div className="card">
      <h2 className="mb-1 text-lg font-semibold text-navy">{title}</h2>
      <p className="mb-3 text-sm text-on-surface-variant">{description}</p>

      <div className="mb-3 flex items-end gap-2">
        <div className="grow">
          <label className="label">Add new</label>
          <input
            className="input"
            value={name}
            placeholder={`New ${title.toLowerCase()}…`}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && add.mutate()}
          />
        </div>
        <button className="btn-primary" disabled={!name.trim() || add.isPending} onClick={() => add.mutate()}>
          {add.isPending ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Add
        </button>
      </div>
      {err && <p className="mb-2 text-sm text-danger">{err}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-on-surface-variant">None added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <span
              key={it.id}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-low px-3 py-1 text-sm"
            >
              {it.name}
              <button className="text-danger hover:opacity-70" onClick={() => remove.mutate(it.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface PujariItem {
  id: string;
  name: string;
  phone?: string | null;
  commissionPct: number;
  active: boolean;
}

function PujariManager({ pujaris, onChange }: { pujaris: PujariItem[]; onChange: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', commissionPct: '' });
  const [err, setErr] = useState('');

  const add = useMutation({
    mutationFn: async () =>
      (
        await api.post('/settings/pujaris', {
          name: form.name.trim(),
          phone: form.phone || null,
          commissionPct: parseFloat(form.commissionPct) || 0,
        })
      ).data,
    onSuccess: () => {
      setForm({ name: '', phone: '', commissionPct: '' });
      setErr('');
      onChange();
    },
    onError: (e) => setErr(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/settings/pujaris/${id}`)).data,
    onSuccess: onChange,
  });

  return (
    <div className="card">
      <h2 className="mb-1 text-lg font-semibold text-navy">Pujari Ji</h2>
      <p className="mb-3 text-sm text-on-surface-variant">Referral partners. Commission % is used in occupancy analytics.</p>

      <div className="mb-3 grid gap-2 sm:grid-cols-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone (optional)</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Commission %</label>
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            value={form.commissionPct}
            onChange={(e) => setForm({ ...form, commissionPct: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full" disabled={!form.name.trim() || add.isPending} onClick={() => add.mutate()}>
            {add.isPending ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </div>
      </div>
      {err && <p className="mb-2 text-sm text-danger">{err}</p>}

      {pujaris.length === 0 ? (
        <p className="text-sm text-on-surface-variant">None added yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Phone</th>
                <th className="table-th text-right">Commission %</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {pujaris.map((p) => (
                <tr key={p.id} className="hover:bg-surface-low">
                  <td className="table-td font-medium">{p.name}</td>
                  <td className="table-td text-on-surface-variant">{p.phone || '-'}</td>
                  <td className="table-td text-right tabular-nums">{p.commissionPct}%</td>
                  <td className="table-td text-right">
                    <button className="text-danger hover:opacity-70" onClick={() => remove.mutate(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
