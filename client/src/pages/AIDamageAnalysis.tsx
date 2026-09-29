import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import ImageUpload from '../components/ImageUpload';

interface DamageRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

interface AnalysisResult {
  damageDetected: boolean;
  regions: DamageRegion[];
  overallConfidence: number;
  reasoning: string;
  provider: string;
}

export default function AIDamageAnalysis() {
  const [beforeImage, setBeforeImage] = useState('');
  const [afterImage, setAfterImage] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ data: AnalysisResult }>('/ai-vision/analyze-damage', {
        beforeImageUrl: beforeImage,
        afterImageUrl: afterImage,
        equipmentId,
      }),
    onSuccess: (res) => setResult(res.data),
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">AI Damage Analysis</h1>
      <p className="text-sm text-gray-500 mb-6">
        Upload before (pickup) and after (return) images. AI will compare them and flag potential new damage.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <label className="block text-sm font-medium mb-2">Equipment ID</label>
          <input
            type="text"
            value={equipmentId}
            onChange={(e) => setEquipmentId(e.target.value)}
            placeholder="Enter equipment ID"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold mb-4">Before (Pickup)</h2>
            <ImageUpload
              label="Upload pickup photo"
              onUpload={setBeforeImage}
            />
            {beforeImage && (
              <img src={beforeImage} alt="Before" className="mt-4 w-full h-40 object-cover rounded-lg" />
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold mb-4">After (Return)</h2>
            <ImageUpload
              label="Upload return photo"
              onUpload={setAfterImage}
            />
            {afterImage && (
              <img src={afterImage} alt="After" className="mt-4 w-full h-40 object-cover rounded-lg" />
            )}
          </div>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!beforeImage || !afterImage || !equipmentId || mutation.isPending}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Analyzing...' : 'Analyze Damage'}
        </button>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold mb-4">Analysis Result</h2>

            <div className="flex items-center gap-4 mb-4">
              <div
                className={`px-4 py-2 rounded-lg font-semibold ${
                  result.damageDetected
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {result.damageDetected ? 'Damage Detected' : 'No Damage Detected'}
              </div>
              <div className="text-sm text-gray-500">
                Confidence: {Math.round(result.overallConfidence * 100)}%
              </div>
              <div className="text-xs text-gray-400">
                Provider: {result.provider}
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{result.reasoning}</p>

            {result.regions.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-2">Detected Regions</h3>
                <div className="space-y-2">
                  {result.regions.map((region, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{region.label}</p>
                        <p className="text-xs text-gray-500">
                          Position: ({Math.round(region.x * 100)}%, {Math.round(region.y * 100)}%)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            region.severity === 'high'
                              ? 'bg-red-100 text-red-700'
                              : region.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {region.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(region.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4">
              This is a preliminary AI analysis. A human (owner/admin) must confirm any damage findings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
