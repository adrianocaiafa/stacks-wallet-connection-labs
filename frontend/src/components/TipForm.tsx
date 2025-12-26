import { useState } from 'react';
import { useWalletKit } from '../hooks/useWalletKit';
import { createNetwork } from '@stacks/network';
import { makeContractCall, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { contractAddress, contractName } from '../utils/contract';

interface TipFormProps {
  recipientAddress: string;
}

export function TipForm({ recipientAddress }: TipFormProps) {
  const { sessions } = useWalletKit();
  const currentSession = sessions[0];
  const isSignedIn = !!currentSession;
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !userData) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const amountMicroStx = Math.floor(parseFloat(amount) * 1000000);
      
      if (amountMicroStx <= 0 || isNaN(amountMicroStx)) {
        setError('O valor deve ser maior que zero');
        setIsSubmitting(false);
        return;
      }

      if (!recipientAddress || !recipientAddress.startsWith('SP') && !recipientAddress.startsWith('ST')) {
        setError('Endereço inválido. Deve começar com SP ou ST');
        setIsSubmitting(false);
        return;
      }

      const memoOption = memo.trim() ? memo.trim() : null;

      // Use testnet for development, change to 'mainnet' for production
      const network = createNetwork('testnet');

      // Note: For WalletKit, we need to handle session requests
      // The wallet will sign the transaction via WalletConnect protocol
      if (!currentSession) {
        throw new Error('Carteira não conectada. Por favor, conecte sua carteira primeiro.');
      }

      // For now, we'll show a message that transaction signing needs to be implemented
      // In production, you would use the WalletKit session to request transaction signing
      setError('Assinatura de transação via WalletKit será implementada. Por enquanto, use uma carteira Stacks diretamente.');
      setIsSubmitting(false);
      return;

      // TODO: Implement transaction signing via WalletKit session_request
      // const txOptions = {
      //   contractAddress,
      //   contractName,
      //   functionName: 'tip',
      //   functionArgs: [
      //     recipientAddress,
      //     amountMicroStx,
      //     memoOption,
      //   ],
      //   network,
      //   anchorMode: AnchorMode.Any,
      //   fee: 1000,
      // };

      if (broadcastResponse.error) {
        throw new Error(broadcastResponse.error);
      }

      setSuccess(true);
      setAmount('');
      setMemo('');
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar tip. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Enviar Tip</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor (STX)
          </label>
          <input
            type="number"
            step="0.000001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Memo (opcional, máx. 140 caracteres)
          </label>
          <textarea
            value={memo}
            onChange={(e) => {
              if (e.target.value.length <= 140) {
                setMemo(e.target.value);
              }
            }}
            maxLength={140}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Deixe uma mensagem..."
          />
          <p className="text-sm text-gray-500 mt-1">{memo.length}/140</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm">Tip enviado com sucesso! 🎉</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !amount}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Tip'}
        </button>
      </form>
    </div>
  );
}

