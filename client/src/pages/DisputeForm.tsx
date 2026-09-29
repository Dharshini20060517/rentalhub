import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function DisputeForm() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [reason, setReason] = useState('DAMAGE');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/disputes', {
        bookingId,
        reason,
        description,
        evidence: [],
      }),
    onSuccess: () => navigate('/bookings'),
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Raise a Dispute</h1>
      <p className="text-sm text-gray-500 mb-6">
        Describe the issue. An admin will review and resolve.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          >
            <option value="DAMAGE">Damage</option>
            <option value="LATE_RETURN">Late Return</option>
            <option value="ITEM_NOT_AS_DESCRIBED">Item Not As Described</option>
            <option value="PAYMENT_ISSUE">Payment Issue</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the issue in detail..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          />
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={description.length < 10 || mutation.isPending}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit Dispute'}
        </button>
      </div>
    </div>
  );
}
