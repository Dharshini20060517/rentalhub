import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import ImageUpload from '../components/ImageUpload';

const DEFAULT_CHECKLIST = [
  'Body condition',
  'Lens/sensor clean',
  'Battery charged',
  'Accessories complete',
  'Power on test',
  'Buttons/dials working',
];

export default function Inspection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') === 'RETURN' ? 'RETURN' : 'PICKUP';
  const bookingId = searchParams.get('bookingId') || '';

  const [photos, setPhotos] = useState<string[]>([]);
  const [checklist, setChecklist] = useState(
    DEFAULT_CHECKLIST.map((item) => ({ item, ok: true, note: '' }))
  );
  const [conditionRating, setConditionRating] = useState(4);
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/inspections', {
        bookingId,
        type,
        photos: photos.map((url) => ({ url, hash: url, takenAt: new Date().toISOString() })),
        checklist,
        conditionRating,
        notes,
        signature,
      }),
    onSuccess: () => navigate('/bookings'),
    onError: (err: Error) => setError(err.message),
  });

  const toggleChecklist = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ok: !item.ok } : item))
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">
        {type === 'PICKUP' ? 'Pickup Inspection' : 'Return Inspection'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Document the equipment condition with photos and checklist.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Photos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Photos</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {photos.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt={`Inspection ${i + 1}`} className="w-full h-32 object-cover rounded-lg" />
                <button
                  onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <ImageUpload
            label="Add inspection photo"
            onUpload={(url) => setPhotos((prev) => [...prev, url])}
          />
        </div>

        {/* Checklist */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Condition Checklist</h2>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <button
                  onClick={() => toggleChecklist(i)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs ${
                    item.ok
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {item.ok && '✓'}
                </button>
                <span className={`text-sm ${item.ok ? 'text-gray-700 dark:text-gray-300' : 'text-red-500'}`}>
                  {item.item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Condition Rating */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Overall Condition Rating</h2>
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

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional notes about the equipment condition..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          />
        </div>

        {/* Signature */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Signature</h2>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type your full name as signature"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          />
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || photos.length === 0}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit Inspection'}
        </button>
      </div>
    </div>
  );
}
