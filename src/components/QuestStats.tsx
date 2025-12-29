import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, questSystemContractName } from '../utils/contract';

interface QuestStats {
  totalQuests: number;
  userCount: number;
}

export function QuestStats() {
  const [stats, setStats] = useState<QuestStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      try {
        const network = createNetwork('mainnet');

        const [totalQuestsResult, userCountResult] = await Promise.all([
          fetchCallReadOnlyFunction({
            contractAddress,
            contractName: questSystemContractName,
            functionName: 'get-total-quests',
            functionArgs: [],
            network,
            senderAddress: contractAddress,
          }),
          fetchCallReadOnlyFunction({
            contractAddress,
            contractName: questSystemContractName,
            functionName: 'get-user-count',
            functionArgs: [],
            network,
            senderAddress: contractAddress,
          }),
        ]);

        const totalQuestsData = cvToJSON(totalQuestsResult);
        const userCountData = cvToJSON(userCountResult);

        setStats({
          totalQuests: parseInt(String(totalQuestsData.value || '0')),
          userCount: parseInt(String(userCountData.value || '0')),
        });
      } catch (err: any) {
        console.error('Erro ao buscar estatísticas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 20000); // Atualiza a cada 20 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando estatísticas...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Estatísticas Globais</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.totalQuests}</p>
          <p className="text-sm text-gray-600">Quests Completadas</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.userCount}</p>
          <p className="text-sm text-gray-600">Usuários Únicos</p>
        </div>
      </div>
    </div>
  );
}

