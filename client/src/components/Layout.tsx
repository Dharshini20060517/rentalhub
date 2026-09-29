import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600">
            RentalHub
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <Link to="/search" className="hover:text-primary-600">Search</Link>
            <Link to="/bookings" className="hover:text-primary-600">Bookings</Link>
            <Link to="/wishlist" className="hover:text-primary-600">Wishlist</Link>
            <Link to="/waitlist" className="hover:text-primary-600">Waitlist</Link>
            <Link to="/notifications" className="hover:text-primary-600">Notifications</Link>
            <Link to="/qr" className="hover:text-primary-600">QR Scan</Link>
            <Link to="/dashboard/owner" className="hover:text-primary-600">Owner Dashboard</Link>
            <Link to="/dashboard/admin" className="hover:text-primary-600">Admin Dashboard</Link>
            <Link to="/login" className="hover:text-primary-600">Login</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 text-center text-sm text-gray-500">
        RentalHub — Intelligent Equipment Rental Ecosystem
      </footer>
    </div>
  );
}
