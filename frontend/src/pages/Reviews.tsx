import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Star, Trash2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { api, apiError } from '../lib/api';
import { Review, ReviewAnalytics } from '../lib/types';
import { PageHeader, StatCard, LoadingState, ErrorState, EmptyState, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const SOURCES = ['GOOGLE', 'OTA', 'OTHER'] as const;

export default function Reviews() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = !!user && ['ADMIN', 'REVENUE', 'MANAGEMENT'].includes(user.role);

  const [sourceFilter, setSourceFilter] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    source: 'GOOGLE' as (typeof SOURCES)[number],
    rating: 5,
    author: '',
    text: '',
    reviewedAt: format(new Date(), 'yyyy-MM-dd'),
  });

  const analytics = useQuery({
    queryKey: ['reviews-analytics'],
    queryFn: async () => (await api.get<ReviewAnalytics>('/reviews/analytics')).data,
  });

  const list = useQuery({
    queryKey: ['reviews', sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sourceFilter) params.set('source', sourceFilter);
      return (await api.get<Review[]>(`/reviews?${params.toString()}`)).data;
    },
  });

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post('/reviews', {
          source: form.source,
          rating: Number(form.rating),
          author: form.author || null,
          text: form.text || null,
          reviewedAt: form.reviewedAt,
        })
      ).data,
    onSuccess: () => {
      setAdding(false);
      setForm({ source: 'GOOGLE', rating: 5, author: '', text: '', reviewedAt: format(new Date(), 'yyyy-MM-dd') });
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['reviews-analytics'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/reviews/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['reviews-analytics'] });
    },
  });

  const a = analytics.data;
  const distData = a
    ? Object.entries(a.distribution).map(([rating, count]) => ({ rating: `${rating}★`, count }))
    : [];

  return (
    <div>
      <PageHeader
        title="Review Tracker"
        subtitle="Monitor guest ratings across Google, OTAs and other channels."
        action={
          canEdit && (
            <button className="btn-primary" onClick={() => setAdding((v) => !v)}>
              <Plus className="h-4 w-4" /> Add Review
            </button>
          )
        }
      />

      {analytics.isLoading && <LoadingState />}
      {analytics.error && <ErrorState message={apiError(analytics.error)} />}

      {a && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Average Rating" value={a.avgRating.toFixed(2)} accent="gold" icon={<Star className="h-5 w-5" />} />
            <StatCard label="Total Reviews" value={a.total} accent="navy" />
            <StatCard
              label="Negative (≤2★)"
              value={a.negativeCount}
              accent={a.negativeCount > 0 ? 'danger' : 'success'}
            />
            <StatCard
              label="Open Complaints"
              value={a.complaints.open}
              hint={`${a.complaints.closed} resolved`}
              accent={a.complaints.open > 0 ? 'warning' : 'success'}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <h2 className="text-lg font-semibold text-navy">Rating Distribution</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f0bf6e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-navy">By Source</h2>
              <div className="mt-4 space-y-3">
                {Object.entries(a.bySource).length === 0 && (
                  <p className="text-sm text-on-surface-variant">No reviews yet.</p>
                )}
                {Object.entries(a.bySource).map(([src, v]) => (
                  <div key={src} className="flex items-center justify-between rounded-md bg-surface-low px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-on-surface">{src}</p>
                      <p className="text-xs text-on-surface-variant">{v.count} review(s)</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-gold">
                      {v.avg.toFixed(2)} <Star className="h-3.5 w-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {adding && canEdit && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-navy">Add Review</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Source</label>
              <select
                className="input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as (typeof SOURCES)[number] })}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Rating (0-5)</label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.5}
                className="input"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Author</label>
              <input className="input" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.reviewedAt}
                onChange={(e) => setForm({ ...form, reviewedAt: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="label">Review text</label>
              <textarea
                className="input"
                rows={2}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
              />
            </div>
          </div>
          {create.error && <div className="mt-3"><ErrorState message={apiError(create.error)} /></div>}
          <div className="mt-4 flex gap-2">
            <button className="btn-primary" disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending && <Spinner className="h-4 w-4" />} Save Review
            </button>
            <button className="btn-secondary" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="card-compact mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Filter by source</label>
            <select className="input" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="">All sources</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {list.isLoading && <LoadingState />}
        {list.error && <ErrorState message={apiError(list.error)} />}
        {list.data && (
          <div className="card overflow-x-auto">
            {list.data.length === 0 ? (
              <EmptyState title="No reviews found" />
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Date</th>
                    <th className="table-th">Source</th>
                    <th className="table-th">Rating</th>
                    <th className="table-th">Author</th>
                    <th className="table-th">Review</th>
                    {canEdit && <th className="table-th"></th>}
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-low">
                      <td className="table-td whitespace-nowrap">{format(new Date(r.reviewedAt), 'd MMM yyyy')}</td>
                      <td className="table-td">{r.source}</td>
                      <td className="table-td">
                        <span className="flex items-center gap-1 font-medium text-gold">
                          {r.rating.toFixed(1)} <Star className="h-3.5 w-3.5" />
                        </span>
                      </td>
                      <td className="table-td text-on-surface-variant">{r.author ?? '-'}</td>
                      <td className="table-td max-w-md text-on-surface-variant">{r.text ?? '-'}</td>
                      {canEdit && (
                        <td className="table-td text-right">
                          <button
                            className="text-danger hover:opacity-70"
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(r.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
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
