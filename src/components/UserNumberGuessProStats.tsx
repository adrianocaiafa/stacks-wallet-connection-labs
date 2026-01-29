import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, numberGuessProContractName } from '../utils/contract';

interface UserStats {
  totalGames: number;
  wins: number;
  totalScore: number;
  bestScore: number;
  perfectGames: number;
}

export function UserNumberGuessProStats() {
  const { isConnected, address } = useStacksWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [winRate, setWinRate] = useState<number>(0);
  const [avgScore, setAvgScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!isConnected || !address) {
      setStats(null);
      return;
    }

    setLoading(true);
    try {
      const network = createNetwork('mainnet');

      const [statsResult, winRateResult, avgScoreResult] = await Promise.all([
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: numberGuessProContractName,
          functionName: 'get-player-stats',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: numberGuessProContractName,
          functionName: 'get-player-win-rate',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: numberGuessProContractName,
          functionName: 'get-player-average-score',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        }),
      ]);

      const statsData = cvToJSON(statsResult);
      const winRateData = cvToJSON(winRateResult);
      const avgScoreData = cvToJSON(avgScoreResult);

      if (statsData.type !== 'none' && statsData.value) {
        const value = statsData.value.value || statsData.value;
        setStats({
          totalGames: parseInt(String(value['total-games']?.value || value.totalGames?.value || '0')),
          wins: parseInt(String(value.wins?.value || value.wins || '0')),
          totalScore: parseInt(String(value['total-score']?.value || value.totalScore?.value || '0')),
          bestScore: parseInt(String(value['best-score']?.value || value.bestScore?.value || '0')),
          perfectGames: parseInt(String(value['perfect-games']?.value || value.perfectGames?.value || '0')),
        });
      } else {
        setStats(null);
      }

      setWinRate(parseInt(String(winRateData.value || '0')) / 100);
      setAvgScore(parseInt(String(avgScoreData.value || '0')));
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas do usuário:', err);
      setStats(null);
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

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Suas Estatísticas</h3>
        <p className="text-gray-600">Inicie seu primeiro jogo para ver suas estatísticas!</p>
      </div>
    );
  }

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalGames}</p>
          <p className="text-sm text-gray-600">Jogos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
          <p className="text-sm text-gray-600">Vitórias</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.totalScore}</p>
          <p className="text-sm text-gray-600">Pontos Totais</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.bestScore}</p>
          <p className="text-sm text-gray-600">Melhor Pontuação</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{stats.perfectGames}</p>
          <p className="text-sm text-gray-600">Jogos Perfeitos</p>
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Taxa de Vitória</p>
            <p className="text-lg font-semibold text-gray-900">{winRate.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pontuação Média</p>
            <p className="text-lg font-semibold text-gray-900">{avgScore}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
