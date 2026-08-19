import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  FileText,
  MessageSquareWarning,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { api, apiError } from '../lib/api';
import { DashboardData } from '../lib/types';
import { PageHeader, StatCard, LoadingState, ErrorState, EmptyState } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const slotLabels: Record<string, string> = {
  SLOT_1000: '10:00 AM',
  SLOT_1600: '4:00 PM',
  SLOT_2200: '10:00 PM',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardData>('/dashboard')).data,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name.split(' ')[0]}`}
        subtitle={`Today is ${format(new Date(), 'EEEE, d MMMM yyyy')}`}
        action={
          (user?.role === 'ADMIN' || user?.role === 'FRONT_OFFICE') && (
            <Link to="/report/new" className="btn-primary">
              <FileText className="h-4 w-4" /> New Report
            </Link>
          )
        }
      />

      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Completed Tasks"
              value={data.checklist.completed}
              hint={`of ${data.checklist.total} scheduled checks`}
              accent="success"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <StatCard
              label="Pending Tasks"
              value={data.checklist.pending}
              hint="scheduled checks remaining"
              accent={data.checklist.pending > 0 ? 'warning' : 'success'}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              label="Open Complaints"
              value={data.openComplaints}
              accent={data.openComplaints > 0 ? 'danger' : 'success'}
              icon={<MessageSquareWarning className="h-5 w-5" />}
            />
            <StatCard
              label="Open Maintenance"
              value={data.openMaintenance}
              accent={data.openMaintenance > 0 ? 'danger' : 'success'}
              icon={<Wrench className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Checklist status */}
            <div className="card lg:col-span-1">
              <h2 className="text-lg font-semibold text-navy">Today's Checklist Status</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {data.reportsSubmittedToday} report(s) submitted today
              </p>
              <div className="mt-4 space-y-3">
                <ProgressRow label="Genset Checks" done={data.checklist.gensetDone.length} total={2} />
                <ProgressRow label="Water Tank Checks" done={data.checklist.waterDone.length} total={4} />
                <ProgressRow
                  label="Checklist Items Logged"
                  done={Math.min(data.checklist.checklistItemsDone, 10)}
                  total={10}
                />
              </div>
            </div>

            {/* Recent reports */}
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-navy">Recent Reports</h2>
                <Link to="/reports" className="inline-flex items-center gap-1 text-sm font-medium text-gold">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-4 overflow-x-auto">
                {data.recentReports.length === 0 ? (
                  <EmptyState title="No reports yet" description="Submit a daily operations report to get started." />
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-th">Date</th>
                        <th className="table-th">Slot</th>
                        <th className="table-th">Employee</th>
                        <th className="table-th">Department</th>
                        <th className="table-th">Submitted</th>
                        <th className="table-th"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentReports.map((r) => (
                        <tr key={r.id} className="hover:bg-surface-low">
                          <td className="table-td font-medium">{format(new Date(r.reportDate), 'd MMM yyyy')}</td>
                          <td className="table-td text-on-surface-variant">{slotLabels[r.slot] || r.slot}</td>
                          <td className="table-td">{r.employeeName}</td>
                          <td className="table-td text-on-surface-variant">{r.department ?? '-'}</td>
                          <td className="table-td text-on-surface-variant">
                            {format(new Date(r.submittedAt), 'd MMM, HH:mm')}
                          </td>
                          <td className="table-td text-right">
                            <Link to={`/reports/${r.id}`} className="text-sm font-medium text-gold">
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressRow({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-on-surface">{label}</span>
        <span className="font-medium tabular-nums text-on-surface-variant">
          {done}/{total}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-high">
        <div
          className={pct === 100 ? 'h-full bg-success' : 'h-full bg-gold-light'}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
