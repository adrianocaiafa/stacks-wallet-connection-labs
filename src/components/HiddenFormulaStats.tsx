import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, hiddenFormulaContractName } from '../utils/contract';

interface GameInfo {
  totalGames: number;
  maxInput: number;
  maxAttempts: number;
}

export function HiddenFormulaStats() {
  const [info, setInfo] = useState<GameInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const network = createNetwork('mainnet');
      const [totalResult, gameInfoResult] = await Promise.all([
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: hiddenFormulaContractName,
          functionName: 'get-total-games',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        }),
        fetchCallReadOnlyFunction({
          contractAddress,
          contractName: hiddenFormulaContractName,
          functionName: 'get-game-info',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        }),
      ]);

      const totalData = cvToJSON(totalResult);
      const gameInfoData = cvToJSON(gameInfoResult);
      const value = gameInfoData.value?.value || gameInfoData.value;

      setInfo({
        totalGames: parseInt(String(totalData.value || '0')),
        maxInput: parseInt(String(value?.['max-input']?.value ?? value?.['max-input'] ?? '20')),
        maxAttempts: parseInt(String(value?.['max-attempts']?.value ?? value?.['max-attempts'] ?? '12')),
      });
    } catch (err) {
      console.error('Erro ao buscar estatísticas Hidden Formula:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const handler = () => fetchStats();
    window.addEventListener('hidden-formula-refresh', handler);
    return () => window.removeEventListener('hidden-formula-refresh', handler);
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
          <p className="text-3xl font-bold text-teal-600">{info.totalGames}</p>
          <p className="text-sm text-gray-600">Total de Jogos</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-indigo-600">{info.maxAttempts}</p>
          <p className="text-sm text-gray-600">Tentativas por Jogo</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
        Entrada x: 0–{info.maxInput} • f(x) = ax² + bx + c
      </div>
    </div>
  );
}
