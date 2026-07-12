import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { api, apiError } from '../lib/api';
import { Complaint, MaintenanceIssue } from '../lib/types';
import { PageHeader, LoadingState, ErrorState, EmptyState, StatusBadge, Spinner } from '../components/ui';

type Tab = 'complaints' | 'maintenance';

export default function Issues() {
  const [tab, setTab] = useState<Tab>('complaints');

  return (
    <div>
      <PageHeader title="Complaints & Maintenance" subtitle="Track and resolve operational issues." />

      <div className="mb-4 flex gap-1 rounded-md border border-outline-variant bg-surface-low p-1">
        <TabBtn active={tab === 'complaints'} onClick={() => setTab('complaints')}>
          Complaints
        </TabBtn>
        <TabBtn active={tab === 'maintenance'} onClick={() => setTab('maintenance')}>
          Maintenance
        </TabBtn>
      </div>

      {tab === 'complaints' ? <ComplaintsPanel /> : <MaintenancePanel />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-navy text-white' : 'text-on-surface-variant hover:bg-surface-lowest'
      }`}
    >
      {children}
    </button>
  );
}

function ComplaintsPanel() {
  const qc = useQueryClient();
  const [details, setDetails] = useState('');
  const [guestName, setGuestName] = useState('');
  const [adding, setAdding] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => (await api.get<Complaint[]>('/issues/complaints')).data,
  });

  const create = useMutation({
    mutationFn: async () => (await api.post('/issues/complaints', { details, guestName: guestName || null })).data,
    onSuccess: () => {
      setDetails('');
      setGuestName('');
      setAdding(false);
      qc.invalidateQueries({ queryKey: ['complaints'] });
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/issues/complaints/${id}`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  });

  return (
    <div className="space-y-4">
      <div className="card-compact">
        {adding ? (
          <div className="flex flex-wrap items-end gap-2">
            <div className="grow">
              <label className="label">Complaint details</label>
              <input className="input" value={details} onChange={(e) => setDetails(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Guest (optional)</label>
              <input className="input" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            </div>
            <button className="btn-primary" disabled={!details.trim() || create.isPending} onClick={() => create.mutate()}>
              {create.isPending && <Spinner className="h-4 w-4" />} Save
            </button>
            <button className="btn-secondary" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn-secondary" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Log complaint
          </button>
        )}
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}
      {data && (
        <div className="card overflow-x-auto">
          {data.length === 0 ? (
            <EmptyState title="No complaints" />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Details</th>
                  <th className="table-th">Guest</th>
                  <th className="table-th">Logged</th>
                  <th className="table-th">Status</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-low">
                    <td className="table-td">{c.details}</td>
                    <td className="table-td text-on-surface-variant">{c.guestName ?? '-'}</td>
                    <td className="table-td text-on-surface-variant">{format(new Date(c.createdAt), 'd MMM, HH:mm')}</td>
                    <td className="table-td"><StatusBadge status={c.status} /></td>
                    <td className="table-td text-right">
                      <button
                        className="text-sm font-medium text-gold"
                        onClick={() => toggle.mutate({ id: c.id, status: c.status === 'OPEN' ? 'CLOSED' : 'OPEN' })}
                      >
                        {c.status === 'OPEN' ? 'Resolve' : 'Reopen'}
                      </button>
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

function MaintenancePanel() {
  const qc = useQueryClient();
  const [details, setDetails] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [adding, setAdding] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => (await api.get<MaintenanceIssue[]>('/issues/maintenance')).data,
  });

  const create = useMutation({
    mutationFn: async () => (await api.post('/issues/maintenance', { details, priority })).data,
    onSuccess: () => {
      setDetails('');
      setPriority('MEDIUM');
      setAdding(false);
      qc.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/issues/maintenance/${id}`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance'] }),
  });

  return (
    <div className="space-y-4">
      <div className="card-compact">
        {adding ? (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="grow">
              <label className="label">Issue details</label>
              <input className="input" value={details} onChange={(e) => setDetails(e.target.value)} autoFocus />
            </div>
            <button className="btn-primary" disabled={!details.trim() || create.isPending} onClick={() => create.mutate()}>
              {create.isPending && <Spinner className="h-4 w-4" />} Save
            </button>
            <button className="btn-secondary" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn-secondary" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Log maintenance issue
          </button>
        )}
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}
      {data && (
        <div className="card overflow-x-auto">
          {data.length === 0 ? (
            <EmptyState title="No maintenance issues" />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Priority</th>
                  <th className="table-th">Details</th>
                  <th className="table-th">Logged</th>
                  <th className="table-th">Status</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-low">
                    <td className="table-td"><StatusBadge status={m.priority} /></td>
                    <td className="table-td">{m.details}</td>
                    <td className="table-td text-on-surface-variant">{format(new Date(m.createdAt), 'd MMM, HH:mm')}</td>
                    <td className="table-td"><StatusBadge status={m.status} /></td>
                    <td className="table-td text-right">
                      <button
                        className="text-sm font-medium text-gold"
                        onClick={() => toggle.mutate({ id: m.id, status: m.status === 'OPEN' ? 'CLOSED' : 'OPEN' })}
                      >
                        {m.status === 'OPEN' ? 'Resolve' : 'Reopen'}
                      </button>
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
