import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Risk {
  bookingId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    trustScore: number;
    previousLateReturns: number;
    rentalDurationDays: number;
    daysUntilDue: number;
  };
  recommendation: string;
}

export default function LateReturnRisks() {
  const { data, isLoading } = useQuery({
    queryKey: ['late-return-risks'],
    queryFn: () => api.get<{ data: Risk[] }>('/late-return-prediction/risks'),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const risks = data?.data ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Late Return Risks</h1>
      <p className="text-sm text-gray-500 mb-6">
        Bookings flagged as likely to be returned late.
      </p>
      {risks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No at-risk bookings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((risk) => (
            <Link
              key={risk.bookingId}
              to={`/bookings/${risk.bookingId}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Booking #{risk.bookingId.slice(-6)}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        risk.riskLevel === 'high'
                          ? 'bg-red-100 text-red-700'
                          : risk.riskLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {risk.riskLevel} risk
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{risk.recommendation}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{risk.riskScore}%</p>
                  <p className="text-xs text-gray-500">risk score</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-xs text-gray-500">
                <div>
                  <p>Trust</p>
                  <p className="font-medium">{risk.factors.trustScore}</p>
                </div>
                <div>
                  <p>Late history</p>
                  <p className="font-medium">{risk.factors.previousLateReturns}</p>
                </div>
                <div>
                  <p>Duration</p>
                  <p className="font-medium">{risk.factors.rentalDurationDays}d</p>
                </div>
                <div>
                  <p>Days left</p>
                  <p className="font-medium">{risk.factors.daysUntilDue}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
