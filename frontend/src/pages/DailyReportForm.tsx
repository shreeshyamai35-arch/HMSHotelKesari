import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { api, apiError } from '../lib/api';
import { CHECKLIST_ITEMS, WATER_SLOTS } from '../lib/constants';
import { PageHeader, Spinner } from '../components/ui';

type GensetState = { status: string; fuelLevel: string; remarks: string };
type WaterState = { status: string; remarks: string };
type ChecklistState = { status: string; remarks: string };

const SECTION = 'card space-y-4';

type ReportSlot = 'SLOT_1000' | 'SLOT_1600' | 'SLOT_2200';

/** Pre-select the slot whose submission window is open right now. */
function currentSlot(): ReportSlot {
  const hour = new Date().getHours();
  if (hour >= 22) return 'SLOT_2200';
  if (hour >= 16) return 'SLOT_1600';
  return 'SLOT_1000';
}

export default function DailyReportForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<ReportSlot>(currentSlot);
  const [remarks, setRemarks] = useState('');

  const [genset, setGenset] = useState<Record<string, GensetState>>({
    MORNING: { status: 'WORKING', fuelLevel: 'FULL', remarks: '' },
    EVENING: { status: 'WORKING', fuelLevel: 'FULL', remarks: '' },
  });

  const [water, setWater] = useState<Record<string, WaterState>>(
    Object.fromEntries(WATER_SLOTS.map((s) => [s.value, { status: 'FULL', remarks: '' }]))
  );

  const [checklist, setChecklist] = useState<Record<string, ChecklistState>>(
    Object.fromEntries(CHECKLIST_ITEMS.map((c) => [c.key, { status: 'OK', remarks: '' }]))
  );

  const [complaints, setComplaints] = useState<{ guestName: string; details: string }[]>([]);
  const [maintenance, setMaintenance] = useState<{ details: string; priority: string }[]>([]);
  const [incidents, setIncidents] = useState<{ type: string; details: string }[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        reportDate,
        slot,
        remarks: remarks || null,
        gensetChecks: Object.entries(genset).map(([type, g]) => ({
          type,
          status: g.status,
          fuelLevel: g.fuelLevel,
          remarks: g.remarks || null,
        })),
        waterTankChecks: Object.entries(water).map(([slot, w]) => ({
          slot,
          status: w.status,
          remarks: w.remarks || null,
        })),
        checklistItems: CHECKLIST_ITEMS.map((c) => ({
          key: c.key,
          label: c.label,
          status: checklist[c.key].status,
          remarks: checklist[c.key].remarks || null,
        })),
        complaints: complaints.filter((c) => c.details.trim()),
        maintenance: maintenance.filter((m) => m.details.trim()),
        incidents: incidents.filter((i) => i.details.trim()),
      };
      const res = await api.post<{ id: string }>('/reports', payload);
      navigate(`/reports/${res.data.id}`);
    } catch (err) {
      setError(apiError(err, 'Failed to submit report'));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title="Daily Operations Report"
        subtitle="Log today's genset, water, utility checks and any issues."
        action={
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            Submit Report
          </button>
        }
      />

      {error && <div className="mb-4 rounded border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>}

      <div className="space-y-6">
        <div className="card">
          <label className="label">Report Date</label>
          <input
            type="date"
            className="input max-w-xs"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
        </div>

        <div className="card">
          <label className="label">Time Slot</label>
          <select
            className="input max-w-xs"
            value={slot}
            onChange={(e) => setSlot(e.target.value as ReportSlot)}
          >
            <option value="SLOT_1000">10:00 AM (submit 10:00-11:59)</option>
            <option value="SLOT_1600">4:00 PM (submit 16:00-17:59)</option>
            <option value="SLOT_2200">10:00 PM (submit 22:00-23:59)</option>
          </select>
        </div>

        {/* Genset */}
        <div className={SECTION}>
          <h2 className="text-lg font-semibold text-navy">Genset Checks</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {(['MORNING', 'EVENING'] as const).map((type) => (
              <div key={type} className="rounded-md border border-outline-variant p-4">
                <p className="mb-3 font-medium text-on-surface">
                  {type === 'MORNING' ? 'Morning (7:00 AM)' : 'Evening (7:00 PM)'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Status</label>
                    <select
                      className="input"
                      value={genset[type].status}
                      onChange={(e) => setGenset({ ...genset, [type]: { ...genset[type], status: e.target.value } })}
                    >
                      <option value="WORKING">Working</option>
                      <option value="NOT_WORKING">Not Working</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Fuel Level</label>
                    <select
                      className="input"
                      value={genset[type].fuelLevel}
                      onChange={(e) => setGenset({ ...genset, [type]: { ...genset[type], fuelLevel: e.target.value } })}
                    >
                      <option value="FULL">Full</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="label">Remarks</label>
                  <input
                    className="input"
                    value={genset[type].remarks}
                    onChange={(e) => setGenset({ ...genset, [type]: { ...genset[type], remarks: e.target.value } })}
                    placeholder="Optional"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Water tanks */}
        <div className={SECTION}>
          <h2 className="text-lg font-semibold text-navy">Water Tank Checks</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WATER_SLOTS.map((slot) => (
              <div key={slot.value} className="rounded-md border border-outline-variant p-4">
                <p className="mb-3 font-medium text-on-surface">{slot.label}</p>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={water[slot.value].status}
                  onChange={(e) => setWater({ ...water, [slot.value]: { ...water[slot.value], status: e.target.value } })}
                >
                  <option value="FULL">Full</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <div className="mt-3">
                  <label className="label">Remarks</label>
                  <input
                    className="input"
                    value={water[slot.value].remarks}
                    onChange={(e) =>
                      setWater({ ...water, [slot.value]: { ...water[slot.value], remarks: e.target.value } })
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Utility checklist */}
        <div className={SECTION}>
          <h2 className="text-lg font-semibold text-navy">Utility &amp; Operations Checklist</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Item</th>
                  <th className="table-th w-40">Status</th>
                  <th className="table-th">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {CHECKLIST_ITEMS.map((c) => (
                  <tr key={c.key}>
                    <td className="table-td font-medium">{c.label}</td>
                    <td className="table-td">
                      <select
                        className="input"
                        value={checklist[c.key].status}
                        onChange={(e) =>
                          setChecklist({ ...checklist, [c.key]: { ...checklist[c.key], status: e.target.value } })
                        }
                      >
                        <option value="OK">OK</option>
                        <option value="NOT_OK">Not OK</option>
                        <option value="NA">N/A</option>
                      </select>
                    </td>
                    <td className="table-td">
                      <input
                        className="input"
                        value={checklist[c.key].remarks}
                        onChange={(e) =>
                          setChecklist({ ...checklist, [c.key]: { ...checklist[c.key], remarks: e.target.value } })
                        }
                        placeholder="Optional"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Issues */}
        <div className={SECTION}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">Guest Complaints</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setComplaints([...complaints, { guestName: '', details: '' }])}
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {complaints.length === 0 && <p className="text-sm text-on-surface-variant">No complaints added.</p>}
          {complaints.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input max-w-[200px]"
                placeholder="Guest name (optional)"
                value={c.guestName}
                onChange={(e) => {
                  const next = [...complaints];
                  next[i].guestName = e.target.value;
                  setComplaints(next);
                }}
              />
              <input
                className="input"
                placeholder="Complaint details"
                value={c.details}
                onChange={(e) => {
                  const next = [...complaints];
                  next[i].details = e.target.value;
                  setComplaints(next);
                }}
              />
              <button type="button" className="btn-secondary px-3" onClick={() => setComplaints(complaints.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-danger" />
              </button>
            </div>
          ))}
        </div>

        <div className={SECTION}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">Maintenance Issues</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMaintenance([...maintenance, { details: '', priority: 'MEDIUM' }])}
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {maintenance.length === 0 && <p className="text-sm text-on-surface-variant">No maintenance issues added.</p>}
          {maintenance.map((m, i) => (
            <div key={i} className="flex gap-2">
              <select
                className="input max-w-[140px]"
                value={m.priority}
                onChange={(e) => {
                  const next = [...maintenance];
                  next[i].priority = e.target.value;
                  setMaintenance(next);
                }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <input
                className="input"
                placeholder="Issue details"
                value={m.details}
                onChange={(e) => {
                  const next = [...maintenance];
                  next[i].details = e.target.value;
                  setMaintenance(next);
                }}
              />
              <button type="button" className="btn-secondary px-3" onClick={() => setMaintenance(maintenance.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-danger" />
              </button>
            </div>
          ))}
        </div>

        <div className={SECTION}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">Lost &amp; Found / Incidents</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIncidents([...incidents, { type: 'LOST_FOUND', details: '' }])}
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {incidents.length === 0 && <p className="text-sm text-on-surface-variant">No incidents added.</p>}
          {incidents.map((inc, i) => (
            <div key={i} className="flex gap-2">
              <select
                className="input max-w-[180px]"
                value={inc.type}
                onChange={(e) => {
                  const next = [...incidents];
                  next[i].type = e.target.value;
                  setIncidents(next);
                }}
              >
                <option value="LOST_FOUND">Lost &amp; Found</option>
                <option value="SPECIAL_INCIDENT">Special Incident</option>
              </select>
              <input
                className="input"
                placeholder="Details"
                value={inc.details}
                onChange={(e) => {
                  const next = [...incidents];
                  next[i].details = e.target.value;
                  setIncidents(next);
                }}
              />
              <button type="button" className="btn-secondary px-3" onClick={() => setIncidents(incidents.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-danger" />
              </button>
            </div>
          ))}
        </div>

        <div className={SECTION}>
          <h2 className="text-lg font-semibold text-navy">General Remarks</h2>
          <textarea
            className="input min-h-[80px]"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Any additional notes for the day..."
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            Submit Report
          </button>
        </div>
      </div>
    </form>
  );
}
