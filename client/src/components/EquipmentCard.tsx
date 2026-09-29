import { Link } from 'react-router-dom';

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
}

interface Props {
  equipment: Equipment;
  onCompare: () => void;
  isComparing: boolean;
}

export default function EquipmentCard({ equipment, onCompare, isComparing }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="h-40 bg-gray-200 dark:bg-gray-700">
        {equipment.images[0] && (
          <img src={equipment.images[0]} alt={equipment.name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link to={`/equipment/${equipment._id}`} className="font-semibold hover:text-primary-600 line-clamp-1">
            {equipment.name}
          </Link>
          <button
            onClick={onCompare}
            className={`text-xs px-2 py-1 rounded ${isComparing ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {isComparing ? '✓' : '+'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{equipment.category.name} · {equipment.city}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{equipment.description}</p>
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-lg font-bold text-primary-600">₹{equipment.pricePerDay.toLocaleString()}</span>
            <span className="text-xs text-gray-500">/day</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-yellow-500">★</span>
            <span>{equipment.rating.toFixed(1)}</span>
            <span className="text-gray-400">({equipment.reviewCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
