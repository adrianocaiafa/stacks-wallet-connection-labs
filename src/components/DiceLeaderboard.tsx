import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, diceGameContractName } from '../utils/contract';

interface LeaderboardEntry {
  address: string;
  totalRolls: number;
  wins: number;
  totalPoints: number;
  winStreak: number;
  longestStreak: number;
}

export function DiceLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      const userCountResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: diceGameContractName,
        functionName: 'get-user-count',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      });

      const userCount = cvToJSON(userCountResult);
      const totalUsers = parseInt(String(userCount.value || '0'));

      if (totalUsers === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const leaderboardEntries: LeaderboardEntry[] = [];

      // Fetch top 10 users
      for (let i = 0; i < Math.min(totalUsers, 10); i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Delay to avoid rate limiting

          const userWithStatsResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: diceGameContractName,
            functionName: 'get-user-at-index-with-stats',
            functionArgs: [uintCV(i)],
            network,
            senderAddress: contractAddress,
          });

          const userData = cvToJSON(userWithStatsResult);

          if (userData.type !== 'none' && userData.value) {
            const value = userData.value.value || userData.value;
            leaderboardEntries.push({
              address: value.address?.value || value.address,
              totalRolls: parseInt(String(value['total-rolls']?.value || value.totalRolls?.value || '0')),
              wins: parseInt(String(value.wins?.value || value.wins || '0')),
              totalPoints: parseInt(String(value['total-points']?.value || value.totalPoints?.value || '0')),
              winStreak: parseInt(String(value['win-streak']?.value || value.winStreak?.value || '0')),
              longestStreak: parseInt(String(value['longest-streak']?.value || value.longestStreak?.value || '0')),
            });
          }
        } catch (err) {
          continue;
        }
      }

      // Sort by total points (descending), then by wins
      leaderboardEntries.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.wins - a.wins;
      });
      setEntries(leaderboardEntries);
    } catch (err: any) {
      console.error('Erro ao buscar leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando leaderboard...</div>
      </div>
    );
  }

  if (entries.length === 0) {
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
        <p className="text-center text-gray-500">Nenhum jogador ainda</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">🏆 Leaderboard</h3>
            <p className="text-sm text-gray-500 mt-1">Ranking por pontos</p>
          </div>
          <button
            onClick={fetchLeaderboard}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {entries.map((entry, index) => {
          const winRate = entry.totalRolls > 0 ? ((entry.wins / entry.totalRolls) * 100).toFixed(1) : '0.0';
          return (
            <div key={entry.address} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {entry.address.slice(0, 8)}...{entry.address.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {entry.totalRolls} rolagens • {entry.wins} vitórias ({winRate}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{entry.totalPoints} pts</p>
                  <p className="text-xs text-gray-500">
                    Sequência: {entry.winStreak} • Máx: {entry.longestStreak}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

