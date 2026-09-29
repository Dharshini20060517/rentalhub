import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface Bundle {
  _id: string;
  name: string;
  description: string;
  discountPercent: number;
  items: Array<{
    equipment: { _id: string; name: string; images: string[]; pricePerDay: number; city: string };
    quantity: number;
  }>;
}

export default function BundleBooking() {
  const navigate = useNavigate();
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: bundlesData, isLoading } = useQuery({
    queryKey: ['bundles'],
    queryFn: () => api.get<{ data: Bundle[] }>('/bundles'),
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/bundles/book', {
        bundleId: selectedBundle,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        idempotencyKey: `bundle-${selectedBundle}-${Date.now()}`,
      }),
    onSuccess: () => navigate('/bookings'),
    onError: (err: Error) => setError(err.message),
  });

  const bundles = bundlesData?.data ?? [];
  const selected = bundles.find((b) => b._id === selectedBundle);

  const calculateTotal = () => {
    if (!selected || !startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const total = selected.items.reduce((sum, item) => sum + item.equipment.pricePerDay * days * item.quantity, 0);
    return Math.round(total * (1 - selected.discountPercent / 100));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Book a Bundle</h1>
      <p className="text-sm text-gray-500 mb-6">
        Book multiple items together with a discount.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {bundles.map((bundle) => (
          <div
            key={bundle._id}
            onClick={() => setSelectedBundle(bundle._id)}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 cursor-pointer transition ${
              selectedBundle === bundle._id
                ? 'border-primary-500 ring-2 ring-primary-200'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{bundle.name}</h3>
                <p className="text-sm text-gray-500">{bundle.description}</p>
              </div>
              <span className="text-sm font-bold text-green-600">{bundle.discountPercent}% off</span>
            </div>
            <div className="mt-2 space-y-1">
              {bundle.items.map((item, i) => (
                <div key={i} className="text-xs text-gray-500">
                  {item.quantity}x {item.equipment.name} — ₹{item.equipment.pricePerDay}/day
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Select Dates</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
          </div>
          {startDate && endDate && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-4 mb-4">
              <div className="flex justify-between text-sm">
                <span>Bundle total</span>
                <span className="font-semibold text-primary-600">₹{calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 mt-1">
                <span>You save</span>
                <span>₹{Math.round(calculateTotal() * (selected.discountPercent / (100 - selected.discountPercent))).toLocaleString()}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => mutation.mutate()}
            disabled={!startDate || !endDate || mutation.isPending}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Booking...' : 'Book Bundle'}
          </button>
        </div>
      )}
    </div>
  );
}
