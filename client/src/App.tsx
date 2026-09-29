import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import EquipmentDetail from './pages/EquipmentDetail';
import Wishlist from './pages/Wishlist';
import Booking from './pages/Booking';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import QRScanner from './pages/QRScanner';
import Inspection from './pages/Inspection';
import ReviewForm from './pages/ReviewForm';
import Notifications from './pages/Notifications';
import Waitlist from './pages/Waitlist';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AIDamageAnalysis from './pages/AIDamageAnalysis';
import DisputeForm from './pages/DisputeForm';
import DisputeConsole from './pages/DisputeConsole';
import DisputeDetail from './pages/DisputeDetail';
import BundleBooking from './pages/BundleBooking';
import LateReturnRisks from './pages/LateReturnRisks';
import FraudDetection from './pages/FraudDetection';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/equipment/:id" element={<EquipmentDetail />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/book/:id" element={<Booking />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/qr" element={<QRScanner />} />
        <Route path="/inspections/new" element={<Inspection />} />
        <Route path="/reviews/new/:bookingId" element={<ReviewForm />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/dashboard/owner" element={<OwnerDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/ai-analysis" element={<AIDamageAnalysis />} />
        <Route path="/disputes" element={<DisputeConsole />} />
        <Route path="/disputes/:id" element={<DisputeDetail />} />
        <Route path="/disputes/new/:bookingId" element={<DisputeForm />} />
        <Route path="/bundles" element={<BundleBooking />} />
        <Route path="/late-return-risks" element={<LateReturnRisks />} />
        <Route path="/fraud-detection" element={<FraudDetection />} />
      </Route>
    </Routes>
  );
}
