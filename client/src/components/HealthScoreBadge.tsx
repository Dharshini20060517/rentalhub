import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Props {
  equipmentId: string;
}

interface HealthScore {
  score: number;
  factors: {
    age: number;
    usageHours: number;
    serviceHistory: number;
    overdueMaintenance: number;
    damageReports: number;
    returnCondition: number;
  };
}

export default function HealthScoreBadge({ equipmentId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['health-score', equipmentId],
    queryFn: () => api.get<{ data: HealthScore }>(`/health-scores/equipment/${equipmentId}`),
  });

  if (isLoading || !data?.data) return null;

  const { score } = data.data;
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600';
  const bg = score >= 70 ? 'bg-green-100' : score >= 40 ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <div className={`${bg} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Health Score</span>
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
      </div>
      <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      {score < 40 && (
        <p className="text-xs text-red-600 mt-2">
          Maintenance required — booking may be blocked
        </p>
      )}
    </div>
  );
}
