import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress } from '../utils/contract';

interface UserStatsProps {
  userAddress: string;
}

export function UserStats({ userAddress }: UserStatsProps) {
  const [stats, setStats] = useState<{
    totalActions: number;
    totalSpent: number;
    lastActionTime: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userAddress) return;

      setLoading(true);
      setError(null);

      try {
        const network = createNetwork('mainnet');

        const statsResult = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName: 'gas-meter',
          functionName: 'get-user-stats',
          functionArgs: [standardPrincipalCV(userAddress)],
          network,
          senderAddress: contractAddress,
        });

        const statsData = cvToJSON(statsResult);

        if (statsData.type !== 'none' && statsData.value) {
          const value = statsData.value.value || statsData.value;
          setStats({
            totalActions: parseInt(value['total-actions']?.value || '0'),
            totalSpent: parseInt(value['total-spent']?.value || '0') / 1000000,
            lastActionTime: parseInt(value['last-action-time']?.value || '0'),
          });
        } else {
          setStats(null);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [userAddress]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando estatísticas...</div>
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

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Suas Estatísticas</h3>
        <p className="text-gray-600">Nenhuma ação executada ainda. Execute sua primeira ação!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Suas Estatísticas</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalActions}</p>
          <p className="text-sm text-gray-600">Ações Totais</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.totalSpent.toFixed(6)}</p>
          <p className="text-sm text-gray-600">STX Gastos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">
            {stats.lastActionTime > 0 ? `#${stats.lastActionTime}` : '-'}
          </p>
          <p className="text-sm text-gray-600">Última Ação</p>
        </div>
      </div>
    </div>
  );
}

