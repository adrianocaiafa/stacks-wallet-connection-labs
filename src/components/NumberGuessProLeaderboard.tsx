import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, numberGuessProContractName } from '../utils/contract';

interface LeaderboardEntry {
  address: string;
  totalGames: number;
  wins: number;
  totalScore: number;
  bestScore: number;
  perfectGames: number;
}

export function NumberGuessProLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [playerCount, setPlayerCount] = useState<number>(0);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const network = createNetwork('mainnet');

      // Get player count
      const playerCountResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: numberGuessProContractName,
        functionName: 'get-player-count',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      });

      const countData = cvToJSON(playerCountResult);
      const totalPlayers = parseInt(String(countData.value || '0'));
      setPlayerCount(totalPlayers);

      // Fetch top 20 players
      const playersToFetch = Math.min(totalPlayers, 20);
      const entries: LeaderboardEntry[] = [];

      for (let i = 0; i < playersToFetch; i++) {
        await new Promise(resolve => setTimeout(resolve, 150)); // Delay to avoid rate limiting

        try {
          const playerResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: numberGuessProContractName,
            functionName: 'get-player-at-index-with-stats',
            functionArgs: [uintCV(i)],
            network,
            senderAddress: contractAddress,
          });

          const playerData = cvToJSON(playerResult);
          if (playerData.type !== 'none' && playerData.value) {
            const value = playerData.value.value || playerData.value;
            entries.push({
              address: value.address?.value || value.address || '',
              totalGames: parseInt(String(value['total-games']?.value || value.totalGames?.value || '0')),
              wins: parseInt(String(value.wins?.value || value.wins || '0')),
              totalScore: parseInt(String(value['total-score']?.value || value.totalScore?.value || '0')),
              bestScore: parseInt(String(value['best-score']?.value || value.bestScore?.value || '0')),
              perfectGames: parseInt(String(value['perfect-games']?.value || value.perfectGames?.value || '0')),
            });
          }
        } catch (err) {
          console.error(`Erro ao buscar jogador ${i}:`, err);
        }
      }

      // Sort by best score (descending)
      entries.sort((a, b) => b.bestScore - a.bestScore);
      setLeaderboard(entries);
    } catch (err: any) {
      console.error('Erro ao buscar leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">🏆 Leaderboard</h3>
        <button
          onClick={fetchLeaderboard}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          🔄 Atualizar
        </button>
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Carregando leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <p className="text-gray-600 text-center">Nenhum jogador encontrado ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700">#</th>
                <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700">Endereço</th>
                <th className="text-center py-2 px-2 text-sm font-semibold text-gray-700">Jogos</th>
                <th className="text-center py-2 px-2 text-sm font-semibold text-gray-700">Vitórias</th>
                <th className="text-center py-2 px-2 text-sm font-semibold text-gray-700">Melhor Pontuação</th>
                <th className="text-center py-2 px-2 text-sm font-semibold text-gray-700">Perfeitos</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 text-sm font-semibold text-gray-900">{index + 1}</td>
                  <td className="py-2 px-2 text-sm text-gray-700 font-mono text-xs">
                    {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                  </td>
                  <td className="py-2 px-2 text-sm text-center text-gray-700">{entry.totalGames}</td>
                  <td className="py-2 px-2 text-sm text-center text-green-600 font-semibold">{entry.wins}</td>
                  <td className="py-2 px-2 text-sm text-center text-purple-600 font-bold">{entry.bestScore}</td>
                  <td className="py-2 px-2 text-sm text-center text-orange-600 font-semibold">{entry.perfectGames}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {playerCount > 20 && (
            <p className="text-xs text-gray-500 mt-4 text-center">
              Mostrando top 20 de {playerCount} jogadores
            </p>
          )}
        </div>
      )}
    </div>
  );
}
