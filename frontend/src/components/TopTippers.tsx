import { useState, useEffect } from 'react';
import { callReadOnlyFunction, cvToJSON, ClarityValue } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, contractName } from '../utils/contract';

interface TipperStats {
  address: string;
  totalSent: number;
  count: number;
}

export function TopTippers() {
  const [tippers, setTippers] = useState<TipperStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopTippers = async () => {
      setLoading(true);
      setError(null);

      try {
        // Note: In a real implementation, you would need to track all tippers
        // For now, this is a placeholder that shows the concept
        // In production, you'd maintain a list of known tippers or use events
        
        // This is a simplified version - in production you'd need to:
        // 1. Track all unique tippers from events or a separate mapping
        // 2. Query stats for each known tipper
        // 3. Sort by totalSent
        
        setTippers([]);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar ranking');
      } finally {
        setLoading(false);
      }
    };

    fetchTopTippers();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando ranking...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {tippers.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p className="mb-2">Nenhum tipper ainda</p>
          <p className="text-sm">O ranking aparecerá aqui quando houver tips enviados</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {tippers.map((tipper, index) => (
            <div key={tipper.address} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tipper.address.slice(0, 8)}...{tipper.address.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tipper.count} {tipper.count === 1 ? 'tip' : 'tips'}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-blue-600">
                  {tipper.totalSent.toFixed(6)} STX
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

