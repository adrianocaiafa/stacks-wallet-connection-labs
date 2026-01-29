import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, numberGuessZenContractName } from '../utils/contract';

export function NumberGuessStats() {
  const [totalGames, setTotalGames] = useState<number | null>(null);
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const network = createNetwork('mainnet');

      const totalGamesResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: numberGuessZenContractName,
        functionName: 'get-total-games',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      });

      const playerCountResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: numberGuessZenContractName,
        functionName: 'get-player-count',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      });

      const totalGamesData = cvToJSON(totalGamesResult);
      const playerCountData = cvToJSON(playerCountResult);

      setTotalGames(parseInt(totalGamesData.value || '0'));
      setPlayerCount(parseInt(playerCountData.value || '0'));
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Estatísticas Globais</h3>
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
          <span className="font-semibold text-gray-900">{totalGames !== null ? totalGames.toLocaleString() : '...'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total de Jogadores:</span>
          <span className="font-semibold text-gray-900">{playerCount !== null ? playerCount.toLocaleString() : '...'}</span>
        </div>
      </div>
    </div>
  );
}
