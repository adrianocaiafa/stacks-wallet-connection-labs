import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress } from '../utils/contract';

interface LeaderboardEntry {
  address: string;
  totalActions: number;
  totalSpent: number;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      try {
        const network = createNetwork('mainnet');

        // Get total users
        const userCountResult = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName: 'gas-meter',
          functionName: 'get-user-count',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });

        const userCount = cvToJSON(userCountResult);
        const totalUsers = parseInt(userCount.value || '0');

        if (totalUsers === 0) {
          setEntries([]);
          setLoading(false);
          return;
        }

        const leaderboardEntries: LeaderboardEntry[] = [];

        // Fetch all users with stats
        for (let i = 0; i < Math.min(totalUsers, 10); i++) {
          try {
            const userWithStatsResult = await fetchCallReadOnlyFunction({
              contractAddress,
              contractName: 'gas-meter',
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
                totalActions: parseInt(value['total-actions']?.value || '0'),
                totalSpent: parseInt(value['total-spent']?.value || '0') / 1000000,
              });
            }
          } catch (err) {
            continue;
          }
        }

        // Sort by total spent (descending)
        leaderboardEntries.sort((a, b) => b.totalSpent - a.totalSpent);
        setEntries(leaderboardEntries);
      } catch (err: any) {
        console.error('Erro ao buscar leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Nenhum usuário ainda</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
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
                  <p className="text-sm text-gray-500">{entry.totalActions} ações</p>
                </div>
              </div>
              <p className="font-semibold text-green-600">{entry.totalSpent.toFixed(6)} STX</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

