import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../lib/api';
import { Spinner } from '../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(apiError(err, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-surface-lowest shadow-ambient lg:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-gold-light text-lg font-bold text-navy">
                K
              </div>
              <div>
                <p className="text-lg font-semibold">Hotel Kesari</p>
                <p className="text-xs uppercase tracking-widest text-white/50">Operations Suite</p>
              </div>
            </div>
            <h2 className="mt-12 text-3xl font-semibold leading-tight">
              Operations, reporting &amp; analytics, all in one place.
            </h2>
            <p className="mt-4 text-sm text-white/60">
              Daily checklists, PDF reports, revenue and booking analytics, review tracking and AI insights for
              calm, confident hotel management.
            </p>
          </div>
          <p className="text-xs text-white/40">Portable, self-hosted, zero vendor lock-in.</p>
        </div>

        {/* Form */}
        <div className="p-8 sm:p-10">
          <h1 className="text-2xl font-semibold text-navy">Sign in</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Access your operations dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hotelkesari.com"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <div className="rounded border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>}
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4" />}
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
