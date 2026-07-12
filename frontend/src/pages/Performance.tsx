import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Users2, ClipboardCheck, ListChecks } from 'lucide-react';
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
import { PerformanceData } from '../lib/types';
import { PageHeader, StatCard, LoadingState, ErrorState, EmptyState } from '../components/ui';

export default function Performance() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['performance', from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return (await api.get<PerformanceData>(`/performance?${params.toString()}`)).data;
    },
  });

  const deptChart =
    data?.departments.map((d) => ({ department: d.department, tasks: d.tasks, reports: d.reports })) ?? [];

  return (
    <div>
      <PageHeader title="Team Performance" subtitle="Employee and department productivity across daily operations." />

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
        <div className="space-y-6">
          <p className="text-sm text-on-surface-variant">
            Showing {format(new Date(data.from), 'd MMM yyyy')} – {format(new Date(data.to), 'd MMM yyyy')}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total Reports" value={data.totals.reports} accent="navy" icon={<ClipboardCheck className="h-5 w-5" />} />
            <StatCard label="Total Tasks Logged" value={data.totals.tasks} accent="gold" icon={<ListChecks className="h-5 w-5" />} />
            <StatCard label="Active Employees" value={data.employees.length} accent="success" icon={<Users2 className="h-5 w-5" />} />
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-navy">Tasks by Department</h2>
            <div className="mt-4 h-64">
              {deptChart.length === 0 ? (
                <EmptyState title="No data" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="tasks" name="Tasks" fill="#131b2e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card overflow-x-auto">
            <h2 className="mb-4 text-lg font-semibold text-navy">Employee Leaderboard</h2>
            {data.employees.length === 0 ? (
              <EmptyState title="No activity in this period" />
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">#</th>
                    <th className="table-th">Employee</th>
                    <th className="table-th">Department</th>
                    <th className="table-th text-right">Reports</th>
                    <th className="table-th text-right">Genset</th>
                    <th className="table-th text-right">Water</th>
                    <th className="table-th text-right">Checklist</th>
                    <th className="table-th text-right">Total Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.employees.map((e, i) => (
                    <tr key={e.employeeId} className="hover:bg-surface-low">
                      <td className="table-td font-semibold text-on-surface-variant">{i + 1}</td>
                      <td className="table-td font-medium">{e.employeeName}</td>
                      <td className="table-td text-on-surface-variant">{e.department ?? '-'}</td>
                      <td className="table-td text-right tabular-nums">{e.reports}</td>
                      <td className="table-td text-right tabular-nums">{e.gensetChecks}</td>
                      <td className="table-td text-right tabular-nums">{e.waterChecks}</td>
                      <td className="table-td text-right tabular-nums">{e.checklistItems}</td>
                      <td className="table-td text-right font-semibold tabular-nums text-navy">{e.tasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
