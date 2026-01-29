import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, multiTargetContractName } from '../utils/contract';

interface GameInfo {
  totalGames: number;
  playerCount: number;
  targetCount: number;
  minNumber: number;
  maxNumber: number;
  maxAttempts: number;
}

export function MultiTargetStats() {
  const [info, setInfo] = useState<GameInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      const [totalResult, countResult, gameInfoResult] = await Promise.all([
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: multiTargetContractName,
          functionName: 'get-total-games',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: multiTargetContractName,
          functionName: 'get-player-count',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: multiTargetContractName,
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
        targetCount: parseInt(String(value?.['target-count']?.value ?? value?.targetCount?.value ?? '3')),
        minNumber: parseInt(String(value?.['min-number']?.value ?? value?.minNumber?.value ?? '0')),
        maxNumber: parseInt(String(value?.['max-number']?.value ?? value?.maxNumber?.value ?? '100')),
        maxAttempts: parseInt(String(value?.['max-attempts']?.value ?? value?.maxAttempts?.value ?? '15')),
      });
    } catch (err: unknown) {
      console.error('Erro ao buscar estatísticas Multi-Target:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const handler = () => fetchStats();
    window.addEventListener('multi-target-refresh', handler);
    return () => window.removeEventListener('multi-target-refresh', handler);
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
        {info.targetCount} números ({info.minNumber}–{info.maxNumber}) • soma conhecida • {info.maxAttempts} tentativas
      </div>
    </div>
  );
}
