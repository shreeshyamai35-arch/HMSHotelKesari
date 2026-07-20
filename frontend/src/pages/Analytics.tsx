import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  IndianRupee,
  Percent,
  TrendingUp,
  LogIn,
  LogOut,
  DoorOpen,
  DoorClosed,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { api, apiError } from '../lib/api';
import {
  TodaySnapshot,
  PickupReport,
  BookingWindow,
  RevenueCalendar,
  CalendarDay,
  YoyComparison,
} from '../lib/types';
import { PageHeader, StatCard, LoadingState, ErrorState } from '../components/ui';
import { formatCurrency, formatNumber } from '../lib/constants';

export default function Analytics() {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Performance snapshot, pickup, booking window, revenue calendar and year-on-year." />
      <SnapshotSection />
      <PickupSection />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BookingWindowSection />
        <YoySection />
      </div>
      <RevenueCalendarSection />
    </div>
  );
}

// ─── Today's Snapshot ─────────────────────────────────────
function SnapshotSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['snapshot'],
    queryFn: async () => (await api.get<TodaySnapshot>('/analytics/snapshot')).data,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={apiError(error)} />;
  if (!data) return null;

  return (
    <div className="mb-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Today's Snapshot</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(data.revenue)} accent="gold" icon={<IndianRupee className="h-4 w-4" />} />
        <StatCard label="Occupancy" value={`${data.occupancy.toFixed(1)}%`} accent="navy" icon={<Percent className="h-4 w-4" />} />
        <StatCard label="ADR" value={formatCurrency(data.adr)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="RevPAR" value={formatCurrency(data.revpar)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Check-ins" value={data.checkIns} accent="success" icon={<LogIn className="h-4 w-4" />} />
        <StatCard label="Check-outs" value={data.checkOuts} accent="warning" icon={<LogOut className="h-4 w-4" />} />
        <StatCard label="Rooms Available" value={data.roomsAvailable} icon={<DoorOpen className="h-4 w-4" />} />
        <StatCard label="Rooms Sold" value={data.roomsSold} accent="navy" icon={<DoorClosed className="h-4 w-4" />} />
      </div>
    </div>
  );
}

// ─── Pickup Report ────────────────────────────────────────
function PickupSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pickup'],
    queryFn: async () => (await api.get<PickupReport>('/analytics/pickup')).data,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={apiError(error)} />;
  if (!data) return null;

  const items = [
    { label: 'Yesterday', v: data.yesterday },
    { label: '7-Day', v: data.last7 },
    { label: '30-Day', v: data.last30 },
    { label: 'Current Month', v: data.currentMonth },
  ];

  return (
    <div className="mb-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Pickup Report (new bookings)</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="card-compact">
            <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{it.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-navy">{formatNumber(it.v.rooms)} <span className="text-sm font-normal text-on-surface-variant">rooms</span></p>
            <p className="mt-1 text-sm text-on-surface-variant">{it.v.bookings} bookings · {formatCurrency(it.v.revenue)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Booking Window ───────────────────────────────────────
function BookingWindowSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['booking-window'],
    queryFn: async () => (await api.get<BookingWindow>('/analytics/booking-window')).data,
  });

  return (
    <div className="card">
      <h2 className="mb-1 text-lg font-semibold text-navy">Booking Window</h2>
      <p className="mb-3 text-sm text-on-surface-variant">Lead time between booking and arrival ({data?.totalBookings ?? 0} bookings).</p>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}
      {data && (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.buckets} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="bookings" name="Bookings" fill="#131b2e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Year-on-Year ─────────────────────────────────────────
function YoySection() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const { data, isLoading, error } = useQuery({
    queryKey: ['yoy', year],
    queryFn: async () => (await api.get<YoyComparison>('/analytics/yoy', { params: { year } })).data,
  });

  const rows = data
    ? [
        { label: 'Revenue', cur: formatCurrency(data.current.revenue), prev: formatCurrency(data.previous.revenue), delta: data.deltas.revenue },
        { label: 'Occupancy', cur: `${data.current.occupancy.toFixed(1)}%`, prev: `${data.previous.occupancy.toFixed(1)}%`, delta: data.deltas.occupancy },
        { label: 'ADR', cur: formatCurrency(data.current.adr), prev: formatCurrency(data.previous.adr), delta: data.deltas.adr },
        { label: 'RevPAR', cur: formatCurrency(data.current.revpar), prev: formatCurrency(data.previous.revpar), delta: data.deltas.revpar },
        { label: 'Review Score', cur: data.current.reviewScore.toFixed(2), prev: data.previous.reviewScore.toFixed(2), delta: data.deltas.reviewScore },
      ]
    : [];

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy">Year-on-Year</h2>
        <div className="flex items-center gap-1">
          <button className="btn-secondary px-2 py-1" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium tabular-nums">
            {year} vs {year - 1}
          </span>
          <button className="btn-secondary px-2 py-1" disabled={year >= thisYear} onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}
      {data && (
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">Metric</th>
              <th className="table-th text-right">{year}</th>
              <th className="table-th text-right">{year - 1}</th>
              <th className="table-th text-right">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="table-td font-medium">{r.label}</td>
                <td className="table-td text-right tabular-nums">{r.cur}</td>
                <td className="table-td text-right tabular-nums text-on-surface-variant">{r.prev}</td>
                <td className="table-td text-right">
                  {r.delta === null ? (
                    <span className="text-on-surface-variant">—</span>
                  ) : (
                    <span className={'inline-flex items-center gap-0.5 tabular-nums ' + (r.delta >= 0 ? 'text-success' : 'text-danger')}>
                      {r.delta >= 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                      {Math.abs(r.delta)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Revenue Calendar ─────────────────────────────────────
const TIER_STYLES: Record<string, string> = {
  HIGH: 'bg-success/15 border-success/40 text-success',
  MEDIUM: 'bg-warning/15 border-warning/40 text-warning',
  LOW: 'bg-danger/15 border-danger/40 text-danger',
  NONE: 'bg-surface-low border-outline-variant text-on-surface-variant',
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function RevenueCalendarSection() {
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [selected, setSelected] = useState<CalendarDay | null>(null);

  const monthStr = `${ym.year}-${String(ym.month).padStart(2, '0')}`;
  const { data, isLoading, error } = useQuery({
    queryKey: ['calendar', monthStr],
    queryFn: async () => (await api.get<RevenueCalendar>('/analytics/calendar', { params: { month: monthStr } })).data,
  });

  const firstWeekday = useMemo(() => new Date(ym.year, ym.month - 1, 1).getDay(), [ym]);

  function shift(delta: number) {
    setSelected(null);
    setYm((p) => {
      const d = new Date(p.year, p.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  const monthLabel = new Date(ym.year, ym.month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="card mt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-navy">Revenue Calendar</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-success/40" /> High</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-warning/40" /> Medium</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-danger/40" /> Low</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-secondary px-2 py-1" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></button>
            <span className="min-w-[130px] text-center text-sm font-medium">{monthLabel}</span>
            <button className="btn-secondary px-2 py-1" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}

      {data && (
        <>
          {!data.thresholds.auto && (
            <p className="mb-2 text-xs text-on-surface-variant">
              Using custom thresholds (Low &lt; {formatCurrency(data.thresholds.low)}, High ≥ {formatCurrency(data.thresholds.high)}).
            </p>
          )}
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-1 text-center text-[11px] font-semibold uppercase text-on-surface-variant">{d}</div>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {data.days.map((day) => {
              const dayNum = parseInt(day.date.slice(8, 10), 10);
              return (
                <button
                  key={day.date}
                  onClick={() => setSelected(day)}
                  className={
                    'flex min-h-[64px] flex-col rounded-md border p-1.5 text-left transition-transform hover:scale-[1.03] ' +
                    (TIER_STYLES[day.tier] ?? TIER_STYLES.NONE) +
                    (selected?.date === day.date ? ' ring-2 ring-navy' : '')
                  }
                >
                  <span className="text-xs font-semibold text-on-surface">{dayNum}</span>
                  {day.revenue > 0 ? (
                    <span className="mt-auto text-[11px] font-medium tabular-nums">{formatCurrency(day.revenue)}</span>
                  ) : (
                    <span className="mt-auto text-[10px] text-on-surface-variant">—</span>
                  )}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="mt-4 rounded-md border border-outline-variant bg-surface-low p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-navy">
                  {new Date(selected.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </h3>
                <button className="text-sm text-on-surface-variant hover:text-navy" onClick={() => setSelected(null)}>Close</button>
              </div>
              {selected.revenue > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <Metric label="Revenue" value={formatCurrency(selected.revenue)} />
                  <Metric label="Occupancy" value={`${selected.occupancy.toFixed(1)}%`} />
                  <Metric label="ADR" value={formatCurrency(selected.adr)} />
                  <Metric label="RevPAR" value={formatCurrency(selected.revpar)} />
                  <Metric label="Rooms Sold" value={String(selected.roomsSold)} />
                  <Metric label="OTA Contribution" value={`${selected.otaContribution.toFixed(1)}%`} />
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">No revenue recorded for this day.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums text-navy">{value}</p>
    </div>
  );
}
