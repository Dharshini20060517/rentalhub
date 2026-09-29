import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Booking {
  _id: string;
  equipment: {
    _id: string;
    name: string;
    images: string[];
    pricePerDay: number;
    city: string;
  };
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  depositAmount: number;
  depositHeld: boolean;
  customer: { name: string; email: string };
  owner: { name: string; email: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  HELD: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  PICKED_UP: 'bg-purple-100 text-purple-700',
  IN_USE: 'bg-indigo-100 text-indigo-700',
  RETURN_PENDING: 'bg-orange-100 text-orange-700',
  RETURNED: 'bg-teal-100 text-teal-700',
  INSPECTED: 'bg-cyan-100 text-cyan-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  LATE: 'bg-red-100 text-red-700',
  DISPUTED: 'bg-red-100 text-red-700',
};

export default function Bookings() {
  const { data, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get<{ data: Booking[]; pagination: { total: number } }>('/bookings'),
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

  const bookings = data?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No bookings yet</p>
          <Link to="/search" className="text-primary-600 hover:text-primary-700">
            Browse equipment →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Link
              key={booking._id}
              to={`/bookings/${booking._id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                  {booking.equipment.images[0] && (
                    <img
                      src={booking.equipment.images[0]}
                      alt={booking.equipment.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{booking.equipment.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.startDate).toLocaleDateString()} →{' '}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.equipment.city} · ₹{booking.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
