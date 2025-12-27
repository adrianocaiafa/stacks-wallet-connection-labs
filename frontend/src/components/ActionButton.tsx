import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { createNetwork } from '@stacks/network';
import { makeContractCall, broadcastTransaction, AnchorMode, stringAsciiCV, uintCV } from '@stacks/transactions';
import { contractAddress, contractName } from '../utils/contract';

interface ActionButtonProps {
  action: 'cast-spell' | 'upgrade' | 'claim-daily';
  label: string;
  fee: number;
  description: string;
  icon: string;
  onActionSelect?: (action: string | null) => void;
}

export function ActionButton({ action, label, fee, description, icon, onActionSelect }: ActionButtonProps) {
  const { isConnected, address } = useAppKit();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExecute = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSuccess(false);
    onActionSelect?.(action);

    try {
      const network = createNetwork('mainnet');
      const feeMicroStx = Math.floor(fee * 1000000);

      // Use the specific action function (cast-spell, upgrade, claim-daily)
      const functionName = action === 'cast-spell' ? 'cast-spell' : action === 'upgrade' ? 'upgrade' : 'claim-daily';

      const transaction = await makeContractCall({
        contractAddress,
        contractName: 'gas-meter', // TODO: Update with actual contract name
        functionName,
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
      // setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao executar ação. Tente novamente.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{label}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        <p className="text-lg font-bold text-blue-600 mb-4">{fee} STX</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
            <p className="text-red-800 text-xs">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
            <p className="text-green-800 text-xs">Ação executada com sucesso! 🎉</p>
          </div>
        )}

        <button
          onClick={handleExecute}
          disabled={isExecuting || !isConnected}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExecuting ? 'Executando...' : 'Executar'}
        </button>
      </div>
    </div>
  );
}

