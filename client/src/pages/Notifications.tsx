import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<{ data: Notification[]; unreadCount: number }>('/notifications'),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 ${
                n.read
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{n.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markReadMutation.mutate(n._id)}
                    className="text-xs text-primary-600 hover:text-primary-700 shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
