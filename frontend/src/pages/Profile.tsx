import { useState } from 'react';
import { api, apiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../lib/constants';
import { PageHeader, Spinner } from '../components/ui';

export default function Profile() {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) {
      setMsg({ type: 'err', text: 'New passwords do not match.' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      setMsg({ type: 'ok', text: 'Password updated successfully.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setMsg({ type: 'err', text: apiError(err) });
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Profile & Password" subtitle="Manage your account details." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-navy">Account</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Name" value={user.name} />
            <Row label="Email" value={user.email} />
            <Row label="Role" value={ROLE_LABELS[user.role]} />
            <Row label="Department" value={user.department ?? '-'} />
          </dl>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-navy">Change Password</h2>
          <form onSubmit={changePassword} className="space-y-3">
            <div>
              <label className="label">Current password</label>
              <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={6} required />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required />
            </div>
            {msg && (
              <p className={`text-sm ${msg.type === 'ok' ? 'text-success' : 'text-danger'}`}>{msg.text}</p>
            )}
            <button className="btn-primary" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4" />} Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-outline-variant/60 pb-2">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="font-medium text-on-surface">{value}</dd>
    </div>
  );
}
