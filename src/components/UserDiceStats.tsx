import { useState, useEffect } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, diceGameContractName } from '../utils/contract';

interface UserStats {
  totalRolls: number;
  wins: number;
  totalPoints: number;
  winStreak: number;
  longestStreak: number;
}

export function UserDiceStats() {
  const { isConnected, address } = useAppKit();
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
        contractName: diceGameContractName,
        functionName: 'get-user-stats',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const statsData = cvToJSON(statsResult);

      if (statsData.type !== 'none' && statsData.value) {
        const value = statsData.value.value || statsData.value;
        setStats({
          totalRolls: parseInt(String(value['total-rolls']?.value || value.totalRolls?.value || '0')),
          wins: parseInt(String(value.wins?.value || value.wins || '0')),
          totalPoints: parseInt(String(value['total-points']?.value || value.totalPoints?.value || '0')),
          winStreak: parseInt(String(value['win-streak']?.value || value.winStreak?.value || '0')),
          longestStreak: parseInt(String(value['longest-streak']?.value || value.longestStreak?.value || '0')),
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
        <p className="text-gray-600">Faça sua primeira rolagem para ver suas estatísticas!</p>
      </div>
    );
  }

  const winRate = stats.totalRolls > 0 ? ((stats.wins / stats.totalRolls) * 100).toFixed(1) : '0.0';

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
          <p className="text-2xl font-bold text-blue-600">{stats.totalRolls}</p>
          <p className="text-sm text-gray-600">Rolagens</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
          <p className="text-sm text-gray-600">Vitórias</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.totalPoints}</p>
          <p className="text-sm text-gray-600">Pontos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.winStreak}</p>
          <p className="text-sm text-gray-600">Sequência</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{stats.longestStreak}</p>
          <p className="text-sm text-gray-600">Maior Seq.</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Taxa de Vitória: <span className="font-semibold text-gray-900">{winRate}%</span>
        </p>
      </div>
    </div>
  );
}

