import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { standardPrincipalCV } from '@stacks/transactions';
import { contractAddress, numberGuessZenContractName } from '../utils/contract';

export function UserNumberGuessStats() {
  const { isConnected, address } = useStacksWallet();
  const [stats, setStats] = useState<{
    totalGames: number;
    totalAttempts: number;
    bestAttempts: number;
    currentStreak: number;
    longestStreak: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    if (!isConnected || !address) {
      setStats(null);
      return;
    }

    setIsLoading(true);
    try {
      const network = createNetwork('mainnet');

      const statsResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: numberGuessZenContractName,
        functionName: 'get-player-stats',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const statsData = cvToJSON(statsResult);
      
      if (statsData.type !== 'none' && statsData.value) {
        const tupleValue = statsData.value.value || statsData.value;
        setStats({
          totalGames: parseInt(tupleValue['total-games']?.value || '0'),
          totalAttempts: parseInt(tupleValue['total-attempts']?.value || '0'),
          bestAttempts: parseInt(tupleValue['best-attempts']?.value || '0'),
          currentStreak: parseInt(tupleValue['current-streak']?.value || '0'),
          longestStreak: parseInt(tupleValue['longest-streak']?.value || '0'),
        });
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
      setStats(null);
    } finally {
      setIsLoading(false);
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

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Suas Estatísticas</h3>
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition disabled:opacity-50"
          >
            {isLoading ? '🔄' : '🔄 Atualizar'}
          </button>
        </div>
        <p className="text-center text-gray-500">Nenhuma estatística encontrada. Comece a jogar!</p>
      </div>
    );
  }

  const avgAttempts = stats.totalGames > 0 ? (stats.totalAttempts / stats.totalGames).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Suas Estatísticas</h3>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition disabled:opacity-50"
        >
          {isLoading ? '🔄' : '🔄 Atualizar'}
        </button>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Total de Jogos:</span>
          <span className="font-semibold text-gray-900">{stats.totalGames.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total de Tentativas:</span>
          <span className="font-semibold text-gray-900">{stats.totalAttempts.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Média de Tentativas:</span>
          <span className="font-semibold text-gray-900">{avgAttempts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Melhor Tentativa:</span>
          <span className="font-semibold text-green-600">
            {stats.bestAttempts > 0 ? `${stats.bestAttempts} tentativas` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Sequência Atual:</span>
          <span className="font-semibold text-blue-600">{stats.currentStreak}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Maior Sequência:</span>
          <span className="font-semibold text-purple-600">{stats.longestStreak}</span>
        </div>
      </div>
    </div>
  );
}
