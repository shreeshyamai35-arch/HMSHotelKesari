import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { api, apiError } from '../lib/api';
import { DailyReport } from '../lib/types';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../components/ui';

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return (await api.get<DailyReport[]>(`/reports?${params.toString()}`)).data;
    },
  });

  return (
    <div>
      <PageHeader title="Operations Reports" subtitle="Browse and download previous daily reports." />

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

      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}

      {data && (
        <div className="card overflow-x-auto">
          {data.length === 0 ? (
            <EmptyState title="No reports found" description="Try a different date range." />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Employee</th>
                  <th className="table-th">Department</th>
                  <th className="table-th">Complaints</th>
                  <th className="table-th">Maintenance</th>
                  <th className="table-th">Submitted</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-low">
                    <td className="table-td font-medium">{format(new Date(r.reportDate), 'd MMM yyyy')}</td>
                    <td className="table-td">{r.employeeName}</td>
                    <td className="table-td text-on-surface-variant">{r.department ?? '-'}</td>
                    <td className="table-td">{r.complaints.length}</td>
                    <td className="table-td">{r.maintenance.length}</td>
                    <td className="table-td text-on-surface-variant">
                      {format(new Date(r.submittedAt), 'd MMM, HH:mm')}
                    </td>
                    <td className="table-td text-right">
                      <Link to={`/reports/${r.id}`} className="text-sm font-medium text-gold">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
