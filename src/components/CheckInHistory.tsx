import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, dailyCheckInContractName } from '../utils/contract';

interface CheckInHistoryEntry {
  checkInId: number;
  day: number;
  streak: number;
  points: number;
}

export function CheckInHistory() {
  const { isConnected, address } = useStacksWallet();
  const [history, setHistory] = useState<CheckInHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCheckIns, setTotalCheckIns] = useState(0);

  const fetchHistory = async () => {
    if (!isConnected || !address) {
      setHistory([]);
      return;
    }

    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      // Get total check-ins count
      const countResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: dailyCheckInContractName,
        functionName: 'get-user-check-in-count',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const countData = cvToJSON(countResult);
      const count = parseInt(String(countData.value || '0'));
      setTotalCheckIns(count);

      if (count === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      const historyEntries: CheckInHistoryEntry[] = [];

      // Fetch last 20 check-ins (most recent first)
      const startIndex = Math.max(0, count - 20);
      for (let i = count - 1; i >= startIndex; i--) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Delay to avoid rate limiting

          const historyResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: dailyCheckInContractName,
            functionName: 'get-user-check-in',
            functionArgs: [standardPrincipalCV(address), uintCV(i)],
            network,
            senderAddress: contractAddress,
          });

          const historyData = cvToJSON(historyResult);

          if (historyData.type !== 'none' && historyData.value) {
            const value = historyData.value.value || historyData.value;
            historyEntries.push({
              checkInId: i,
              day: parseInt(String(value.day?.value || value.day || '0')),
              streak: parseInt(String(value.streak?.value || value.streak || '0')),
              points: parseInt(String(value.points?.value || value.points || '0')),
            });
          }
        } catch (err) {
          continue;
        }
      }

      setHistory(historyEntries);
    } catch (err: any) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para ver seu histórico</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Histórico de Check-ins</h3>
          <p className="text-sm text-gray-500 mt-1">
            Total: {totalCheckIns} check-ins
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          🔄 Atualizar
        </button>
      </div>

      {loading && (
        <div className="text-center text-gray-500 py-8">Carregando histórico...</div>
      )}

      {!loading && history.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Nenhum check-in ainda. Faça seu primeiro check-in!
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="divide-y divide-gray-200">
          {history.map((entry) => (
            <div key={entry.checkInId} className="py-3 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">
                    Dia {entry.day} • Check-in #{entry.checkInId + 1}
                  </p>
                  <p className="text-sm text-gray-500">
                    Sequência: {entry.streak} dias
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">+{entry.points} pontos</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

