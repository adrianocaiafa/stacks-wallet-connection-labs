import { useState } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { makeContractCall, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { contractAddress, numberGuessZenContractName } from '../utils/contract';

export function GiveUpButton({ onGiveUpSuccess }: { onGiveUpSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    secretNumber: number;
    attemptsMade: number;
  } | null>(null);
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
    setResult(null);

    try {
      const network = createNetwork('mainnet');

      const transaction = await makeContractCall({
        contractAddress,
        contractName: numberGuessZenContractName,
        functionName: 'give-up',
        functionArgs: [],
        senderKey: address, // This will be replaced by wallet signing
        network,
        anchorMode: AnchorMode.Any,
        fee: 1000,
      });

      // TODO: Integrate with AppKit's signTransaction method
      setError('Assinatura de transação via AppKit será implementada. Por enquanto, o envio direto não está ativo.');
      setIsExecuting(false);
      setShowConfirm(false);
      return;

      // const signedTx = await signTransaction(transaction);
      // const broadcastResponse = await broadcastTransaction(signedTx, network);

      // if (broadcastResponse.error) {
      //   throw new Error(broadcastResponse.error);
      // }

      // // Parse result
      // const result = broadcastResponse.result;
      // setResult({
      //   secretNumber: result['secret-number'],
      //   attemptsMade: result['attempts-made'],
      // });

      // if (onGiveUpSuccess) {
      //   setTimeout(() => {
      //     onGiveUpSuccess();
      //     setShowConfirm(false);
      //   }, 3000);
      // }
    } catch (err: any) {
      setError(err.message || 'Erro ao desistir. Tente novamente.');
      setShowConfirm(false);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">🏳️ Desistir</h3>
        <p className="text-gray-600 text-sm mb-4">
          Desista do jogo atual e revele o número secreto. Sua sequência será resetada.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <p className="font-semibold text-orange-800 mb-2">🏳️ Jogo Finalizado</p>
          <div className="text-sm space-y-1 text-orange-700">
            <p>Número secreto era: <span className="font-bold text-lg">{result.secretNumber}</span></p>
            <p>Tentativas feitas: <span className="font-bold">{result.attemptsMade}</span></p>
          </div>
        </div>
      )}

      {showConfirm && !result && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-800 text-sm font-semibold">
            Tem certeza? Desistir resetará sua sequência de vitórias.
          </p>
        </div>
      )}

      <button
        onClick={handleGiveUp}
        disabled={isExecuting}
        className={`w-full px-4 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg ${
          showConfirm && !result
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
      >
        {isExecuting 
          ? 'Processando...' 
          : showConfirm && !result
          ? 'Confirmar Desistência'
          : 'Desistir do Jogo 🏳️'}
      </button>

      {showConfirm && !result && (
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
