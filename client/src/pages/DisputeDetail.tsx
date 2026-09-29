import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Dispute {
  _id: string;
  reason: string;
  description: string;
  status: string;
  resolution?: string;
  raisedBy: { name: string; email: string };
  against: { name: string; email: string };
  booking: { equipment: { name: string; images: string[] }; startDate: string; endDate: string; totalAmount: number };
  createdAt: string;
}

interface Evidence {
  booking: Record<string, unknown>;
  equipment: Record<string, unknown>;
  pickupInspection: { photos: Array<{ url: string }>; conditionRating: number } | null;
  returnInspection: { photos: Array<{ url: string }>; conditionRating: number } | null;
  trustScores: { customer: number | null; owner: number | null };
  healthScore: number | null;
  timeline: Array<{ event: string; timestamp: string; details: string }>;
}

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: disputeData, isLoading } = useQuery({
    queryKey: ['dispute', id],
    queryFn: () => api.get<{ data: Dispute }>(`/disputes/${id}`),
  });

  const { data: evidenceData } = useQuery({
    queryKey: ['dispute-evidence', id],
    queryFn: () => api.get<{ data: Evidence }>(`/disputes/${id}/evidence`),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  const dispute = disputeData?.data;
  const evidence = evidenceData?.data;

  if (!dispute) {
    return <div className="max-w-4xl mx-auto px-6 py-8 text-center">Dispute not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-primary-600 hover:text-primary-700 mb-4">
        ← Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-xl font-bold">{dispute.reason}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            {dispute.status}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{dispute.description}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Raised by</p>
            <p className="font-medium">{dispute.raisedBy.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Against</p>
            <p className="font-medium">{dispute.against.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Equipment</p>
            <p className="font-medium">{dispute.booking.equipment.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Amount</p>
            <p className="font-medium">₹{dispute.booking.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Evidence Timeline */}
      {evidence && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="font-semibold mb-4">Evidence Timeline</h2>
          <div className="space-y-3">
            {evidence.timeline.map((event, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{event.event}</p>
                  <p className="text-xs text-gray-500">{event.details}</p>
                  <p className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Side-by-side images */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Pickup (Before)</h3>
              {evidence.pickupInspection?.photos[0] ? (
                <img
                  src={evidence.pickupInspection.photos[0].url}
                  alt="Pickup"
                  className="w-full h-40 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                  No photo
                </div>
              )}
              {evidence.pickupInspection && (
                <p className="text-xs text-gray-500 mt-1">
                  Condition: {evidence.pickupInspection.conditionRating}/5
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Return (After)</h3>
              {evidence.returnInspection?.photos[0] ? (
                <img
                  src={evidence.returnInspection.photos[0].url}
                  alt="Return"
                  className="w-full h-40 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                  No photo
                </div>
              )}
              {evidence.returnInspection && (
                <p className="text-xs text-gray-500 mt-1">
                  Condition: {evidence.returnInspection.conditionRating}/5
                </p>
              )}
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-center">
              <p className="text-xs text-gray-500">Customer Trust</p>
              <p className="text-lg font-bold">{evidence.trustScores.customer ?? 'N/A'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-center">
              <p className="text-xs text-gray-500">Owner Trust</p>
              <p className="text-lg font-bold">{evidence.trustScores.owner ?? 'N/A'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-center">
              <p className="text-xs text-gray-500">Health Score</p>
              <p className="text-lg font-bold">{evidence.healthScore ?? 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {dispute.resolution && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">Resolution</p>
          <p className="text-sm text-green-600 dark:text-green-300 mt-1">{dispute.resolution}</p>
        </div>
      )}
    </div>
  );
}
