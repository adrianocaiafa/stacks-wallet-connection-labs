import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { standardPrincipalCV } from '@stacks/transactions';
import { contractAddress, coinFlipContractName } from '../utils/contract';

interface UserStats {
  totalFlips: number;
  wins: number;
  totalPoints: number;
  winStreak: number;
  longestStreak: number;
  headsWins: number;
  tailsWins: number;
}

export function UserCoinFlipStats() {
  const { isConnected, address } = useStacksWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [winRate, setWinRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!isConnected || !address) {
      setStats(null);
      setWinRate(null);
      return;
    }

    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      const [statsResult, winRateResult] = await Promise.all([
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: coinFlipContractName,
          functionName: 'get-user-stats',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: coinFlipContractName,
          functionName: 'get-user-win-rate',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        }),
      ]);

      const statsData = cvToJSON(statsResult);
      const winRateData = cvToJSON(winRateResult);

      if (statsData.value && typeof statsData.value === 'object' && 'value' in statsData.value) {
        const statsValue = statsData.value.value;
        setStats({
          totalFlips: parseInt(String(statsValue['total-flips']?.value || '0')),
          wins: parseInt(String(statsValue.wins?.value || '0')),
          totalPoints: parseInt(String(statsValue['total-points']?.value || '0')),
          winStreak: parseInt(String(statsValue['win-streak']?.value || '0')),
          longestStreak: parseInt(String(statsValue['longest-streak']?.value || '0')),
          headsWins: parseInt(String(statsValue['heads-wins']?.value || '0')),
          tailsWins: parseInt(String(statsValue['tails-wins']?.value || '0')),
        });
      }

      if (winRateData.value) {
        const rate = parseInt(String(winRateData.value || '0'));
        setWinRate(rate / 100); // Convert from percentage * 100 to actual percentage
      }
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas do usuário:', err);
    } finally {
      setLoading(false);
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
        <h3 className="text-xl font-semibold text-gray-900">Suas Estatísticas</h3>
        <button
          onClick={fetchStats}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          🔄 Atualizar
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalFlips}</p>
          <p className="text-xs text-gray-600">Total de Jogadas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
          <p className="text-xs text-gray-600">Vitórias</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</p>
          <p className="text-xs text-gray-600">Pontos Totais</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">
            {winRate !== null ? `${winRate.toFixed(2)}%` : '0%'}
          </p>
          <p className="text-xs text-gray-600">Taxa de Vitória</p>
        </div>
      </div>
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Sequência Atual:</p>
            <p className="text-lg font-bold text-orange-600">{stats.winStreak}</p>
          </div>
          <div>
            <p className="text-gray-600">Maior Sequência:</p>
            <p className="text-lg font-bold text-red-600">{stats.longestStreak}</p>
          </div>
          <div>
            <p className="text-gray-600">Vitórias Cara:</p>
            <p className="text-lg font-bold text-blue-600">{stats.headsWins}</p>
          </div>
          <div>
            <p className="text-gray-600">Vitórias Coroa:</p>
            <p className="text-lg font-bold text-indigo-600">{stats.tailsWins}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
