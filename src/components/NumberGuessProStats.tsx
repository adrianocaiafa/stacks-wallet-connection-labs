import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, numberGuessProContractName } from '../utils/contract';

export function NumberGuessProStats() {
  const [totalGames, setTotalGames] = useState<number>(0);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const network = createNetwork('mainnet');

      const [totalGamesResult, playerCountResult] = await Promise.all([
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: numberGuessProContractName,
          functionName: 'get-total-games',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: numberGuessProContractName,
          functionName: 'get-player-count',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        }),
      ]);

      const totalGamesData = cvToJSON(totalGamesResult);
      const playerCountData = cvToJSON(playerCountResult);

      setTotalGames(parseInt(String(totalGamesData.value || '0')));
      setPlayerCount(parseInt(String(playerCountData.value || '0')));
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setLoading(false);
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
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          🔄 Atualizar
        </button>
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Carregando...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{totalGames}</p>
            <p className="text-sm text-gray-600">Total de Jogos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{playerCount}</p>
            <p className="text-sm text-gray-600">Jogadores Únicos</p>
          </div>
        </div>
      )}
    </div>
  );
}
