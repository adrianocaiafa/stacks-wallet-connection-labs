import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { createNetwork } from '@stacks/network';
import { makeContractCall, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { contractAddress, numberGuessZenContractName } from '../utils/contract';

export function StartGameButton({ onStartSuccess }: { onStartSuccess?: () => void }) {
  const { isConnected, address } = useAppKit();
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

      const transaction = await makeContractCall({
        contractAddress,
        contractName: numberGuessZenContractName,
        functionName: 'start-game',
        functionArgs: [],
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

      // setSuccess(true);
      // if (onStartSuccess) {
      //   setTimeout(() => {
      //     onStartSuccess();
      //     setSuccess(false);
      //   }, 2000);
      // }
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar jogo. Tente novamente.');
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">🎮 Iniciar Novo Jogo</h3>
        <p className="text-gray-600 text-sm mb-4">
          Comece um novo jogo e tente adivinhar o número secreto entre 0 e 1000!
        </p>
        <p className="text-sm text-green-600 font-semibold mb-4">
          ✅ Sem custo, apenas gas da transação
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-800 text-sm font-semibold">🎉 Jogo iniciado com sucesso!</p>
        </div>
      )}

      <button
        onClick={handleStartGame}
        disabled={isExecuting}
        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
      >
        {isExecuting ? 'Iniciando...' : 'Iniciar Novo Jogo 🎮'}
      </button>
    </div>
  );
}
