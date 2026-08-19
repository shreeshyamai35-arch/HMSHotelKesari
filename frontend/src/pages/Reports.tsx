import { useState } from 'react';
import { Download, Calendar, FileText, TrendingUp, Clock } from 'lucide-react';
import { api, apiError } from '../lib/api';
import { PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const canDownload = user?.role === 'ADMIN' || user?.role === 'REVENUE' || user?.role === 'MANAGEMENT';

  const [hourlyDate, setHourlyDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [hourlySlot, setHourlySlot] = useState<'SLOT_1000' | 'SLOT_1600' | 'SLOT_2200'>('SLOT_1000');

  const [dailyDate, setDailyDate] = useState(hourlyDate);

  const [weeklyStart, setWeeklyStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);

  const [downloading, setDownloading] = useState<string | null>(null);

  async function downloadReport(type: string, url: string, filename: string) {
    if (!canDownload) return;
    setDownloading(type);
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert(apiError(err));
    } finally {
      setDownloading(null);
    }
  }

  const slotLabels: Record<string, string> = {
    SLOT_1000: '10 AM',
    SLOT_1600: '4 PM',
    SLOT_2200: '10 PM',
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div>
      <PageHeader
        title="Occupancy Reports"
        subtitle="Download PDF reports of occupancy data. Only Admin and Revenue Manager can access reports."
      />

      {!canDownload && (
        <div className="card mb-4">
          <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning/5 p-4">
            <FileText className="h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-warning">Access Restricted</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Only Admin and Revenue Manager roles can download occupancy reports. Contact your administrator for access.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Hourly Report */}
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-navy" />
            <h2 className="text-lg font-semibold text-navy">Hourly Report</h2>
          </div>
          <p className="mb-4 text-sm text-on-surface-variant">
            Single slot snapshot (10 AM, 4 PM, or 10 PM) with all room sales for that reporting period.
          </p>
          <div className="space-y-3">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={hourlyDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setHourlyDate(e.target.value)}
                disabled={!canDownload}
              />
            </div>
            <div>
              <label className="label">Slot</label>
              <select
                className="input"
                value={hourlySlot}
                onChange={(e) => setHourlySlot(e.target.value as typeof hourlySlot)}
                disabled={!canDownload}
              >
                <option value="SLOT_1000">10 AM</option>
                <option value="SLOT_1600">4 PM</option>
                <option value="SLOT_2200">10 PM</option>
              </select>
            </div>
            <button
              className="btn-primary w-full"
              disabled={!canDownload || downloading === 'hourly'}
              onClick={() =>
                downloadReport(
                  'hourly',
                  `/occupancy-reports/hourly?date=${hourlyDate}&slot=${hourlySlot}`,
                  `Hourly_Report_${hourlyDate}_${slotLabels[hourlySlot].replace(' ', '')}.pdf`
                )
              }
            >
              <Download className="h-4 w-4" />
              {downloading === 'hourly' ? 'Downloading...' : 'Download Hourly Report'}
            </button>
          </div>
        </div>

        {/* Daily Report */}
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-navy" />
            <h2 className="text-lg font-semibold text-navy">Daily Report</h2>
          </div>
          <p className="mb-4 text-sm text-on-surface-variant">
            All three slots (10 AM, 4 PM, 10 PM) for a single date with daily summary.
          </p>
          <div className="space-y-3">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={dailyDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDailyDate(e.target.value)}
                disabled={!canDownload}
              />
            </div>
            <button
              className="btn-primary w-full"
              disabled={!canDownload || downloading === 'daily'}
              onClick={() =>
                downloadReport(
                  'daily',
                  `/occupancy-reports/daily?date=${dailyDate}`,
                  `Daily_Report_${dailyDate}.pdf`
                )
              }
            >
              <Download className="h-4 w-4" />
              {downloading === 'daily' ? 'Downloading...' : 'Download Daily Report'}
            </button>
          </div>
        </div>

        {/* Weekly Report */}
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-navy" />
            <h2 className="text-lg font-semibold text-navy">Weekly Report</h2>
          </div>
          <p className="mb-4 text-sm text-on-surface-variant">
            7-day aggregation starting from the selected date, with daily breakdowns and weekly summary.
          </p>
          <div className="space-y-3">
            <div>
              <label className="label">Week Start Date</label>
              <input
                type="date"
                className="input"
                value={weeklyStart}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setWeeklyStart(e.target.value)}
                disabled={!canDownload}
              />
            </div>
            <button
              className="btn-primary w-full"
              disabled={!canDownload || downloading === 'weekly'}
              onClick={() =>
                downloadReport(
                  'weekly',
                  `/occupancy-reports/weekly?startDate=${weeklyStart}`,
                  `Weekly_Report_${weeklyStart}.pdf`
                )
              }
            >
              <Download className="h-4 w-4" />
              {downloading === 'weekly' ? 'Downloading...' : 'Download Weekly Report'}
            </button>
          </div>
        </div>

        {/* Monthly Report */}
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-navy" />
            <h2 className="text-lg font-semibold text-navy">Monthly Report</h2>
          </div>
          <p className="mb-4 text-sm text-on-surface-variant">
            Full month aggregation with daily breakdowns and monthly summary.
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Year</label>
                <input
                  type="number"
                  className="input"
                  value={monthlyYear}
                  min={2020}
                  max={new Date().getFullYear()}
                  onChange={(e) => setMonthlyYear(parseInt(e.target.value))}
                  disabled={!canDownload}
                />
              </div>
              <div>
                <label className="label">Month</label>
                <select
                  className="input"
                  value={monthlyMonth}
                  onChange={(e) => setMonthlyMonth(parseInt(e.target.value))}
                  disabled={!canDownload}
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              className="btn-primary w-full"
              disabled={!canDownload || downloading === 'monthly'}
              onClick={() =>
                downloadReport(
                  'monthly',
                  `/occupancy-reports/monthly?year=${monthlyYear}&month=${monthlyMonth}`,
                  `Monthly_Report_${monthlyYear}-${String(monthlyMonth).padStart(2, '0')}.pdf`
                )
              }
            >
              <Download className="h-4 w-4" />
              {downloading === 'monthly' ? 'Downloading...' : 'Download Monthly Report'}
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="mb-2 text-sm font-semibold text-navy">Report Details</h3>
        <ul className="space-y-1 text-sm text-on-surface-variant">
          <li>• <strong>Hourly:</strong> Single slot with room-by-room details</li>
          <li>• <strong>Daily:</strong> All three slots for one date with slot summaries</li>
          <li>• <strong>Weekly:</strong> 7 consecutive days with daily summaries and totals</li>
          <li>• <strong>Monthly:</strong> Full month with day-by-day breakdown and monthly totals</li>
          <li className="mt-2 text-xs">All reports are generated as PDF files and include Hotel Kesari branding.</li>
        </ul>
      </div>
    </div>
  );
}
