import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Props {
  bookingId: string;
}

interface CarbonSavings {
  moneySaved: number;
  co2AvoidedKg: number;
  currency: string;
  reasoning: string;
}

export default function CarbonSavingsBadge({ bookingId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['carbon-savings', bookingId],
    queryFn: () => api.get<{ data: CarbonSavings }>(`/carbon-savings/booking/${bookingId}`),
  });

  if (isLoading || !data?.data) return null;

  const { moneySaved, co2AvoidedKg } = data.data;

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-600 text-lg">🌱</span>
        <span className="font-semibold text-green-700 dark:text-green-400">Eco Impact</span>
      </div>
      <p className="text-sm text-green-700 dark:text-green-400">
        You saved <strong>₹{moneySaved.toLocaleString()}</strong> and avoided{' '}
        <strong>{co2AvoidedKg} kg CO₂</strong> vs buying new
      </p>
    </div>
  );
}
