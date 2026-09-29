import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import EquipmentCard from '../components/EquipmentCard';
import FilterSidebar from '../components/FilterSidebar';
import CompareDrawer from '../components/CompareDrawer';

interface Equipment {
  _id: string;
  name: string;
  description: string;
  images: string[];
  pricePerDay: number;
  deposit: number;
  rating: number;
  reviewCount: number;
  city: string;
  category: { name: string; slug: string };
  specs: Record<string, string | number | boolean>;
}

interface SearchResponse {
  data: Equipment[];
  pagination: { page: number; limit: number; total: number };
}

export default function Search() {
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    search: '',
    availableFrom: '',
    availableTo: '',
  });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const { data, isLoading } = useQuery<SearchResponse>({
    queryKey: ['equipment', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      return api.get<SearchResponse>(`/equipment?${params}`);
    },
  });

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Search Equipment</h1>
      <div className="flex gap-6">
        <FilterSidebar filters={filters} onChange={setFilters} />
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{data?.pagination.total ?? 0} results</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.data.map((item) => (
                  <EquipmentCard
                    key={item._id}
                    equipment={item}
                    onCompare={() => toggleCompare(item._id)}
                    isComparing={compareIds.includes(item._id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {compareIds.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setShowCompare(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-700"
          >
            Compare ({compareIds.length})
          </button>
        </div>
      )}
      {showCompare && (
        <CompareDrawer
          equipmentIds={compareIds}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}
