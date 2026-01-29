import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, mastermindContractName } from '../utils/contract';

interface UserStats {
  totalGames: number;
  wins: number;
  totalAttempts: number;
  bestAttempts: number;
  perfectGames: number;
  winRate: number;
  avgAttempts: number;
}

interface ActiveGame {
  attemptsLeft: number;
  attemptsUsed: number;
  gameId: number;
}

export function UserMastermindStats() {
  const { isConnected, address } = useStacksWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!isConnected || !address) {
      setStats(null);
      setActiveGame(null);
      return;
    }

    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      const [statsResult, hasActiveResult, activeResult, winRateResult, avgResult] = await Promise.all([
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: mastermindContractName,
          functionName: 'get-player-stats',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: mastermindContractName,
          functionName: 'has-active-game',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: mastermindContractName,
          functionName: 'get-active-game',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: mastermindContractName,
          functionName: 'get-player-win-rate',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: mastermindContractName,
          functionName: 'get-player-avg-attempts',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        }),
      ]);

      const hasActive = cvToJSON(hasActiveResult);
      const hasGame = hasActive.type !== 'bool' ? String(hasActive.value) === 'true' : hasActive.value === true;

      if (hasGame && activeResult) {
        const activeData = cvToJSON(activeResult);
        if (activeData.type !== 'none' && activeData.value) {
          const v = activeData.value.value || activeData.value;
          setActiveGame({
            attemptsLeft: parseInt(String(v['attempts-left']?.value ?? v.attemptsLeft?.value ?? '0')),
            attemptsUsed: parseInt(String(v['attempts-used']?.value ?? v.attemptsUsed?.value ?? '0')),
            gameId: parseInt(String(v['game-id']?.value ?? v.gameId?.value ?? '0')),
          });
        } else {
          setActiveGame(null);
        }
      } else {
        setActiveGame(null);
      }

      const statsData = cvToJSON(statsResult);
      const winRateData = cvToJSON(winRateResult);
      const avgData = cvToJSON(avgResult);

      if (statsData.type !== 'none' && statsData.value) {
        const value = statsData.value.value || statsData.value;
        setStats({
          totalGames: parseInt(String(value['total-games']?.value ?? value.totalGames?.value ?? '0')),
          wins: parseInt(String(value.wins?.value ?? value.wins ?? '0')),
          totalAttempts: parseInt(String(value['total-attempts']?.value ?? value.totalAttempts?.value ?? '0')),
          bestAttempts: parseInt(String(value['best-attempts']?.value ?? value.bestAttempts?.value ?? '0')),
          perfectGames: parseInt(String(value['perfect-games']?.value ?? value.perfectGames?.value ?? '0')),
          winRate: parseInt(String(winRateData.value ?? '0')) / 100,
          avgAttempts: parseInt(String(avgData.value ?? '0')),
        });
      } else {
        setStats(null);
      }
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas do usuário Mastermind:', err);
      setStats(null);
      setActiveGame(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [isConnected, address]);

  useEffect(() => {
    const handler = () => fetchStats();
    window.addEventListener('mastermind-refresh', handler);
    return () => window.removeEventListener('mastermind-refresh', handler);
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para ver suas estatísticas</p>
      </div>
    );
  }

  if (loading && !stats && !activeGame) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando estatísticas...</div>
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

      {activeGame && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-semibold text-amber-800">🎮 Jogo ativo</p>
          <p className="text-sm text-amber-700">
            Tentativas restantes: <strong>{activeGame.attemptsLeft}</strong> • Usadas: {activeGame.attemptsUsed}
          </p>
        </div>
      )}

      {!stats ? (
        <p className="text-gray-600">Jogue uma partida para ver suas estatísticas.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.totalGames}</p>
              <p className="text-sm text-gray-600">Partidas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
              <p className="text-sm text-gray-600">Vitórias</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.bestAttempts}</p>
              <p className="text-sm text-gray-600">Melhor (tent.)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.perfectGames}</p>
              <p className="text-sm text-gray-600">Perfeitos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.avgAttempts}</p>
              <p className="text-sm text-gray-600">Média tent.</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
            Taxa de vitória: <span className="font-semibold">{stats.winRate}%</span>
          </div>
        </>
      )}
    </div>
  );
}
