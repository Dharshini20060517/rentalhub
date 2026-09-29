import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';

interface Summary {
  totalRevenue: number;
  totalBookings: number;
  activeBookings: number;
  averageBookingValue: number;
  utilizationRate: number;
  totalEquipment: number;
}

interface Trend {
  date: string;
  revenue: number;
  bookings: number;
}

interface TopEquipment {
  equipmentId: string;
  name: string;
  revenue: number;
  bookings: number;
  utilizationRate: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function OwnerDashboard() {
  const { data: summary } = useQuery({
    queryKey: ['owner-summary'],
    queryFn: () => api.get<{ data: Summary }>('/analytics/owner/summary'),
  });

  const { data: revenueTrend } = useQuery({
    queryKey: ['owner-revenue-trend'],
    queryFn: () => api.get<{ data: Trend[] }>('/analytics/owner/revenue-trend?days=30'),
  });

  const { data: topEquipment } = useQuery({
    queryKey: ['owner-top-equipment'],
    queryFn: () => api.get<{ data: TopEquipment[] }>('/analytics/owner/top-equipment?limit=5'),
  });

  const s = summary?.data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Owner Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPICard title="Total Revenue" value={`₹${(s?.totalRevenue ?? 0).toLocaleString()}`} />
        <KPICard title="Total Bookings" value={s?.totalBookings ?? 0} />
        <KPICard title="Active Bookings" value={s?.activeBookings ?? 0} />
        <KPICard title="Utilization" value={`${s?.utilizationRate ?? 0}%`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Revenue Trend (30 days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueTrend?.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Bookings (30 days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueTrend?.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Equipment */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-semibold mb-4">Top Equipment by Revenue</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2">Equipment</th>
                <th className="text-right py-2">Revenue</th>
                <th className="text-right py-2">Bookings</th>
                <th className="text-right py-2">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {(topEquipment?.data ?? []).map((eq, i) => (
                <tr key={eq.equipmentId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <Link to={`/equipment/${eq.equipmentId}`} className="hover:text-primary-600">
                        {eq.name}
                      </Link>
                    </div>
                  </td>
                  <td className="text-right py-2">₹{eq.revenue.toLocaleString()}</td>
                  <td className="text-right py-2">{eq.bookings}</td>
                  <td className="text-right py-2">{eq.utilizationRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
