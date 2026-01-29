import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { makeContractCall, AnchorMode } from '@stacks/transactions';
import { contractAddress, questSystemContractName } from '../utils/contract';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions';

interface QuestCardProps {
  questType: 'daily' | 'weekly' | 'special';
  title: string;
  description: string;
  fee: number;
  points: number;
  icon: string;
}

export function QuestCard({ questType, title, description, fee, points, icon }: QuestCardProps) {
  const { isConnected, address } = useStacksWallet();
  const [canComplete, setCanComplete] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkCooldown = async () => {
      if (!isConnected || !address) {
        setCanComplete(false);
        return;
      }

      setLoading(true);
      try {
        const network = createNetwork('mainnet');
        const functionName = questType === 'daily' 
          ? 'can-complete-daily-quest'
          : questType === 'weekly'
          ? 'can-complete-weekly-quest'
          : null;

        if (!functionName) {
          // Special quests have no cooldown
          setCanComplete(true);
          setLoading(false);
          return;
        }

        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName: questSystemContractName,
          functionName,
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        });

        const data = cvToJSON(result);
        setCanComplete(data.value === true || data.value === 'true');
      } catch (err) {
        console.error('Erro ao verificar cooldown:', err);
        setCanComplete(true); // Default to true on error
      } finally {
        setLoading(false);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 10000);
    return () => clearInterval(interval);
  }, [isConnected, address, questType]);

  const handleCompleteQuest = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    if (!canComplete && questType !== 'special') {
      setError('Esta quest está em cooldown. Tente novamente mais tarde.');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSuccess(false);

    try {
      const network = createNetwork('mainnet');
      const feeMicroStx = Math.floor(fee * 1000000);

      const functionName = questType === 'daily'
        ? 'complete-daily-quest'
        : questType === 'weekly'
        ? 'complete-weekly-quest'
        : 'complete-special-quest';

      const transaction = await makeContractCall({
        contractAddress,
        contractName: questSystemContractName,
        functionName,
        functionArgs: [],
        senderKey: address,
        network,
        anchorMode: AnchorMode.Any,
        fee: 1000,
      });

      // TODO: Implementar assinatura via AppKit
      setError('Assinatura de transação via AppKit será implementada. Por enquanto, o envio direto não está ativo.');
      setIsExecuting(false);
      return;
    } catch (err: any) {
      setError(err.message || 'Erro ao completar quest. Tente novamente.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        
        <div className="flex justify-center gap-4 mb-4">
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">{fee} STX</p>
            <p className="text-xs text-gray-500">Taxa</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{points} pts</p>
            <p className="text-xs text-gray-500">Pontos</p>
          </div>
        </div>

        {questType !== 'special' && (
          <div className="mb-4">
            {loading ? (
              <p className="text-xs text-gray-500">Verificando cooldown...</p>
            ) : canComplete ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Disponível
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⏳ Em cooldown
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
            <p className="text-red-800 text-xs">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
            <p className="text-green-800 text-xs">Quest completada com sucesso! 🎉</p>
          </div>
        )}

        <button
          onClick={handleCompleteQuest}
          disabled={isExecuting || !isConnected || (!canComplete && questType !== 'special')}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isExecuting ? 'Completando...' : 'Completar Quest'}
        </button>

        {!isConnected && (
          <p className="mt-2 text-xs text-gray-500">Conecte sua carteira para completar</p>
        )}
      </div>
    </div>
  );
}

