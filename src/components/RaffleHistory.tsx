import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, raffleContractName } from '../utils/contract';

interface RoundHistory {
  round: number;
  winner: string;
  ticketCount: number;
  totalTickets: number;
}

export function RaffleHistory() {
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(1);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const network = createNetwork('mainnet');

        // Primeiro, obter o round atual
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
        const currentRoundNum = parseInt(value.round?.value || '1');
        setCurrentRound(currentRoundNum);

        // Buscar histórico de rounds anteriores (até 10 rounds)
        const historyItems: RoundHistory[] = [];
        const roundsToCheck = Math.min(currentRoundNum - 1, 10);

        for (let round = 1; round <= roundsToCheck; round++) {
          try {
            const historyResult = await fetchCallReadOnlyFunction({
              contractAddress,
              contractName: raffleContractName,
              functionName: 'get-round-history',
              functionArgs: [uintCV(round)],
              network,
              senderAddress: contractAddress,
            });

            const historyData = cvToJSON(historyResult);

            if (historyData.type !== 'none' && historyData.value) {
              const hValue = historyData.value.value || historyData.value;
              
              // Parse winner - can be principal type
              let winnerValue: string = '';
              if (hValue.winner) {
                if (typeof hValue.winner === 'string') {
                  winnerValue = hValue.winner;
                } else if (hValue.winner.value) {
                  const winnerData = hValue.winner.value;
                  winnerValue = typeof winnerData === 'string' ? winnerData : String(winnerData.value || winnerData);
                } else {
                  winnerValue = String(hValue.winner);
                }
              }
              
              historyItems.push({
                round,
                winner: winnerValue,
                ticketCount: parseInt(String(hValue['ticket-count']?.value || hValue.ticketCount?.value || hValue.ticketCount || '0')),
                totalTickets: parseInt(String(hValue['total-tickets']?.value || hValue.totalTickets?.value || hValue.totalTickets || '0')),
              });
            }
          } catch (err) {
            // Round pode não ter histórico ainda
            continue;
          }
        }

        // Ordenar por round (mais recente primeiro)
        historyItems.sort((a, b) => b.round - a.round);
        setHistory(historyItems);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar histórico');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    // Aumentar intervalo para reduzir carga no servidor
    const interval = setInterval(fetchHistory, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading && history.length === 0) {
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
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">Histórico de Rounds</h3>
        <p className="text-sm text-gray-500 mt-1">Round atual: {currentRound}</p>
      </div>

      {history.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p>Nenhum round finalizado ainda</p>
          <p className="text-sm mt-2">O histórico aparecerá aqui quando houver rounds concluídos</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {history.map((item) => (
            <div key={item.round} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-lg font-semibold text-gray-900">Round {item.round}</span>
                  <p className="text-sm text-gray-600 mt-1">
                    🏆 Vencedor: <span className="font-medium">
                      {item.winner && typeof item.winner === 'string' 
                        ? `${item.winner.slice(0, 8)}...${item.winner.slice(-6)}`
                        : 'N/A'}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{item.ticketCount} tickets</p>
                  <p className="text-xs text-gray-500">de {item.totalTickets} totais</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

