import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Props {
  equipmentId: string;
  currentPrice: number;
}

interface SimulationResult {
  currentRevenue: number;
  projectedRevenue: number;
  currentUtilization: number;
  projectedUtilization: number;
  changePercent: number;
  reasoning: string;
}

export default function WhatIfSimulator({ equipmentId, currentPrice }: Props) {
  const [newPrice, setNewPrice] = useState(currentPrice);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ data: SimulationResult }>(`/what-if-simulator/equipment/${equipmentId}/price`, {
        newPricePerDay: newPrice,
      }),
    onSuccess: (res) => setResult(res.data),
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="font-semibold mb-4">What-If Simulator</h2>
      <p className="text-sm text-gray-500 mb-4">
        Adjust the price to see projected revenue and utilization.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Price per day: <span className="text-primary-600 font-bold">₹{newPrice.toLocaleString()}</span>
        </label>
        <input
          type="range"
          min={Math.round(currentPrice * 0.5)}
          max={Math.round(currentPrice * 2)}
          step={50}
          value={newPrice}
          onChange={(e) => setNewPrice(parseInt(e.target.value, 10))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>₹{Math.round(currentPrice * 0.5).toLocaleString()}</span>
          <span>₹{Math.round(currentPrice * 2).toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 mb-4"
      >
        {mutation.isPending ? 'Simulating...' : 'Run Simulation'}
      </button>

      {result && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Current Revenue</p>
              <p className="text-lg font-bold">₹{result.currentRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Projected Revenue</p>
              <p className={`text-lg font-bold ${result.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{result.projectedRevenue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current Utilization</p>
              <p className="text-lg font-bold">{result.currentUtilization}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Projected Utilization</p>
              <p className="text-lg font-bold">{result.projectedUtilization}%</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{result.reasoning}</p>
        </div>
      )}
    </div>
  );
}
