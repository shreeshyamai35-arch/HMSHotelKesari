import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, CalendarRange, XCircle, BedDouble } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api, apiError } from '../lib/api';
import { Booking, BookingAnalytics } from '../lib/types';
import { PageHeader, StatCard, LoadingState, ErrorState, EmptyState, StatusBadge, Spinner } from '../components/ui';
import { formatCurrency } from '../lib/constants';
import { useAuth } from '../context/AuthContext';

const SOURCES = ['DIRECT', 'OTA', 'WALK_IN', 'CORPORATE', 'PMS'] as const;
const STATUSES = ['CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'] as const;
const PIE_COLORS = ['#131b2e', '#f0bf6e', '#2e7d32', '#7c580f', '#94a3b8'];

export default function Bookings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = !!user && ['ADMIN', 'REVENUE'].includes(user.role);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    bookingDate: format(new Date(), 'yyyy-MM-dd'),
    source: 'DIRECT' as (typeof SOURCES)[number],
    status: 'CONFIRMED' as (typeof STATUSES)[number],
    roomsBooked: 1,
    amount: 0,
    guestName: '',
  });

  const qs = () => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return params.toString();
  };

  const analytics = useQuery({
    queryKey: ['bookings-analytics', from, to],
    queryFn: async () => (await api.get<BookingAnalytics>(`/bookings/analytics?${qs()}`)).data,
  });

  const list = useQuery({
    queryKey: ['bookings', from, to],
    queryFn: async () => (await api.get<Booking[]>(`/bookings?${qs()}`)).data,
  });

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post('/bookings', {
          bookingDate: form.bookingDate,
          source: form.source,
          status: form.status,
          roomsBooked: Number(form.roomsBooked),
          amount: Number(form.amount),
          guestName: form.guestName || null,
        })
      ).data,
    onSuccess: () => {
      setAdding(false);
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['bookings-analytics'] });
    },
  });

  const a = analytics.data;
  const trend = a?.trend.map((t) => ({ ...t, date: format(new Date(t.date), 'd MMM') })) ?? [];

  return (
    <div>
      <PageHeader
        title="Booking Analytics"
        subtitle="Analyse booking sources, occupancy demand and cancellations."
        action={
          canEdit && (
            <button className="btn-primary" onClick={() => setAdding((v) => !v)}>
              <Plus className="h-4 w-4" /> Add Booking
            </button>
          )
        }
      />

      <div className="card-compact mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(from || to) && (
          <button
            className="btn-secondary"
            onClick={() => {
              setFrom('');
              setTo('');
            }}
          >
            Clear
          </button>
        )}
      </div>

      {adding && canEdit && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-navy">Add Booking</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.bookingDate}
                onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Source</label>
              <select
                className="input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as (typeof SOURCES)[number] })}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as (typeof STATUSES)[number] })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Rooms Booked</label>
              <input
                type="number"
                min={1}
                className="input"
                value={form.roomsBooked}
                onChange={(e) => setForm({ ...form, roomsBooked: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input
                type="number"
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Guest Name</label>
              <input
                className="input"
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
              />
            </div>
          </div>
          {create.error && <div className="mt-3"><ErrorState message={apiError(create.error)} /></div>}
          <div className="mt-4 flex gap-2">
            <button className="btn-primary" disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending && <Spinner className="h-4 w-4" />} Save
            </button>
            <button className="btn-secondary" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {analytics.isLoading && <LoadingState />}
      {analytics.error && <ErrorState message={apiError(analytics.error)} />}

      {a && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total Bookings" value={a.totalBookings} accent="navy" icon={<CalendarRange className="h-5 w-5" />} />
            <StatCard label="Rooms Booked" value={a.totalRoomsBooked} accent="gold" icon={<BedDouble className="h-5 w-5" />} />
            <StatCard
              label="Cancellation Rate"
              value={`${a.cancellationRate.toFixed(1)}%`}
              accent={a.cancellationRate > 20 ? 'danger' : 'success'}
              icon={<XCircle className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="text-lg font-semibold text-navy">Rooms by Source</h2>
              <div className="mt-4 h-64">
                {a.bySource.length === 0 ? (
                  <EmptyState title="No data" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={a.bySource} dataKey="rooms" nameKey="source" cx="50%" cy="50%" outerRadius={90} label>
                        {a.bySource.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-navy">Booking Demand Trend</h2>
              <div className="mt-4 h-64">
                {trend.length === 0 ? (
                  <EmptyState title="No data" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="rooms" name="Rooms" fill="#131b2e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-navy">Bookings</h2>
        {list.isLoading && <LoadingState />}
        {list.error && <ErrorState message={apiError(list.error)} />}
        {list.data && (
          <div className="card overflow-x-auto">
            {list.data.length === 0 ? (
              <EmptyState title="No bookings found" />
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Date</th>
                    <th className="table-th">Guest</th>
                    <th className="table-th">Source</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Rooms</th>
                    <th className="table-th text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-low">
                      <td className="table-td font-medium">{format(new Date(b.bookingDate), 'd MMM yyyy')}</td>
                      <td className="table-td">{b.guestName ?? '-'}</td>
                      <td className="table-td">{b.source.replace(/_/g, ' ')}</td>
                      <td className="table-td"><StatusBadge status={b.status} /></td>
                      <td className="table-td text-right tabular-nums">{b.roomsBooked}</td>
                      <td className="table-td text-right tabular-nums">{formatCurrency(b.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
