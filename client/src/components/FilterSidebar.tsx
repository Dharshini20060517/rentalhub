import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Filters {
  category: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  search: string;
  availableFrom: string;
  availableTo: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function FilterSidebar({ filters, onChange }: Props) {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: { _id: string; name: string }[] }>('/categories'),
  });

  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <aside className="w-64 shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <h3 className="font-semibold">Filters</h3>

        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder="Search equipment..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          >
            <option value="">All categories</option>
            {categories?.data.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            type="text"
            value={filters.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="e.g., Chennai"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price per day (₹)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => update('minPrice', e.target.value)}
              placeholder="Min"
              className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
            />
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => update('maxPrice', e.target.value)}
              placeholder="Max"
              className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Min rating</label>
          <select
            value={filters.minRating}
            onChange={(e) => update('minRating', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          >
            <option value="">Any</option>
            <option value="4">4+</option>
            <option value="4.5">4.5+</option>
            <option value="4.8">4.8+</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Available from</label>
          <input
            type="date"
            value={filters.availableFrom}
            onChange={(e) => update('availableFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Available to</label>
          <input
            type="date"
            value={filters.availableTo}
            onChange={(e) => update('availableTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          />
        </div>

        <button
          onClick={() => onChange({ category: '', city: '', minPrice: '', maxPrice: '', minRating: '', search: '', availableFrom: '', availableTo: '' })}
          className="w-full text-sm text-primary-600 hover:text-primary-700"
        >
          Clear all filters
        </button>
      </div>
    </aside>
  );
}
