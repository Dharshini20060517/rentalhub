import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { api } from '../lib/api';

interface AdminSummary {
  totalUsers: number;
  totalCustomers: number;
  totalOwners: number;
  totalEquipment: number;
  totalBookings: number;
  platformRevenue: number;
  activeBookings: number;
}

interface StatusDistribution {
  status: string;
  count: number;
}

interface CategoryDistribution {
  category: string;
  bookings: number;
  revenue: number;
}

interface OwnerLeaderboard {
  ownerId: string;
  ownerName: string;
  revenue: number;
  bookings: number;
  equipmentCount: number;
}

interface UserGrowth {
  date: string;
  customers: number;
  owners: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AdminDashboard() {
  const { data: summary } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: () => api.get<{ data: AdminSummary }>('/analytics/admin/summary'),
  });

  const { data: statusDist } = useQuery({
    queryKey: ['admin-booking-status'],
    queryFn: () => api.get<{ data: StatusDistribution[] }>('/analytics/admin/booking-status'),
  });

  const { data: categoryDist } = useQuery({
    queryKey: ['admin-category-dist'],
    queryFn: () => api.get<{ data: CategoryDistribution[] }>('/analytics/admin/category-distribution'),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['admin-leaderboard'],
    queryFn: () => api.get<{ data: OwnerLeaderboard[] }>('/analytics/admin/owner-leaderboard'),
  });

  const { data: userGrowth } = useQuery({
    queryKey: ['admin-user-growth'],
    queryFn: () => api.get<{ data: UserGrowth[] }>('/analytics/admin/user-growth?days=30'),
  });

  const s = summary?.data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPICard title="Total Users" value={s?.totalUsers ?? 0} />
        <KPICard title="Total Equipment" value={s?.totalEquipment ?? 0} />
        <KPICard title="Total Bookings" value={s?.totalBookings ?? 0} />
        <KPICard title="Platform Revenue" value={`₹${(s?.platformRevenue ?? 0).toLocaleString()}`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Booking Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusDist?.data ?? []}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {(statusDist?.data ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">User Growth (30 days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowth?.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="customers" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="owners" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="font-semibold mb-4">Bookings by Category</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={categoryDist?.data ?? []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="bookings" fill="#3b82f6" />
            <Bar dataKey="revenue" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Owner Leaderboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-semibold mb-4">Owner Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2">Owner</th>
                <th className="text-right py-2">Revenue</th>
                <th className="text-right py-2">Bookings</th>
                <th className="text-right py-2">Equipment</th>
              </tr>
            </thead>
            <tbody>
              {(leaderboard?.data ?? []).map((owner) => (
                <tr key={owner.ownerId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 font-medium">{owner.ownerName}</td>
                  <td className="text-right py-2">₹{owner.revenue.toLocaleString()}</td>
                  <td className="text-right py-2">{owner.bookings}</td>
                  <td className="text-right py-2">{owner.equipmentCount}</td>
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
