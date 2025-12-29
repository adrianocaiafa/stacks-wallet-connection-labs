import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, votingSystemContractName } from '../utils/contract';
import { PollCard } from './PollCard';

export function PollHistory() {
  const [polls, setPolls] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);

  useEffect(() => {
    const fetchPollCount = async () => {
      setLoading(true);
      try {
        const network = createNetwork('mainnet');

        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName: votingSystemContractName,
          functionName: 'get-poll-count',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });

        const data = cvToJSON(result);
        const pollCount = parseInt(String(data.value || '0'));

        // Fetch all polls (limit to last 10 for performance)
        const pollIds: number[] = [];
        const startId = Math.max(0, pollCount - 10);
        
        for (let i = startId; i < pollCount; i++) {
          pollIds.push(i);
        }

        setPolls(pollIds.reverse()); // Most recent first
      } catch (err: any) {
        console.error('Erro ao buscar histórico de enquetes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPollCount();
    const interval = setInterval(fetchPollCount, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading && polls.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando histórico...</div>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">📜 Histórico de Enquetes</h3>
        <p className="text-gray-600">Nenhuma enquete ainda.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">📜 Histórico de Enquetes</h3>
        <p className="text-sm text-gray-500 mt-1">Últimas 10 enquetes</p>
      </div>
      <div className="divide-y divide-gray-200">
        {polls.map((pollId) => (
          <div key={pollId} className="p-4 hover:bg-gray-50">
            <button
              onClick={() => setSelectedPollId(selectedPollId === pollId ? null : pollId)}
              className="w-full text-left flex justify-between items-center"
            >
              <span className="font-medium text-gray-900">Enquete #{pollId}</span>
              <span className="text-sm text-gray-500">
                {selectedPollId === pollId ? '▼' : '▶'}
              </span>
            </button>
            {selectedPollId === pollId && (
              <div className="mt-4">
                <PollCard pollId={pollId} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

