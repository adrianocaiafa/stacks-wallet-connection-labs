import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, votingSystemContractName } from '../utils/contract';
import { PollCard } from './PollCard';

export function ActivePolls() {
  const [activePollIds, setActivePollIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActivePolls = async () => {
    setLoading(true);
    try {
      const network = createNetwork('mainnet');

      // Get total poll count
      const pollCountResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: votingSystemContractName,
        functionName: 'get-poll-count',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      });

      const pollCountData = cvToJSON(pollCountResult);
      const pollCount = parseInt(String(pollCountData.value || '0'));

      if (pollCount === 0) {
        setActivePollIds([]);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Check last 50 polls to find open ones (for performance)
      const activePolls: number[] = [];
      const checkLimit = Math.min(pollCount, 50);
      const startId = Math.max(0, pollCount - checkLimit);
      
      // Fetch polls from most recent to oldest
      // Fetch polls sequentially with delay to avoid rate limiting
      for (let i = pollCount - 1; i >= startId; i--) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Delay between requests
          
          const pollResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: votingSystemContractName,
            functionName: 'get-poll',
            functionArgs: [uintCV(i)],
            network,
            senderAddress: contractAddress,
          });

          const pollData = cvToJSON(pollResult);
          
          if (pollData.type !== 'none' && pollData.value) {
            const value = pollData.value.value || pollData.value;
            const isOpen = value['is-open']?.value !== false && value.isOpen !== false;
            
            if (isOpen) {
              activePolls.push(i);
            }
          }
        } catch (err) {
          // Continue if one poll fails
          continue;
        }
      }

      setActivePollIds(activePolls); // Already in reverse order (most recent first)
    } catch (err: any) {
      console.error('Erro ao buscar enquetes ativas:', err);
      setActivePollIds([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivePolls();
  }, []);

  if (loading && activePollIds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando enquetes ativas...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          📊 Enquetes Ativas {activePollIds.length > 0 && `(${activePollIds.length})`}
        </h3>
        <button
          onClick={() => {
            setIsRefreshing(true);
            fetchActivePolls();
          }}
          disabled={isRefreshing || loading}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {isRefreshing ? '🔄' : '↻'} {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>
      
      {activePollIds.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <p className="text-gray-600">Nenhuma enquete ativa no momento.</p>
          <p className="text-sm text-gray-500 mt-2">
            Verificando as últimas 50 enquetes. Se houver mais enquetes abertas, elas podem não aparecer aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activePollIds.map((pollId) => (
            <div key={pollId}>
              <div className="mb-2 text-sm text-gray-500 font-medium">Enquete #{pollId}</div>
              <PollCard pollId={pollId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

