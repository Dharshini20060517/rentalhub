import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Dispute {
  _id: string;
  reason: string;
  description: string;
  status: string;
  raisedBy: { name: string; email: string };
  against: { name: string; email: string };
  booking: { equipment: { name: string }; startDate: string; endDate: string; totalAmount: number };
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  APPEALED: 'bg-purple-100 text-purple-700',
};

export default function DisputeConsole() {
  const { data, isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => api.get<{ data: Dispute[]; pagination: { total: number } }>('/disputes'),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const disputes = data?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Dispute Console</h1>
      {disputes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No disputes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <Link
              key={dispute._id}
              to={`/disputes/${dispute._id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{dispute.reason}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[dispute.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {dispute.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {dispute.raisedBy.name} vs {dispute.against.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {dispute.booking.equipment.name} · ₹{dispute.booking.totalAmount.toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
