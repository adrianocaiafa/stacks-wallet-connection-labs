import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, raffleContractName } from '../utils/contract';

interface RoundStatus {
  round: number;
  isOpen: boolean;
  totalTickets: number;
  participantCount: number;
  winner: string | null;
}

export function RaffleStatus() {
  const [status, setStatus] = useState<RoundStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        const network = createNetwork('mainnet');

        const statusResult = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName: raffleContractName,
          functionName: 'get-round-status',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });

        const statusData = cvToJSON(statusResult);
        const value = statusData.value || statusData;

        setStatus({
          round: parseInt(value.round?.value || '0'),
          isOpen: value['is-open']?.value === true || value.isOpen === true,
          totalTickets: parseInt(value['total-tickets']?.value || value.totalTickets?.value || '0'),
          participantCount: parseInt(value['participant-count']?.value || value.participantCount?.value || '0'),
          winner: value.winner?.value || null,
        });
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar status do round');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Atualiza a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando status...</div>
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

  if (!status) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Status do Round</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{status.round}</p>
          <p className="text-sm text-gray-600">Round</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{status.totalTickets}</p>
          <p className="text-sm text-gray-600">Tickets</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{status.participantCount}</p>
          <p className="text-sm text-gray-600">Participantes</p>
        </div>
        <div className="text-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            status.isOpen 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {status.isOpen ? 'Aberto' : 'Fechado'}
          </span>
        </div>
      </div>

      {status.winner && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Vencedor do Round {status.round}:</p>
          <p className="font-semibold text-gray-900">
            {status.winner.slice(0, 8)}...{status.winner.slice(-6)}
          </p>
        </div>
      )}
    </div>
  );
}

