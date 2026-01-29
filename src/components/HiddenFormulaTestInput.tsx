import { useState } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { uintCV } from '@stacks/transactions';
import { contractAddress, hiddenFormulaContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

const MAX_INPUT = 20;

export function HiddenFormulaTestInput({ onTestSuccess }: { onTestSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [x, setX] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ input: number; output: number; attemptsLeft: number } | null>(null);

  const handleTest = async () => {
    if (!isConnected || !address) {
      setError('Conecte sua carteira primeiro');
      return;
    }
    if (x < 0 || x > MAX_INPUT) {
      setError(`Entrada deve ser entre 0 e ${MAX_INPUT}`);
      return;
    }
    setIsExecuting(true);
    setError(null);
    setLastResult(null);
    try {
      const network = createNetwork('mainnet');
      await openContractCall({
        contractAddress,
        contractName: hiddenFormulaContractName,
        functionName: 'test-input',
        functionArgs: [uintCV(x)],
        network,
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        onFinish: () => {
          setLastResult({ input: x, output: 0, attemptsLeft: 0 });
          if (onTestSuccess) onTestSuccess();
        },
        onCancel: () => {
          setIsExecuting(false);
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao testar entrada.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para testar entradas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Testar Entrada</h3>
        <p className="text-gray-600 text-sm mb-4">
          Digite um valor x (0–{MAX_INPUT}) e veja o resultado f(x). Usa uma tentativa.
        </p>
      </div>
      <div className="flex gap-3 items-center mb-4">
        <label className="text-sm font-medium text-gray-700">x =</label>
        <input
          type="number"
          min={0}
          max={MAX_INPUT}
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <button
          onClick={handleTest}
          disabled={isExecuting}
          className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isExecuting ? 'Enviando...' : 'Testar f(x)'}
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {lastResult && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
          <p className="text-teal-800 text-sm">
            f({lastResult.input}) enviado. Atualize a página para ver o resultado e tentativas restantes.
          </p>
        </div>
      )}
    </div>
  );
}
