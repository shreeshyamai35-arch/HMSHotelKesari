import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { api } from '../lib/api';

export function NotificationBell() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await api.get<{ count: number }>('/notifications/unread-count')).data,
    refetchInterval: 60000,
  });

  const count = data?.count ?? 0;

  return (
    <button onClick={() => navigate('/notifications')} className="relative rounded-md p-2 hover:bg-surface-low">
      <Bell className="h-5 w-5 text-navy" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
