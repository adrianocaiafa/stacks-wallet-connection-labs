import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, mastermindContractName } from '../utils/contract';

interface GameInfo {
  totalGames: number;
  playerCount: number;
  codeLength: number;
  maxDigit: number;
  maxAttempts: number;
}

export function MastermindStats() {
  const [info, setInfo] = useState<GameInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      const [totalResult, countResult, gameInfoResult] = await Promise.all([
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: mastermindContractName,
          functionName: 'get-total-games',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: mastermindContractName,
          functionName: 'get-player-count',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: mastermindContractName,
          functionName: 'get-game-info',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        }),
      ]);

      const totalData = cvToJSON(totalResult);
      const countData = cvToJSON(countResult);
      const gameInfoData = cvToJSON(gameInfoResult);

      const value = gameInfoData.value?.value || gameInfoData.value;

      setInfo({
        totalGames: parseInt(String(totalData.value || '0')),
        playerCount: parseInt(String(countData.value || '0')),
        codeLength: parseInt(String(value?.['code-length']?.value ?? value?.codeLength?.value ?? '5')),
        maxDigit: parseInt(String(value?.['max-digit']?.value ?? value?.maxDigit?.value ?? '9')),
        maxAttempts: parseInt(String(value?.['max-attempts']?.value ?? value?.maxAttempts?.value ?? '10')),
      });
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas Mastermind:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const handler = () => fetchStats();
    window.addEventListener('mastermind-refresh', handler);
    return () => window.removeEventListener('mastermind-refresh', handler);
  }, []);

  if (loading && !info) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando estatísticas...</div>
      </div>
    );
  }

  if (!info) return null;

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
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-amber-600">{info.totalGames}</p>
          <p className="text-sm text-gray-600">Total de Partidas</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-indigo-600">{info.playerCount}</p>
          <p className="text-sm text-gray-600">Jogadores Únicos</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
        Código: {info.codeLength} dígitos (0–{info.maxDigit}) • {info.maxAttempts} tentativas por jogo
      </div>
    </div>
  );
}
