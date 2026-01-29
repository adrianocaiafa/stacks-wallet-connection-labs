import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, mastermindContractName } from '../utils/contract';

interface LeaderboardEntry {
  address: string;
  totalGames: number;
  wins: number;
  totalAttempts: number;
  bestAttempts: number;
  perfectGames: number;
}

export function MastermindLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      const userCountResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: mastermindContractName,
        functionName: 'get-player-count',
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

      for (let i = 0; i < Math.min(totalUsers, 10); i++) {
        try {
          await new Promise((r) => setTimeout(r, 100));

          const userWithStatsResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: mastermindContractName,
            functionName: 'get-player-at-index-with-stats',
            functionArgs: [uintCV(i)],
            network,
            senderAddress: contractAddress,
          });

          const userData = cvToJSON(userWithStatsResult);

          if (userData.type !== 'none' && userData.value) {
            const value = userData.value.value || userData.value;
            const addr = value.address?.value ?? value.address;
            leaderboardEntries.push({
              address: typeof addr === 'string' ? addr : String(addr ?? ''),
              totalGames: parseInt(String(value['total-games']?.value ?? value.totalGames?.value ?? '0')),
              wins: parseInt(String(value.wins?.value ?? value.wins ?? '0')),
              totalAttempts: parseInt(String(value['total-attempts']?.value ?? value.totalAttempts?.value ?? '0')),
              bestAttempts: parseInt(String(value['best-attempts']?.value ?? value.bestAttempts?.value ?? '0')),
              perfectGames: parseInt(String(value['perfect-games']?.value ?? value.perfectGames?.value ?? '0')),
            });
          }
        } catch {
          continue;
        }
      }

      leaderboardEntries.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (a.bestAttempts !== b.bestAttempts) return a.bestAttempts - b.bestAttempts;
        return b.totalGames - a.totalGames;
      });
      setEntries(leaderboardEntries);
    } catch (err: unknown) {
      console.error('Erro ao buscar leaderboard Mastermind:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading && entries.length === 0) {
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
          <h3 className="text-xl font-semibold text-gray-900">Leaderboard</h3>
          <button
            onClick={fetchLeaderboard}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Atualizar
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
            <h3 className="text-xl font-semibold text-gray-900">Leaderboard</h3>
            <p className="text-sm text-gray-500 mt-1">Por vitórias e menor tentativas para ganhar</p>
          </div>
          <button
            onClick={fetchLeaderboard}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Atualizar
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {entries.map((entry, index) => {
          const winRate =
            entry.totalGames > 0 ? ((entry.wins / entry.totalGames) * 100).toFixed(1) : '0.0';
          const addr = entry.address.slice(0, 8) + '...' + entry.address.slice(-6);
          return (
            <div key={entry.address} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{addr}</p>
                    <p className="text-sm text-gray-500">
                      {entry.totalGames} partidas • {entry.wins} vitórias ({winRate}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-amber-600">
                    Melhor: {entry.bestAttempts} tent.
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.perfectGames} jogos perfeitos
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
