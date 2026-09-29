import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Equipment {
  _id: string;
  name: string;
  images: string[];
  pricePerDay: number;
  pricePerHour?: number;
  deposit: number;
  city: string;
  owner: { _id: string; name: string };
}

type Step = 'dates' | 'payment' | 'confirmation';

export default function Booking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('dates');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: equipmentData, isLoading } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => api.get<{ data: Equipment }>(`/equipment/${id}`),
  });

  const createBookingMutation = useMutation({
    mutationFn: () =>
      api.post<{ data: { _id: string } }>('/bookings', {
        equipmentId: id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        idempotencyKey: `booking-${id}-${Date.now()}`,
      }),
    onSuccess: (res) => {
      setBookingId(res.data._id);
      setStep('payment');
    },
    onError: (err: Error) => setError(err.message),
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      api.post(`/bookings/confirm`, {
        bookingId,
        paymentId: `pi_mock_${Date.now()}`,
      }),
    onSuccess: () => setStep('confirmation'),
    onError: (err: Error) => setError(err.message),
  });

  const equipment = equipmentData?.data;

  const calculatePrice = () => {
    if (!equipment || !startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const days = Math.ceil(hours / 24);
    if (equipment.pricePerHour && hours < 24) {
      return Math.round(equipment.pricePerHour * hours);
    }
    return Math.round(equipment.pricePerDay * days);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!equipment) {
    return <div className="max-w-3xl mx-auto px-6 py-8 text-center">Equipment not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-primary-600 hover:text-primary-700 mb-4">
        ← Back
      </button>
      <h1 className="text-2xl font-bold mb-2">Book: {equipment.name}</h1>
      <p className="text-sm text-gray-500 mb-6">{equipment.city} · Owned by {equipment.owner.name}</p>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {(['dates', 'payment', 'confirmation'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-primary-600 text-white'
                  : i < ['dates', 'payment', 'confirmation'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            <span className="text-sm capitalize">{s}</span>
            {i < 2 && <div className="w-8 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Dates */}
      {step === 'dates' && (
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
                <span>Duration</span>
                <span>
                  {Math.ceil(
                    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Rental price</span>
                <span className="font-semibold text-primary-600">₹{calculatePrice().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Deposit (held)</span>
                <span>₹{equipment.deposit.toLocaleString()}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => createBookingMutation.mutate()}
            disabled={!startDate || !endDate || createBookingMutation.isPending}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createBookingMutation.isPending ? 'Creating hold...' : 'Continue to Payment'}
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            A 10-minute hold will be placed on this equipment
          </p>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 'payment' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Payment</h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-4 mb-4">
            <div className="flex justify-between text-sm">
              <span>Deposit amount</span>
              <span className="font-semibold">₹{equipment.deposit.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This is a hold, not a charge. It will be refunded after return inspection.
            </p>
          </div>
          <button
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {confirmMutation.isPending ? 'Processing...' : 'Pay Deposit & Confirm'}
          </button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirmation' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="font-semibold text-lg mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your booking for <strong>{equipment.name}</strong> has been confirmed.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/bookings')}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate('/')}
              className="border border-gray-300 dark:border-gray-600 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
