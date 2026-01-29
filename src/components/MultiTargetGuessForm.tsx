import { useState } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { listCV, uintCV } from '@stacks/transactions';
import { contractAddress, multiTargetContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

const MIN = 0;
const MAX = 100;

export function MultiTargetGuessForm({ onGuessSuccess }: { onGuessSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [numbers, setNumbers] = useState<[number, number, number]>([0, 0, 0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setNum = (index: 0 | 1 | 2, value: number) => {
    const v = Math.max(MIN, Math.min(MAX, value));
    setNumbers((prev) => {
      const next = [...prev] as [number, number, number];
      next[index] = v;
      return next;
    });
  };

  const handleGuess = async () => {
    if (!isConnected || !address) {
      setError('Conecte sua carteira primeiro');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const network = createNetwork('mainnet');
      const numbersCV = listCV([uintCV(numbers[0]), uintCV(numbers[1]), uintCV(numbers[2])]);

      await openContractCall({
        contractAddress,
        contractName: multiTargetContractName,
        functionName: 'guess',
        functionArgs: [numbersCV],
        network,
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        onFinish: () => {
          if (onGuessSuccess) onGuessSuccess();
        },
        onCancel: () => {
          setIsExecuting(false);
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar palpite.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para jogar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Fazer palpite</h3>
      <p className="text-sm text-gray-600 mb-4">
        Digite 3 números (0–100). O contrato informa quantos estão exatos (valor + posição).
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        {([0, 1, 2] as const).map((i) => (
          <div key={i} className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Nº {i + 1}</label>
            <input
              type="number"
              min={MIN}
              max={MAX}
              value={numbers[i]}
              onChange={(e) => setNum(i, parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Soma: <strong>{numbers[0] + numbers[1] + numbers[2]}</strong>
      </p>

      <button
        onClick={handleGuess}
        disabled={isExecuting}
        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-amber-500 text-white rounded-lg hover:from-indigo-600 hover:to-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {isExecuting ? 'Enviando...' : 'Enviar palpite'}
      </button>
    </div>
  );
}
