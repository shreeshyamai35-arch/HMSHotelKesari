import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, IndianRupee, Percent, TrendingUp, Target } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api, apiError } from '../lib/api';
import { RevenueRecord, RevenueAnalytics, RevenueTarget } from '../lib/types';
import { PageHeader, StatCard, LoadingState, ErrorState, EmptyState, Spinner } from '../components/ui';
import { formatCurrency } from '../lib/constants';
import { useAuth } from '../context/AuthContext';

export default function Revenue() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = !!user && ['ADMIN', 'REVENUE'].includes(user.role);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    recordDate: format(new Date(), 'yyyy-MM-dd'),
    revenue: 0,
    roomsSold: 0,
    roomsAvailable: 0,
  });
  const [target, setTarget] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    targetRevenue: 0,
  });

  const qs = () => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return params.toString();
  };

  const analytics = useQuery({
    queryKey: ['revenue-analytics', from, to],
    queryFn: async () => (await api.get<RevenueAnalytics>(`/revenue/analytics?${qs()}`)).data,
  });

  const records = useQuery({
    queryKey: ['revenue-records', from, to],
    queryFn: async () => (await api.get<RevenueRecord[]>(`/revenue?${qs()}`)).data,
  });

  const targets = useQuery({
    queryKey: ['revenue-targets'],
    queryFn: async () => (await api.get<RevenueTarget[]>('/revenue/targets')).data,
  });

  const saveRecord = useMutation({
    mutationFn: async () =>
      (
        await api.post('/revenue', {
          recordDate: form.recordDate,
          revenue: Number(form.revenue),
          roomsSold: Number(form.roomsSold),
          roomsAvailable: Number(form.roomsAvailable),
        })
      ).data,
    onSuccess: () => {
      setAdding(false);
      qc.invalidateQueries({ queryKey: ['revenue-records'] });
      qc.invalidateQueries({ queryKey: ['revenue-analytics'] });
    },
  });

  const saveTarget = useMutation({
    mutationFn: async () =>
      (
        await api.post('/revenue/targets', {
          year: Number(target.year),
          month: Number(target.month),
          targetRevenue: Number(target.targetRevenue),
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revenue-targets'] });
      qc.invalidateQueries({ queryKey: ['revenue-analytics'] });
    },
  });

  const a = analytics.data;
  const trend = a?.trend.map((t) => ({ ...t, date: format(new Date(t.date), 'd MMM') })) ?? [];

  return (
    <div>
      <PageHeader
        title="Revenue Analytics"
        subtitle="Track revenue, ADR, RevPAR and occupancy against monthly targets."
        action={
          canEdit && (
            <button className="btn-primary" onClick={() => setAdding((v) => !v)}>
              <Plus className="h-4 w-4" /> Add Record
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
          <h2 className="text-lg font-semibold text-navy">Add / Update Daily Revenue</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.recordDate}
                onChange={(e) => setForm({ ...form, recordDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Revenue (₹)</label>
              <input
                type="number"
                className="input"
                value={form.revenue}
                onChange={(e) => setForm({ ...form, revenue: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Rooms Sold</label>
              <input
                type="number"
                className="input"
                value={form.roomsSold}
                onChange={(e) => setForm({ ...form, roomsSold: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Rooms Available</label>
              <input
                type="number"
                className="input"
                value={form.roomsAvailable}
                onChange={(e) => setForm({ ...form, roomsAvailable: Number(e.target.value) })}
              />
            </div>
          </div>
          {saveRecord.error && <div className="mt-3"><ErrorState message={apiError(saveRecord.error)} /></div>}
          <div className="mt-4 flex gap-2">
            <button className="btn-primary" disabled={saveRecord.isPending} onClick={() => saveRecord.mutate()}>
              {saveRecord.isPending && <Spinner className="h-4 w-4" />} Save
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Revenue" value={formatCurrency(a.totalRevenue)} accent="gold" icon={<IndianRupee className="h-5 w-5" />} />
            <StatCard label="Avg ADR" value={formatCurrency(a.avgAdr)} accent="navy" icon={<TrendingUp className="h-5 w-5" />} />
            <StatCard label="Avg RevPAR" value={formatCurrency(a.avgRevpar)} accent="navy" />
            <StatCard label="Occupancy" value={`${a.occupancy.toFixed(1)}%`} accent="success" icon={<Percent className="h-5 w-5" />} />
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-navy">Revenue Trend</h2>
            <div className="mt-4 h-72">
              {trend.length === 0 ? (
                <EmptyState title="No revenue data" description="Add daily revenue records to see trends." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#131b2e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="adr" name="ADR" stroke="#f0bf6e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="revpar" name="RevPAR" stroke="#2e7d32" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-navy">Revenue vs Target (Monthly)</h2>
            <div className="mt-4 h-72">
              {a.monthly.length === 0 ? (
                <EmptyState title="No monthly data" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={a.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#131b2e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Target" fill="#f0bf6e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {canEdit && (
        <div className="card mt-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
            <Target className="h-5 w-5" /> Monthly Revenue Targets
          </h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Year</label>
              <input
                type="number"
                className="input"
                value={target.year}
                onChange={(e) => setTarget({ ...target, year: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Month</label>
              <select
                className="input"
                value={target.month}
                onChange={(e) => setTarget({ ...target, month: Number(e.target.value) })}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {format(new Date(2000, m - 1, 1), 'MMMM')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Target Revenue (₹)</label>
              <input
                type="number"
                className="input"
                value={target.targetRevenue}
                onChange={(e) => setTarget({ ...target, targetRevenue: Number(e.target.value) })}
              />
            </div>
            <button className="btn-primary" disabled={saveTarget.isPending} onClick={() => saveTarget.mutate()}>
              {saveTarget.isPending && <Spinner className="h-4 w-4" />} Set Target
            </button>
          </div>
          {targets.data && targets.data.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {targets.data.map((t) => (
                <span key={t.id} className="rounded-md bg-surface-low px-3 py-1.5 text-sm">
                  {format(new Date(t.year, t.month - 1, 1), 'MMM yyyy')}:{' '}
                  <span className="font-semibold text-navy">{formatCurrency(t.targetRevenue)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-navy">Daily Records</h2>
        {records.isLoading && <LoadingState />}
        {records.error && <ErrorState message={apiError(records.error)} />}
        {records.data && (
          <div className="card overflow-x-auto">
            {records.data.length === 0 ? (
              <EmptyState title="No records" />
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Date</th>
                    <th className="table-th text-right">Revenue</th>
                    <th className="table-th text-right">Rooms Sold</th>
                    <th className="table-th text-right">Available</th>
                    <th className="table-th text-right">ADR</th>
                    <th className="table-th text-right">RevPAR</th>
                    <th className="table-th">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {[...records.data].reverse().map((r) => (
                    <tr key={r.id} className="hover:bg-surface-low">
                      <td className="table-td font-medium">{format(new Date(r.recordDate), 'd MMM yyyy')}</td>
                      <td className="table-td text-right tabular-nums">{formatCurrency(r.revenue)}</td>
                      <td className="table-td text-right tabular-nums">{r.roomsSold}</td>
                      <td className="table-td text-right tabular-nums">{r.roomsAvailable}</td>
                      <td className="table-td text-right tabular-nums">{formatCurrency(r.adr)}</td>
                      <td className="table-td text-right tabular-nums">{formatCurrency(r.revpar)}</td>
                      <td className="table-td text-on-surface-variant">{r.source}</td>
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
