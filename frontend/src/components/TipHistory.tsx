import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, contractName } from '../utils/contract';

interface TipHistoryProps {
  recipientAddress: string;
}

interface Tip {
  id: number;
  sender: string;
  amount: number;
  memo?: string;
  timestamp: number;
}

export function TipHistory({ recipientAddress }: TipHistoryProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recipientAddress) {
      setTips([]);
      return;
    }

    const fetchTips = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get tip counter first
        // Use testnet for development, change to 'mainnet' for production
        const network = createNetwork('testnet');
        
        const counterResult = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-tip-counter',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });

        const counter = cvToJSON(counterResult.result || counterResult);
        const totalTips = parseInt(counter.value || '0');

        // Fetch tips (limited to last 10 for performance)
        const tipsToFetch = Math.min(totalTips, 10);
        const fetchedTips: Tip[] = [];

        for (let i = 0; i < tipsToFetch; i++) {
          try {
            const tipId = totalTips - 1 - i; // Start from most recent
            const tipResult = await fetchCallReadOnlyFunction({
              contractAddress,
              contractName,
              functionName: 'get-tip-received',
              functionArgs: [recipientAddress, tipId],
              network,
              senderAddress: contractAddress,
            });

            const tipData = cvToJSON(tipResult.result || tipResult);
            
            if (tipData.value) {
              fetchedTips.push({
                id: tipId,
                sender: tipData.value.sender?.value || '',
                amount: parseInt(tipData.value.amount?.value || '0') / 1000000,
                memo: tipData.value.memo?.value || undefined,
                timestamp: parseInt(tipData.value.timestamp?.value || '0'),
              });
            }
          } catch (err) {
            // Skip if tip doesn't exist for this recipient
            continue;
          }
        }

        setTips(fetchedTips);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar histórico');
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
  }, [recipientAddress]);

  if (!recipientAddress) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        Digite um endereço para ver o histórico
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando histórico...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {tips.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          Nenhum tip encontrado para este endereço
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {tips.map((tip) => (
            <div key={tip.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-900">
                    {tip.sender.slice(0, 6)}...{tip.sender.slice(-4)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(tip.timestamp * 1000).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-semibold text-green-600">
                  {tip.amount.toFixed(6)} STX
                </p>
              </div>
              {tip.memo && (
                <p className="text-sm text-gray-600 mt-2 italic">"{tip.memo}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

