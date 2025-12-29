import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, votingSystemContractName } from '../utils/contract';

export function VotingStats() {
  const [stats, setStats] = useState<{ totalPolls: number; activePollId: number | null } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const network = createNetwork('mainnet');

        const [pollCountResult, activePollResult] = await Promise.all([
          fetchCallReadOnlyFunction({
            contractAddress,
            contractName: votingSystemContractName,
            functionName: 'get-poll-count',
            functionArgs: [],
            network,
            senderAddress: contractAddress,
          }),
          fetchCallReadOnlyFunction({
            contractAddress,
            contractName: votingSystemContractName,
            functionName: 'get-active-poll-id',
            functionArgs: [],
            network,
            senderAddress: contractAddress,
          }),
        ]);

        const pollCountData = cvToJSON(pollCountResult);
        const activePollData = cvToJSON(activePollResult);

        const totalPolls = parseInt(String(pollCountData.value || '0'));
        let activePollId: number | null = null;

        if (activePollData.type !== 'none' && activePollData.value !== undefined) {
          const pollIdValue = activePollData.value.value !== undefined ? activePollData.value.value : activePollData.value;
          activePollId = parseInt(String(pollIdValue || '0'));
        }

        setStats({ totalPolls, activePollId });
      } catch (err: any) {
        console.error('Erro ao buscar estatísticas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 20000); // Atualiza a cada 20 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando estatísticas...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Estatísticas</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.totalPolls}</p>
          <p className="text-sm text-gray-600">Total de Enquetes</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">
            {stats.activePollId !== null ? '✓' : '—'}
          </p>
          <p className="text-sm text-gray-600">Enquete Ativa</p>
        </div>
      </div>
    </div>
  );
}

