import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { uintCV } from '@stacks/transactions';
import { contractAddress, numberGuessZenContractName } from '../utils/contract';

interface LeaderboardEntry {
  address: string;
  totalGames: number;
  totalAttempts: number;
  bestAttempts: number;
  currentStreak: number;
  longestStreak: number;
}

export function NumberGuessLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const network = createNetwork('mainnet');

      // Get total player count
      const playerCountResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: numberGuessZenContractName,
        functionName: 'get-player-count',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      });

      const playerCountData = cvToJSON(playerCountResult);
      const totalPlayers = parseInt(playerCountData.value || '0');

      // Fetch top 20 players
      const playersToFetch = Math.min(totalPlayers, 20);
      const leaderboardEntries: LeaderboardEntry[] = [];

      for (let i = 0; i < playersToFetch; i++) {
        try {
          const playerWithStatsResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: numberGuessZenContractName,
            functionName: 'get-player-at-index-with-stats',
            functionArgs: [uintCV(i)],
            network,
            senderAddress: contractAddress,
          });

          const playerData = cvToJSON(playerWithStatsResult);
          
          if (playerData.type !== 'none' && playerData.value) {
            const tupleValue = playerData.value.value || playerData.value;
            const address = tupleValue['address']?.value || tupleValue['address'];
            
            if (address) {
              leaderboardEntries.push({
                address: typeof address === 'string' ? address : address.toString(),
                totalGames: parseInt(tupleValue['total-games']?.value || '0'),
                totalAttempts: parseInt(tupleValue['total-attempts']?.value || '0'),
                bestAttempts: parseInt(tupleValue['best-attempts']?.value || '0'),
                currentStreak: parseInt(tupleValue['current-streak']?.value || '0'),
                longestStreak: parseInt(tupleValue['longest-streak']?.value || '0'),
              });
            }
          }

          // Small delay to avoid rate limiting
          if (i < playersToFetch - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Erro ao buscar jogador ${i}:`, error);
        }
      }

      // Sort by longest streak, then by best attempts
      leaderboardEntries.sort((a, b) => {
        if (b.longestStreak !== a.longestStreak) {
          return b.longestStreak - a.longestStreak;
        }
        if (a.bestAttempts === 0) return 1;
        if (b.bestAttempts === 0) return -1;
        return a.bestAttempts - b.bestAttempts;
      });

      setLeaderboard(leaderboardEntries);
    } catch (error) {
      console.error('Erro ao buscar leaderboard:', error);
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition disabled:opacity-50"
        >
          {isLoading ? '🔄' : '🔄 Atualizar'}
        </button>
      </div>

      {isLoading && leaderboard.length === 0 ? (
        <p className="text-center text-gray-500">Carregando leaderboard...</p>
      ) : leaderboard.length === 0 ? (
        <p className="text-center text-gray-500">Nenhum jogador encontrado ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700">#</th>
                <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700">Endereço</th>
                <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700">Jogos</th>
                <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700">Melhor</th>
                <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700">Sequência</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={entry.address} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 text-sm font-semibold text-gray-900">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                  </td>
                  <td className="py-2 px-2 text-sm text-gray-700 font-mono">
                    {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                  </td>
                  <td className="py-2 px-2 text-sm text-gray-600 text-right">{entry.totalGames}</td>
                  <td className="py-2 px-2 text-sm text-green-600 text-right font-semibold">
                    {entry.bestAttempts > 0 ? `${entry.bestAttempts}` : '-'}
                  </td>
                  <td className="py-2 px-2 text-sm text-purple-600 text-right font-semibold">
                    {entry.longestStreak}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
