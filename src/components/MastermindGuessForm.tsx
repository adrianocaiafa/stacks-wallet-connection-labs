import { useState } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { listCV, uintCV } from '@stacks/transactions';
import { contractAddress, mastermindContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

const CHOICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function MastermindGuessForm({ onGuessSuccess }: { onGuessSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [code, setCode] = useState<number[]>([0, 0, 0, 0, 0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDigit = (index: number, value: number) => {
    const next = [...code];
    next[index] = value;
    setCode(next);
    setError(null);
  };

  const handleGuess = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const network = createNetwork('mainnet');
      const codeCV = listCV([
        uintCV(code[0]),
        uintCV(code[1]),
        uintCV(code[2]),
        uintCV(code[3]),
        uintCV(code[4]),
      ]);

      await openContractCall({
        contractAddress,
        contractName: mastermindContractName,
        functionName: 'guess',
        functionArgs: [codeCV],
        network,
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        onFinish: () => {
          if (onGuessSuccess) onGuessSuccess();
          setIsExecuting(false);
        },
        onCancel: () => {
          setIsExecuting(false);
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar tentativa.');
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
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Sua Tentativa</h3>
        <p className="text-gray-600 text-sm mb-4">
          Escolha 5 digitos (0-9). Exatas = posicao certa, parciais = digito certo em outra posicao.
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-4 flex-wrap">
        {code.map((d, i) => (
          <select
            key={i}
            value={d}
            onChange={(e) => setDigit(i, parseInt(e.target.value, 10))}
            disabled={isExecuting}
            className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
          >
            {CHOICES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleGuess}
        disabled={isExecuting}
        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-amber-500 text-white rounded-lg hover:from-indigo-600 hover:to-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
      >
        {isExecuting ? 'Enviando...' : 'Enviar Tentativa'}
      </button>
    </div>
  );
}
