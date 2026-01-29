import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, dailyCheckInContractName } from '../utils/contract';

interface UserStats {
  totalCheckIns: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  lastCheckInDay: number;
}

export function UserCheckInStats() {
  const { isConnected, address } = useStacksWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!isConnected || !address) {
      setStats(null);
      return;
    }

    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      const statsResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: dailyCheckInContractName,
        functionName: 'get-user-stats',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const statsData = cvToJSON(statsResult);

      if (statsData.type !== 'none' && statsData.value) {
        const value = statsData.value.value || statsData.value;
        setStats({
          totalCheckIns: parseInt(String(value['total-check-ins']?.value || value.totalCheckIns?.value || '0')),
          currentStreak: parseInt(String(value['current-streak']?.value || value.currentStreak?.value || '0')),
          longestStreak: parseInt(String(value['longest-streak']?.value || value.longestStreak?.value || '0')),
          totalPoints: parseInt(String(value['total-points']?.value || value.totalPoints?.value || '0')),
          lastCheckInDay: parseInt(String(value['last-check-in-day']?.value || value.lastCheckInDay?.value || '0')),
        });
      } else {
        setStats(null);
      }
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas do usuário:', err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para ver suas estatísticas</p>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando estatísticas...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Suas Estatísticas</h3>
        <p className="text-gray-600">Faça seu primeiro check-in para ver suas estatísticas!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Suas Estatísticas</h3>
        <button
          onClick={fetchStats}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          🔄 Atualizar
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalCheckIns}</p>
          <p className="text-sm text-gray-600">Check-ins</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.currentStreak}</p>
          <p className="text-sm text-gray-600">Sequência Atual</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{stats.longestStreak}</p>
          <p className="text-sm text-gray-600">Maior Sequência</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.totalPoints}</p>
          <p className="text-sm text-gray-600">Pontos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.lastCheckInDay}</p>
          <p className="text-sm text-gray-600">Último Dia</p>
        </div>
      </div>
    </div>
  );
}

