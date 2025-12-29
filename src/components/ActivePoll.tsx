import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, votingSystemContractName } from '../utils/contract';
import { PollCard } from './PollCard';

export function ActivePoll() {
  const [activePollId, setActivePollId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
      }
    };

    fetchActivePoll();
    const interval = setInterval(fetchActivePoll, 15000); // Atualiza a cada 15 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando enquete ativa...</div>
      </div>
    );
  }

  if (activePollId === null) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">📊 Enquete Ativa</h3>
        <p className="text-gray-600">Nenhuma enquete ativa no momento.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Enquete Ativa</h3>
      <PollCard pollId={activePollId} />
    </div>
  );
}

