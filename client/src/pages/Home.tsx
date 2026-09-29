export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">RentalHub</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Intelligent Equipment Rental Ecosystem
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2">For Customers</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search, compare, and book equipment with real-time availability and transparent pricing.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2">For Owners</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            List equipment, manage bookings, track maintenance, and optimize pricing with AI insights.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2">For Admins</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Moderate listings, resolve disputes, monitor platform health, and detect fraud.
          </p>
        </div>
      </div>
    </div>
  );
}
