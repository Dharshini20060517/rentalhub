import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

interface Equipment {
  _id: string;
  name: string;
  description: string;
  images: string[];
  pricePerDay: number;
  pricePerHour?: number;
  deposit: number;
  bufferMinutes: number;
  minRentalHours: number;
  maxRentalDays: number;
  rating: number;
  reviewCount: number;
  city: string;
  address?: string;
  specs: Record<string, string | number | boolean>;
  category: { name: string; slug: string };
  owner: { _id: string; name: string };
}

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => api.get<{ data: Equipment }>(`/equipment/${id}`),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  const equipment = data?.data;
  if (!equipment) {
    return <div className="max-w-7xl mx-auto px-6 py-8 text-center">Equipment not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-primary-600 hover:text-primary-700 mb-4">
        ← Back
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
            {equipment.images[0] && (
              <img src={equipment.images[0]} alt={equipment.name} className="w-full h-full object-cover" />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">{equipment.name}</h1>
          <p className="text-sm text-gray-500 mb-4">
            {equipment.category.name} · {equipment.city} {equipment.address && `· ${equipment.address}`}
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{equipment.description}</p>

          <h3 className="font-semibold mb-2">Specifications</h3>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {Object.entries(equipment.specs).map(([key, val]) => (
              <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-sm">
                <span className="text-gray-500 capitalize">{key}:</span> {String(val)}
              </div>
            ))}
          </div>

          <h3 className="font-semibold mb-2">Availability</h3>
          <AvailabilityCalendar equipmentId={equipment._id} />
        </div>

        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
            <div className="mb-4">
              <span className="text-2xl font-bold text-primary-600">₹{equipment.pricePerDay.toLocaleString()}</span>
              <span className="text-gray-500">/day</span>
              {equipment.pricePerHour && (
                <span className="text-sm text-gray-500 ml-2">₹{equipment.pricePerHour}/hr</span>
              )}
            </div>
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Deposit</span>
                <span>₹{equipment.deposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Buffer time</span>
                <span>{equipment.bufferMinutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Min rental</span>
                <span>{equipment.minRentalHours} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Max rental</span>
                <span>{equipment.maxRentalDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rating</span>
                <span>★ {equipment.rating.toFixed(1)} ({equipment.reviewCount})</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/book/${equipment._id}`)}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Book Now
            </button>
            <button className="w-full mt-2 border border-gray-300 dark:border-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Add to Wishlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
