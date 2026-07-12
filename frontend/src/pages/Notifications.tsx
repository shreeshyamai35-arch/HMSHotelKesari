import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { api, apiError } from '../lib/api';
import { Notification } from '../lib/types';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../components/ui';

const ICON = {
  INFO: Info,
  WARNING: AlertTriangle,
  CRITICAL: AlertOctagon,
};
const COLOR = {
  INFO: 'text-navy',
  WARNING: 'text-warning',
  CRITICAL: 'text-danger',
};

export default function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<Notification[]>('/notifications')).data,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/notifications/${id}/read`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markAll = useMutation({
    mutationFn: async () => (await api.post('/notifications/read-all')).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Notifications & Alerts"
        subtitle="Missed checks, pending reports and open maintenance alerts."
        action={
          <button className="btn-secondary" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        }
      />

      {isLoading && <LoadingState />}
      {error && <ErrorState message={apiError(error)} />}

      {data && (
        <div className="space-y-2">
          {data.length === 0 ? (
            <EmptyState title="You're all caught up" description="No notifications right now." />
          ) : (
            data.map((n) => {
              const Icon = ICON[n.severity] ?? Bell;
              return (
                <div
                  key={n.id}
                  className={`card-compact flex items-start gap-3 ${n.read ? 'opacity-60' : ''}`}
                >
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${COLOR[n.severity]}`} />
                  <div className="grow">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-on-surface">{n.title}</p>
                      <span className="shrink-0 text-xs text-on-surface-variant">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-on-surface-variant">{n.message}</p>
                  </div>
                  {!n.read && (
                    <button className="shrink-0 text-xs font-medium text-gold" onClick={() => markRead.mutate(n.id)}>
                      Mark read
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
