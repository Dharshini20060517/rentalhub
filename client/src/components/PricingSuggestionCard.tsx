import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Props {
  equipmentId: string;
}

interface Suggestion {
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  factors: {
    historicalDemand: number;
    seasonality: number;
    dayOfWeek: number;
    leadTime: number;
    utilization: number;
    localEvents: number;
    competitorBand: number;
  };
}

export default function PricingSuggestionCard({ equipmentId }: Props) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pricing-suggestion', equipmentId],
    queryFn: () => api.get<{ data: Suggestion }>(`/pricing-suggestions/equipment/${equipmentId}/latest`),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post(`/pricing-suggestions/equipment/${equipmentId}/generate`, {}),
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  const suggestion = data?.data;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Pricing Suggestion</h2>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          {generateMutation.isPending ? 'Generating...' : 'Generate New'}
        </button>
      </div>

      {suggestion ? (
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-primary-600">
              ₹{suggestion.suggestedPrice.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">/day</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{suggestion.reasoning}</p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <FactorBar label="Demand" value={suggestion.factors.historicalDemand} />
            <FactorBar label="Seasonality" value={suggestion.factors.seasonality} />
            <FactorBar label="Utilization" value={suggestion.factors.utilization} />
            <FactorBar label="Lead Time" value={suggestion.factors.leadTime} />
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No pricing suggestion yet</p>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate Suggestion'}
          </button>
        </div>
      )}
    </div>
  );
}

function FactorBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-gray-500 mb-1">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full"
          style={{ width: `${Math.min(value * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
