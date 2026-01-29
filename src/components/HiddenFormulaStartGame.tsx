import { useState } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { contractAddress, hiddenFormulaContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

export function HiddenFormulaStartGame({ onStartSuccess }: { onStartSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleStartGame = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }
    setIsExecuting(true);
    setError(null);
    setSuccess(false);
    try {
      const network = createNetwork('mainnet');
      await openContractCall({
        contractAddress,
        contractName: hiddenFormulaContractName,
        functionName: 'start-game',
        functionArgs: [],
        network,
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        onFinish: () => {
          setSuccess(true);
          if (onStartSuccess) onStartSuccess();
        },
        onCancel: () => {
          setIsExecuting(false);
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar jogo.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para iniciar um jogo</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Iniciar Novo Jogo</h3>
        <p className="text-gray-600 text-sm mb-4">
          f(x) = ax² + bx + c. Teste entradas para deduzir a, b e c. 12 tentativas, sem taxas.
        </p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-800 text-sm font-semibold">Jogo iniciado! Teste um valor de x.</p>
        </div>
      )}
      <button
        onClick={handleStartGame}
        disabled={isExecuting}
        className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-indigo-500 text-white rounded-lg hover:from-teal-600 hover:to-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
      >
        {isExecuting ? 'Iniciando...' : 'Iniciar Novo Jogo'}
      </button>
    </div>
  );
}
