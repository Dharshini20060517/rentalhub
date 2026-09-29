import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Recommendation {
  equipment: {
    _id: string;
    name: string;
    images: string[];
    pricePerDay: number;
    rating: number;
    city: string;
    category: { name: string };
  };
  score: number;
  reason: string;
}

interface Props {
  equipmentId?: string;
  type?: 'frequently-together' | 'similar';
}

export default function Recommendations({ equipmentId, type = 'frequently-together' }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations', equipmentId, type],
    queryFn: () => {
      if (!equipmentId) return api.get<{ data: Recommendation[] }>('/recommendations');
      const endpoint = type === 'similar'
        ? `/recommendations/equipment/${equipmentId}/similar`
        : `/recommendations/equipment/${equipmentId}/frequently-together`;
      return api.get<{ data: Recommendation[] }>(endpoint);
    },
    enabled: !!equipmentId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const items = data?.data ?? [];
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        {type === 'similar' ? 'Similar Available Alternatives' : 'Frequently Rented Together'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item.equipment._id}
            to={`/equipment/${item.equipment._id}`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition"
          >
            <div className="h-32 bg-gray-200 dark:bg-gray-700">
              {item.equipment.images[0] && (
                <img
                  src={item.equipment.images[0]}
                  alt={item.equipment.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm truncate">{item.equipment.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{item.equipment.category.name} · {item.equipment.city}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-primary-600">
                  ₹{item.equipment.pricePerDay.toLocaleString()}/day
                </span>
                <span className="text-xs text-gray-500">★ {item.equipment.rating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{item.reason}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
