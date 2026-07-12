import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Download, FileDown } from 'lucide-react';
import { api, apiError, getToken } from '../lib/api';
import { DailyReport, PdfReport } from '../lib/types';
import { WATER_SLOTS } from '../lib/constants';
import { PageHeader, LoadingState, ErrorState, StatusBadge, Spinner } from '../components/ui';

const slotLabel = (slot: string) => WATER_SLOTS.find((s) => s.value === slot)?.label ?? slot;

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['report', id],
    queryFn: async () => (await api.get<DailyReport>(`/reports/${id}`)).data,
    enabled: !!id,
  });

  const { data: pdfs } = useQuery({
    queryKey: ['report-pdfs', id],
    queryFn: async () => (await api.get<PdfReport[]>(`/pdf/reports/${id}`)).data,
    enabled: !!id,
  });

  const generate = useMutation({
    mutationFn: async () => (await api.post<PdfReport>(`/pdf/reports/${id}/generate`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report-pdfs', id] }),
  });

  function downloadPdf(pdfId: string) {
    // Use a token-authenticated fetch to download the file.
    const token = getToken();
    fetch(`/api/pdf/${pdfId}/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotel-kesari-report.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  return (
    <div>
      <Link to="/reports" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gold">
        <ArrowLeft className="h-4 w-4" /> Back to reports
      </Link>

      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}

      {data && (
        <>
          <PageHeader
            title={`Report — ${format(new Date(data.reportDate), 'd MMMM yyyy')}`}
            subtitle={`${data.employeeName}${data.department ? ' · ' + data.department : ''} · submitted ${format(
              new Date(data.submittedAt),
              'd MMM, HH:mm'
            )}`}
            action={
              <button className="btn-primary" onClick={() => generate.mutate()} disabled={generate.isPending}>
                {generate.isPending ? <Spinner className="h-4 w-4" /> : <FileDown className="h-4 w-4" />}
                Generate PDF
              </button>
            }
          />

          <div className="space-y-6">
            {/* Genset */}
            <Section title="Genset Checks">
              <Table head={['Type', 'Status', 'Fuel Level', 'Remarks']}>
                {data.gensetChecks.map((g) => (
                  <tr key={g.id}>
                    <td className="table-td font-medium">{g.type}</td>
                    <td className="table-td"><StatusBadge status={g.status} /></td>
                    <td className="table-td"><StatusBadge status={g.fuelLevel} /></td>
                    <td className="table-td text-on-surface-variant">{g.remarks || '-'}</td>
                  </tr>
                ))}
              </Table>
            </Section>

            {/* Water */}
            <Section title="Water Tank Checks">
              <Table head={['Slot', 'Status', 'Remarks']}>
                {data.waterTankChecks.map((w) => (
                  <tr key={w.id}>
                    <td className="table-td font-medium">{slotLabel(w.slot)}</td>
                    <td className="table-td"><StatusBadge status={w.status} /></td>
                    <td className="table-td text-on-surface-variant">{w.remarks || '-'}</td>
                  </tr>
                ))}
              </Table>
            </Section>

            {/* Checklist */}
            <Section title="Utility & Operations Checklist">
              <Table head={['Item', 'Status', 'Remarks']}>
                {data.checklistItems.map((c) => (
                  <tr key={c.id}>
                    <td className="table-td font-medium">{c.label}</td>
                    <td className="table-td"><StatusBadge status={c.status} /></td>
                    <td className="table-td text-on-surface-variant">{c.remarks || '-'}</td>
                  </tr>
                ))}
              </Table>
            </Section>

            <div className="grid gap-6 lg:grid-cols-3">
              <Section title="Complaints">
                {data.complaints.length ? (
                  <ul className="space-y-2 text-sm">
                    {data.complaints.map((c) => (
                      <li key={c.id} className="flex items-start justify-between gap-2">
                        <span>{c.guestName ? `${c.guestName}: ` : ''}{c.details}</span>
                        <StatusBadge status={c.status} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-on-surface-variant">None reported.</p>
                )}
              </Section>
              <Section title="Maintenance">
                {data.maintenance.length ? (
                  <ul className="space-y-2 text-sm">
                    {data.maintenance.map((m) => (
                      <li key={m.id} className="flex items-start justify-between gap-2">
                        <span><StatusBadge status={m.priority} /> {m.details}</span>
                        <StatusBadge status={m.status} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-on-surface-variant">None reported.</p>
                )}
              </Section>
              <Section title="Incidents / Lost & Found">
                {data.incidents.length ? (
                  <ul className="space-y-2 text-sm">
                    {data.incidents.map((i) => (
                      <li key={i.id}>
                        <StatusBadge status={i.type} /> {i.details}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-on-surface-variant">None reported.</p>
                )}
              </Section>
            </div>

            {data.remarks && (
              <Section title="General Remarks">
                <p className="text-sm">{data.remarks}</p>
              </Section>
            )}

            {/* PDFs */}
            <Section title="Generated PDFs">
              {pdfs && pdfs.length ? (
                <ul className="space-y-2">
                  {pdfs.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-md border border-outline-variant px-3 py-2 text-sm">
                      <span>{format(new Date(p.generatedAt), 'd MMM yyyy, HH:mm')}</span>
                      <button className="inline-flex items-center gap-1 font-medium text-gold" onClick={() => downloadPdf(p.id)}>
                        <Download className="h-4 w-4" /> Download
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-on-surface-variant">No PDF generated yet. Click "Generate PDF" above.</p>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-semibold text-navy">{title}</h2>
      {children}
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="table-th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
