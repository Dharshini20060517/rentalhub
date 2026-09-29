import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Props {
  userId: string;
}

interface TrustScore {
  score: number;
  factors: {
    onTimeReturns: number;
    damageHistory: number;
    disputeOutcomes: number;
    cancellationRate: number;
    verificationLevel: number;
    reviewQuality: number;
  };
}

export default function TrustScoreBadge({ userId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['trust-score', userId],
    queryFn: () => api.get<{ data: TrustScore }>(`/trust-scores/user/${userId}`),
  });

  if (isLoading || !data?.data) return null;

  const { score, factors } = data.data;
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
  const bg = score >= 75 ? 'bg-green-100' : score >= 50 ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <div className={`${bg} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Trust Score</span>
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full ${
            score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <FactorItem label="On-time" value={factors.onTimeReturns} />
        <FactorItem label="Damage" value={factors.damageHistory} />
        <FactorItem label="Disputes" value={factors.disputeOutcomes} />
        <FactorItem label="Cancel rate" value={factors.cancellationRate} />
        <FactorItem label="Verification" value={factors.verificationLevel} />
        <FactorItem label="Reviews" value={factors.reviewQuality} />
      </div>
      {score >= 90 && (
        <p className="text-xs text-green-600 mt-2 font-medium">
          Eligible for reduced deposit (50%)
        </p>
      )}
      {score >= 75 && score < 90 && (
        <p className="text-xs text-green-600 mt-2 font-medium">
          Eligible for auto-approval
        </p>
      )}
    </div>
  );
}

function FactorItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
