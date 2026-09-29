import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Props {
  equipmentIds: string[];
  onClose: () => void;
}

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
  category: { name: string };
  specs: Record<string, string | number | boolean>;
}

export default function CompareDrawer({ equipmentIds, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['compare', equipmentIds],
    queryFn: () => Promise.all(equipmentIds.map((id) => api.get<{ data: Equipment }>(`/equipment/${id}`))),
    enabled: equipmentIds.length > 0,
  });

  const items = data?.map((r) => r.data) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="font-semibold">Compare Equipment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Feature</th>
                    {items.map((item) => (
                      <th key={item._id} className="text-left p-2">{item.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-2 font-medium">Price/day</td>
                    {items.map((item) => (
                      <td key={item._id} className="p-2">₹{item.pricePerDay.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-2 font-medium">Deposit</td>
                    {items.map((item) => (
                      <td key={item._id} className="p-2">₹{item.deposit.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-2 font-medium">Rating</td>
                    {items.map((item) => (
                      <td key={item._id} className="p-2">★ {item.rating.toFixed(1)} ({item.reviewCount})</td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-2 font-medium">City</td>
                    {items.map((item) => (
                      <td key={item._id} className="p-2">{item.city}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-2 font-medium">Category</td>
                    {items.map((item) => (
                      <td key={item._id} className="p-2">{item.category.name}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-2 font-medium">Specs</td>
                    {items.map((item) => (
                      <td key={item._id} className="p-2">
                        <div className="space-y-1">
                          {Object.entries(item.specs).slice(0, 4).map(([key, val]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-500">{key}:</span> {String(val)}
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
