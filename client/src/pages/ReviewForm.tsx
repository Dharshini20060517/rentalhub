import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function ReviewForm() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [conditionRating, setConditionRating] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/reviews', {
        bookingId,
        rating,
        comment,
        conditionRating,
      }),
    onSuccess: () => navigate('/bookings'),
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Write a Review</h1>
      <p className="text-sm text-gray-500 mb-6">Share your experience with this rental.</p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Overall Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`w-12 h-12 rounded-full border-2 text-lg font-semibold ${
                  rating === n
                    ? 'bg-yellow-400 border-yellow-400 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-yellow-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Condition Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setConditionRating(n)}
                className={`w-10 h-10 rounded-full border-2 font-semibold ${
                  conditionRating === n
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="How was the equipment? Any issues?"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          />
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={rating === 0 || mutation.isPending}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}
