import { useState } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { contractAddress, mastermindContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

export function MastermindGiveUp({ onGiveUpSuccess }: { onGiveUpSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleGiveUp = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const network = createNetwork('mainnet');

      await openContractCall({
        contractAddress,
        contractName: mastermindContractName,
        functionName: 'give-up',
        functionArgs: [],
        network,
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        onFinish: () => {
          setShowConfirm(false);
          if (onGiveUpSuccess) onGiveUpSuccess();
          setIsExecuting(false);
        },
        onCancel: () => {
          setIsExecuting(false);
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao desistir.');
      setShowConfirm(false);
      setIsExecuting(false);
    }
  };

  if (!isConnected) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">🏳️ Desistir</h3>
        <p className="text-gray-600 text-sm mb-4">
          Encerrar o jogo atual e revelar o código. Conta como derrota.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {showConfirm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-800 text-sm font-semibold">Tem certeza? O jogo será encerrado e o código revelado.</p>
        </div>
      )}

      <button
        onClick={handleGiveUp}
        disabled={isExecuting}
        className={`w-full px-4 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg ${
          showConfirm ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
      >
        {isExecuting ? 'Processando...' : showConfirm ? 'Confirmar Desistência' : 'Desistir do Jogo 🏳️'}
      </button>

      {showConfirm && (
        <button
          onClick={() => {
            setShowConfirm(false);
            setError(null);
          }}
          className="w-full mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-semibold"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
