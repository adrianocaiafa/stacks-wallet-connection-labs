import { useState } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { uintCV } from '@stacks/transactions';
import { contractAddress, hiddenFormulaContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

export function HiddenFormulaSubmitFormula({ onSubmitSuccess }: { onSubmitSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [guessA, setGuessA] = useState(0);
  const [guessB, setGuessB] = useState(0);
  const [guessC, setGuessC] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      setError('Conecte sua carteira primeiro');
      return;
    }
    setIsExecuting(true);
    setError(null);
    setMessage(null);
    try {
      const network = createNetwork('mainnet');
      await openContractCall({
        contractAddress,
        contractName: hiddenFormulaContractName,
        functionName: 'submit-formula',
        functionArgs: [uintCV(guessA), uintCV(guessB), uintCV(guessC)],
        network,
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        onFinish: () => {
          setMessage('Palpite enviado. Verifique o resultado na transação.');
          if (onSubmitSuccess) onSubmitSuccess();
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
        <p className="text-center text-gray-500">Conecte sua carteira para enviar palpite</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Enviar Fórmula</h3>
        <p className="text-gray-600 text-sm mb-4">
          Palpite: f(x) = ax² + bx + c. a: 0–3, b: 0–5, c: 0–10.
        </p>
      </div>
      <div className="flex gap-2 items-center justify-center mb-4 flex-wrap">
        <label className="text-sm font-medium text-gray-700">a</label>
        <input
          type="number"
          min={0}
          max={3}
          value={guessA}
          onChange={(e) => setGuessA(Number(e.target.value))}
          className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-center"
        />
        <label className="text-sm font-medium text-gray-700">b</label>
        <input
          type="number"
          min={0}
          max={5}
          value={guessB}
          onChange={(e) => setGuessB(Number(e.target.value))}
          className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-center"
        />
        <label className="text-sm font-medium text-gray-700">c</label>
        <input
          type="number"
          min={0}
          max={10}
          value={guessC}
          onChange={(e) => setGuessC(Number(e.target.value))}
          className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-center"
        />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-lg border bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">{message}</p>
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={isExecuting}
        className="w-full px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {isExecuting ? 'Enviando...' : 'Enviar Palpite (a, b, c)'}
      </button>
    </div>
  );
}
