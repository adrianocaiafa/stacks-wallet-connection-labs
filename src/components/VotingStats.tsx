import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, votingSystemContractName } from '../utils/contract';

export function VotingStats() {
  const [stats, setStats] = useState<{ totalPolls: number; activePollId: number | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        setIsRefreshing(false);
      }
    };

  useEffect(() => {
    fetchStats();
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">📊 Estatísticas</h3>
        <button
          onClick={() => {
            setIsRefreshing(true);
            fetchStats();
          }}
          disabled={isRefreshing || loading}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {isRefreshing ? '🔄' : '↻'} {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>
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

