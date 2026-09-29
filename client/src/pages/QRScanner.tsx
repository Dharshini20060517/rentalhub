import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function QRScanner() {
  const navigate = useNavigate();
  const [qrData, setQrData] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ equipmentId: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!qrData.trim()) return;
    setScanning(true);
    setError(null);
    try {
      const res = await api.post<{ data: { equipmentId: string; name: string } }>('/qr/scan', {
        qrData: qrData.trim(),
      });
      setResult(res.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">QR Check-in / Check-out</h1>
      <p className="text-sm text-gray-500 mb-6">
        Scan the QR code on the equipment to start the guided handover flow.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">QR Code Data</label>
          <textarea
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            placeholder='Paste QR code data (e.g., {"equipmentId":"...","name":"..."})'
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 font-mono"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg mb-4 text-sm">
            <p className="font-semibold">{result.name}</p>
            <p className="text-xs mt-1">Equipment ID: {result.equipmentId}</p>
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={!qrData.trim() || scanning}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
        >
          {scanning ? 'Scanning...' : 'Scan QR Code'}
        </button>

        {result && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate(`/inspections/new?bookingId=&type=PICKUP&equipmentId=${result.equipmentId}`)}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              Start Pickup
            </button>
            <button
              onClick={() => navigate(`/inspections/new?bookingId=&type=RETURN&equipmentId=${result.equipmentId}`)}
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 text-sm"
            >
              Start Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
