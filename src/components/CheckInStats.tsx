import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, dailyCheckInContractName } from '../utils/contract';

interface CheckInStats {
  totalCheckIns: number;
  userCount: number;
}

export function CheckInStats() {
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      const [totalCheckInsResult, userCountResult] = await Promise.all([
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: dailyCheckInContractName,
          functionName: 'get-total-check-ins',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: dailyCheckInContractName,
          functionName: 'get-user-count',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        }),
      ]);

      const totalCheckInsData = cvToJSON(totalCheckInsResult);
      const userCountData = cvToJSON(userCountResult);

      setStats({
        totalCheckIns: parseInt(String(totalCheckInsData.value || '0')),
        userCount: parseInt(String(userCountData.value || '0')),
      });
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Estatísticas Globais</h3>
        <button
          onClick={fetchStats}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          🔄 Atualizar
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.totalCheckIns}</p>
          <p className="text-sm text-gray-600">Total de Check-ins</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.userCount}</p>
          <p className="text-sm text-gray-600">Usuários Únicos</p>
        </div>
      </div>
    </div>
  );
}

