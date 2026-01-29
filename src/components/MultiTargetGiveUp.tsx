import { useState } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { contractAddress, multiTargetContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

export function MultiTargetGiveUp({ onGiveUpSuccess }: { onGiveUpSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGiveUp = async () => {
    if (!isConnected || !address) {
      setError('Conecte sua carteira primeiro');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const network = createNetwork('mainnet');

      await openContractCall({
        contractAddress,
        contractName: multiTargetContractName,
        functionName: 'give-up',
        functionArgs: [],
        network,
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        onFinish: () => {
          if (onGiveUpSuccess) onGiveUpSuccess();
        },
        onCancel: () => {
          setIsExecuting(false);
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao desistir.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">Desistir do jogo atual e revelar os números?</p>
        <button
          onClick={handleGiveUp}
          disabled={isExecuting}
          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExecuting ? 'Enviando...' : 'Desistir'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
