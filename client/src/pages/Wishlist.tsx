import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface WishlistItem {
  _id: string;
  equipment: {
    _id: string;
    name: string;
    images: string[];
    pricePerDay: number;
    rating: number;
    city: string;
    category: { name: string };
  };
  createdAt: string;
}

export default function Wishlist() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get<{ data: WishlistItem[] }>('/wishlist'),
  });

  const removeMutation = useMutation({
    mutationFn: (equipmentId: string) => api.delete(`/wishlist/${equipmentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
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

  const items = data?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>
          <Link to="/search" className="text-primary-600 hover:text-primary-700">
            Browse equipment →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
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
              <div className="p-4">
                <Link
                  to={`/equipment/${item.equipment._id}`}
                  className="font-semibold hover:text-primary-600 line-clamp-1"
                >
                  {item.equipment.name}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  {item.equipment.category.name} · {item.equipment.city}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-primary-600">
                    ₹{item.equipment.pricePerDay.toLocaleString()}/day
                  </span>
                  <button
                    onClick={() => removeMutation.mutate(item.equipment._id)}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Remove
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
