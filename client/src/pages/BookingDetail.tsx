import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Booking {
  _id: string;
  equipment: {
    _id: string;
    name: string;
    images: string[];
    pricePerDay: number;
    city: string;
    deposit: number;
  };
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  depositAmount: number;
  depositHeld: boolean;
  customer: { name: string; email: string };
  owner: { name: string; email: string };
  notes?: string;
  cancellationReason?: string;
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

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.get<{ data: Booking }>(`/bookings/${id}`),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  const booking = data?.data;
  if (!booking) {
    return <div className="max-w-3xl mx-auto px-6 py-8 text-center">Booking not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-primary-600 hover:text-primary-700 mb-4">
        ← Back
      </button>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-48 bg-gray-200 dark:bg-gray-700">
          {booking.equipment.images[0] && (
            <img
              src={booking.equipment.images[0]}
              alt={booking.equipment.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-bold">{booking.equipment.name}</h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {booking.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">{booking.equipment.city}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="font-medium">{new Date(booking.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">End Date</p>
              <p className="font-medium">{new Date(booking.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="font-medium text-primary-600">₹{booking.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Deposit</p>
              <p className="font-medium">
                ₹{booking.depositAmount.toLocaleString()} {booking.depositHeld && '(held)'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Customer</p>
              <p className="font-medium">{booking.customer.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Owner</p>
              <p className="font-medium">{booking.owner.name}</p>
            </div>
          </div>

          {booking.notes && (
            <div className="mb-4">
              <p className="text-xs text-gray-500">Notes</p>
              <p className="text-sm">{booking.notes}</p>
            </div>
          )}

          {booking.cancellationReason && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              Cancelled: {booking.cancellationReason}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {booking.status === 'CONFIRMED' && (
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                Pick Up
              </button>
            )}
            {booking.status === 'IN_USE' && (
              <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                Initiate Return
              </button>
            )}
            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <button className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50">
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
