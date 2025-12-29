import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, votingSystemContractName } from '../utils/contract';
import { PollCard } from './PollCard';

export function ActivePoll() {
  const [activePollId, setActivePollId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActivePoll = async () => {
      setLoading(true);
      try {
        const network = createNetwork('mainnet');

        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName: votingSystemContractName,
          functionName: 'get-active-poll-id',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });

        const data = cvToJSON(result);

        if (data.type !== 'none' && data.value !== undefined) {
          const pollIdValue = data.value.value !== undefined ? data.value.value : data.value;
          setActivePollId(parseInt(String(pollIdValue || '0')));
        } else {
          setActivePollId(null);
        }
      } catch (err: any) {
        console.error('Erro ao buscar poll ativa:', err);
        setActivePollId(null);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

  useEffect(() => {
    fetchActivePoll();
  }, []);

  if (loading && activePollId === null) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando enquete ativa...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">📊 Enquete Ativa</h3>
        <button
          onClick={() => {
            setIsRefreshing(true);
            fetchActivePoll();
          }}
          disabled={isRefreshing || loading}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {isRefreshing ? '🔄' : '↻'} {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>
      {activePollId === null ? (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <p className="text-gray-600">Nenhuma enquete ativa no momento.</p>
        </div>
      ) : (
        <PollCard pollId={activePollId} />
      )}
    </div>
  );
}

