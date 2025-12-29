import { useState, useEffect } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, questSystemContractName } from '../utils/contract';

interface UserStats {
  totalQuests: number;
  totalPoints: number;
  totalSpent: number;
  questMasterLevel: number;
}

export function UserQuestStats() {
  const { isConnected, address } = useAppKit();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
          contractName: questSystemContractName,
          functionName: 'get-user-stats',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        });

        const statsData = cvToJSON(statsResult);

        if (statsData.type !== 'none' && statsData.value) {
          const value = statsData.value.value || statsData.value;
          setStats({
            totalQuests: parseInt(String(value['total-quests']?.value || value.totalQuests?.value || '0')),
            totalPoints: parseInt(String(value['total-points']?.value || value.totalPoints?.value || '0')),
            totalSpent: parseInt(String(value['total-spent']?.value || value.totalSpent?.value || '0')) / 1000000,
            questMasterLevel: parseInt(String(value['quest-master-level']?.value || value.questMasterLevel?.value || '0')),
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

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
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
        <p className="text-gray-600">Complete sua primeira quest para ver suas estatísticas!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Suas Estatísticas</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalQuests}</p>
          <p className="text-sm text-gray-600">Quests</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.totalPoints}</p>
          <p className="text-sm text-gray-600">Pontos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.totalSpent.toFixed(6)}</p>
          <p className="text-sm text-gray-600">STX Gastos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">Lv.{stats.questMasterLevel}</p>
          <p className="text-sm text-gray-600">Quest Master</p>
        </div>
      </div>
    </div>
  );
}

