import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, KeyRound, UserX, UserCheck } from 'lucide-react';
import { api, apiError } from '../lib/api';
import { User, Role } from '../lib/types';
import { ROLE_LABELS } from '../lib/constants';
import { PageHeader, LoadingState, ErrorState, StatusBadge, Spinner } from '../components/ui';

const ROLES: Role[] = ['ADMIN', 'FRONT_OFFICE', 'REVENUE', 'MANAGEMENT'];

export default function Users() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'FRONT_OFFICE' as Role, department: '' });
  const [formError, setFormError] = useState('');
  const [resetFor, setResetFor] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<User[]>('/users')).data,
  });

  const create = useMutation({
    mutationFn: async () =>
      (await api.post('/users', { ...form, department: form.department || null })).data,
    onSuccess: () => {
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'FRONT_OFFICE', department: '' });
      setFormError('');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => setFormError(apiError(err)),
  });

  const setActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) =>
      (await api.patch(`/users/${id}`, { active })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const resetPassword = useMutation({
    mutationFn: async () => (await api.post(`/users/${resetFor!.id}/reset-password`, { newPassword })).data,
    onSuccess: () => {
      setResetFor(null);
      setNewPassword('');
    },
  });

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create users, assign roles and manage access."
        action={
          <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
            <Plus className="h-4 w-4" /> Add User
          </button>
        }
      />

      {showCreate && (
        <div className="card mb-4">
          <h2 className="mb-4 text-lg font-semibold text-navy">New User</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          {formError && <p className="mt-3 text-sm text-danger">{formError}</p>}
          <div className="mt-4 flex gap-2">
            <button
              className="btn-primary"
              disabled={!form.name || !form.email || form.password.length < 6 || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending && <Spinner className="h-4 w-4" />} Create
            </button>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {resetFor && (
        <div className="card mb-4">
          <h2 className="mb-2 text-lg font-semibold text-navy">Reset password — {resetFor.name}</h2>
          <div className="flex flex-wrap items-end gap-2">
            <div className="grow">
              <label className="label">New password</label>
              <input className="input" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <button className="btn-primary" disabled={newPassword.length < 6 || resetPassword.isPending} onClick={() => resetPassword.mutate()}>
              {resetPassword.isPending && <Spinner className="h-4 w-4" />} Reset
            </button>
            <button className="btn-secondary" onClick={() => setResetFor(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}

      {data && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Role</th>
                <th className="table-th">Department</th>
                <th className="table-th">Status</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="hover:bg-surface-low">
                  <td className="table-td font-medium">{u.name}</td>
                  <td className="table-td text-on-surface-variant">{u.email}</td>
                  <td className="table-td">{ROLE_LABELS[u.role]}</td>
                  <td className="table-td text-on-surface-variant">{u.department ?? '-'}</td>
                  <td className="table-td">
                    <StatusBadge status={u.active ? 'CONFIRMED' : 'NA'} />
                  </td>
                  <td className="table-td">
                    <div className="flex justify-end gap-3">
                      <button className="inline-flex items-center gap-1 text-sm text-gold" onClick={() => setResetFor(u)}>
                        <KeyRound className="h-3.5 w-3.5" /> Reset
                      </button>
                      <button
                        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-danger"
                        onClick={() => setActive.mutate({ id: u.id, active: !u.active })}
                      >
                        {u.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
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
