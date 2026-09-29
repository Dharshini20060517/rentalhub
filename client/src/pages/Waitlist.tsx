import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface WaitlistEntry {
  _id: string;
  equipment: {
    _id: string;
    name: string;
    images: string[];
    pricePerDay: number;
    city: string;
    category: { name: string };
  };
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export default function Waitlist() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['waitlist'],
    queryFn: () => api.get<{ data: WaitlistEntry[] }>('/waitlist'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/waitlist/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waitlist'] }),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const entries = data?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">My Waitlist</h1>
      {entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No waitlist entries</p>
          <Link to="/search" className="text-primary-600 hover:text-primary-700">
            Browse equipment →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <div
              key={entry._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="h-32 bg-gray-200 dark:bg-gray-700">
                {entry.equipment.images[0] && (
                  <img
                    src={entry.equipment.images[0]}
                    alt={entry.equipment.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <Link
                  to={`/equipment/${entry.equipment._id}`}
                  className="font-semibold hover:text-primary-600 line-clamp-1"
                >
                  {entry.equipment.name}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  {entry.equipment.category.name} · {entry.equipment.city}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(entry.startDate).toLocaleDateString()} →{' '}
                  {new Date(entry.endDate).toLocaleDateString()}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                    {entry.status}
                  </span>
                  <button
                    onClick={() => cancelMutation.mutate(entry._id)}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
