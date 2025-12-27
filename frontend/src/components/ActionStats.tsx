import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, stringAsciiCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress } from '../utils/contract';

export function ActionStats() {
  const [stats, setStats] = useState<Record<string, { count: number; totalFees: number }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      try {
        const network = createNetwork('mainnet');
        const actions = ['cast-spell', 'upgrade', 'claim-daily'];
        const actionStats: Record<string, { count: number; totalFees: number }> = {};

        for (const action of actions) {
          try {
            const statsResult = await fetchCallReadOnlyFunction({
              contractAddress,
              contractName: 'gas-meter',
              functionName: 'get-action-stats',
              functionArgs: [stringAsciiCV(action)],
              network,
              senderAddress: contractAddress,
            });

            const statsData = cvToJSON(statsResult);

            if (statsData.type !== 'none' && statsData.value) {
              const value = statsData.value.value || statsData.value;
              actionStats[action] = {
                count: parseInt(value.count?.value || '0'),
                totalFees: parseInt(value['total-fees']?.value || '0') / 1000000,
              };
            }
          } catch (err) {
            // Action might not have stats yet
            actionStats[action] = { count: 0, totalFees: 0 };
          }
        }

        setStats(actionStats);
      } catch (err: any) {
        console.error('Erro ao buscar estatísticas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const actionLabels: Record<string, { label: string; icon: string }> = {
    'cast-spell': { label: 'Cast Spell', icon: '✨' },
    'upgrade': { label: 'Upgrade', icon: '⬆️' },
    'claim-daily': { label: 'Claim Daily', icon: '🎁' },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="divide-y divide-gray-200">
        {Object.entries(stats).map(([action, stat]) => (
          <div key={action} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{actionLabels[action]?.icon || '📊'}</span>
                <div>
                  <p className="font-medium text-gray-900">{actionLabels[action]?.label || action}</p>
                  <p className="text-sm text-gray-500">{stat.count} execuções</p>
                </div>
              </div>
              <p className="font-semibold text-blue-600">{stat.totalFees.toFixed(6)} STX</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

