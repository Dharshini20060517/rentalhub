import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Props {
  equipmentId: string;
}

interface BookedRange {
  from: string;
  to: string;
  status: string;
}

export default function AvailabilityCalendar({ equipmentId }: Props) {
  const { data } = useQuery({
    queryKey: ['availability', equipmentId],
    queryFn: () =>
      api.get<{ data: { bookedRanges: BookedRange[] } }>(
        `/equipment/${equipmentId}/availability`
      ),
  });

  const bookedRanges = data?.data.bookedRanges ?? [];

  // Generate next 60 days
  const days = Array.from({ length: 60 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const isBooked = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookedRanges.some((r) => dateStr >= r.from && dateStr <= r.to);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="font-medium text-gray-500 py-1">{d}</div>
        ))}
        {days.map((date) => {
          const booked = isBooked(date);
          return (
            <div
              key={date.toISOString()}
              className={`py-1 rounded ${
                booked
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              }`}
              title={booked ? 'Booked' : 'Available'}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}
