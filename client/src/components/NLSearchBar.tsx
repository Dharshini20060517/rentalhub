import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Props {
  onResults: (results: unknown[]) => void;
}

interface ParsedQuery {
  filters: Record<string, unknown>;
  originalQuery: string;
  confidence: number;
}

interface NLSearchResult {
  data: {
    parsed: ParsedQuery;
    results: Array<{ _id: string; name: string; images: string[]; pricePerDay: number; rating: number; city: string; category: { name: string } }>;
  };
}

export default function NLSearchBar({ onResults }: Props) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const searchMutation = useMutation({
    mutationFn: (q: string) => api.get<NLSearchResult>(`/nl-search?q=${encodeURIComponent(q)}`),
    onSuccess: (res) => {
      onResults(res.data.results);
      setSearching(false);
    },
    onError: () => setSearching(false),
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    searchMutation.mutate(query.trim());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder='Try: "Need a DSLR and two lights for a weekend shoot in Chennai under ₹5000"'
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || searching}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Natural language search — describe what you need in plain English
      </p>
    </div>
  );
}
