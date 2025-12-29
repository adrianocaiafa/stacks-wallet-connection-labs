import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, dailyCheckInContractName } from '../utils/contract';

interface LeaderboardEntry {
  address: string;
  totalCheckIns: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
}

export function CheckInLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      const userCountResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: dailyCheckInContractName,
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
            contractName: dailyCheckInContractName,
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
              totalCheckIns: parseInt(String(value['total-check-ins']?.value || value.totalCheckIns?.value || '0')),
              currentStreak: parseInt(String(value['current-streak']?.value || value.currentStreak?.value || '0')),
              longestStreak: parseInt(String(value['longest-streak']?.value || value.longestStreak?.value || '0')),
              totalPoints: parseInt(String(value['total-points']?.value || value.totalPoints?.value || '0')),
            });
          }
        } catch (err) {
          continue;
        }
      }

      // Sort by longest streak (descending), then by total check-ins
      leaderboardEntries.sort((a, b) => {
        if (b.longestStreak !== a.longestStreak) {
          return b.longestStreak - a.longestStreak;
        }
        return b.totalCheckIns - a.totalCheckIns;
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
        <p className="text-center text-gray-500">Nenhum usuário ainda</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">🏆 Leaderboard</h3>
            <p className="text-sm text-gray-500 mt-1">Ranking por maior sequência</p>
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
        {entries.map((entry, index) => (
          <div key={entry.address} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {entry.address.slice(0, 8)}...{entry.address.slice(-6)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {entry.totalCheckIns} check-ins • Sequência atual: {entry.currentStreak} dias
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-orange-600">🔥 {entry.longestStreak} dias</p>
                <p className="text-xs text-gray-500">{entry.totalPoints} pontos</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

