import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { createNetwork } from '@stacks/network';
import { makeContractCall, broadcastTransaction, AnchorMode, uintCV } from '@stacks/transactions';
import { contractAddress, numberGuessZenContractName } from '../utils/contract';

export function GuessForm({ onGuessSuccess }: { onGuessSuccess?: () => void }) {
  const { isConnected, address } = useAppKit();
  const [guess, setGuess] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    result: 'correct' | 'higher' | 'lower';
    attempts: number;
    message: string;
    number?: number;
  } | null>(null);

  const handleGuess = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    const guessNumber = parseInt(guess);
    if (isNaN(guessNumber) || guessNumber < 0 || guessNumber > 1000) {
      setError('Por favor, digite um número entre 0 e 1000');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setLastResult(null);

    try {
      const network = createNetwork('mainnet');

      const transaction = await makeContractCall({
        contractAddress,
        contractName: numberGuessZenContractName,
        functionName: 'guess',
        functionArgs: [uintCV(guessNumber)],
        senderKey: address, // This will be replaced by wallet signing
        network,
        anchorMode: AnchorMode.Any,
        fee: 1000,
      });

      // TODO: Integrate with AppKit's signTransaction method
      setError('Assinatura de transação via AppKit será implementada. Por enquanto, o envio direto não está ativo.');
      setIsExecuting(false);
      return;

      // const signedTx = await signTransaction(transaction);
      // const broadcastResponse = await broadcastTransaction(signedTx, network);

      // if (broadcastResponse.error) {
      //   throw new Error(broadcastResponse.error);
      // }

      // // Parse result
      // const result = broadcastResponse.result;
      // setLastResult({
      //   result: result.result,
      //   attempts: result.attempts,
      //   message: result.message,
      //   number: result.number,
      // });

      // if (result.result === 'correct') {
      //   setGuess('');
      //   if (onGuessSuccess) {
      //     setTimeout(() => {
      //       onGuessSuccess();
      //     }, 2000);
      //   }
      // }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer tentativa. Tente novamente.');
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
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">🎯 Fazer Tentativa</h3>
        <p className="text-gray-600 text-sm mb-4">
          Digite um número entre 0 e 1000. Sem custo, apenas gas!
        </p>
      </div>

      <div className="mb-4">
        <input
          type="number"
          min="0"
          max="1000"
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value);
            setError(null);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleGuess();
            }
          }}
          disabled={isExecuting}
          placeholder="Digite um número (0-1000)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-center text-lg font-semibold"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {lastResult && (
        <div className={`border rounded-lg p-4 mb-4 ${
          lastResult.result === 'correct' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`font-semibold mb-2 ${
            lastResult.result === 'correct' ? 'text-green-800' : 'text-blue-800'
          }`}>
            {lastResult.result === 'correct' ? '🎉 Parabéns! Você acertou!' : 
             lastResult.result === 'higher' ? '⬆️ Tente um número maior!' : 
             '⬇️ Tente um número menor!'}
          </p>
          <div className="text-sm space-y-1">
            <p>Tentativas: <span className="font-bold">{lastResult.attempts}</span></p>
            {lastResult.number !== undefined && (
              <p>Número secreto: <span className="font-bold">{lastResult.number}</span></p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleGuess}
        disabled={isExecuting || !guess}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
      >
        {isExecuting ? 'Processando...' : 'Fazer Tentativa 🎯'}
      </button>
    </div>
  );
}
