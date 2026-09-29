import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface FraudFlag {
  _id: string;
  user: { name: string; email: string };
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  status: string;
  createdAt: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export default function FraudDetection() {
  const { data, isLoading } = useQuery({
    queryKey: ['fraud-flags'],
    queryFn: () => api.get<{ data: FraudFlag[] }>('/fraud-detection'),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const flags = data?.data ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Fraud Detection</h1>
      <p className="text-sm text-gray-500 mb-6">
        Rule-based anomaly flags for admin review.
      </p>
      {flags.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No fraud flags</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div
              key={flag._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{flag.type.replace(/_/g, ' ')}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        SEVERITY_COLORS[flag.severity] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {flag.severity}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {flag.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    User: {flag.user.name} ({flag.user.email})
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(flag.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
