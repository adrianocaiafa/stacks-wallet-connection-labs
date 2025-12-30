import { useState, useEffect } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, diceGameContractName } from '../utils/contract';

interface RollHistoryEntry {
  rollId: number;
  userChoice: number;
  diceResult: number;
  won: boolean;
  points: number;
  timestamp: number;
}

export function DiceHistory() {
  const { isConnected, address } = useAppKit();
  const [history, setHistory] = useState<RollHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRolls, setTotalRolls] = useState(0);

  const fetchHistory = async () => {
    if (!isConnected || !address) {
      setHistory([]);
      return;
    }

    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      // Get user roll count
      const countResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: diceGameContractName,
        functionName: 'get-user-roll-count',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const countData = cvToJSON(countResult);
      const count = parseInt(String(countData.value || '0'));
      setTotalRolls(count);

      if (count === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      const historyEntries: RollHistoryEntry[] = [];

      // Fetch last 20 rolls (most recent first)
      const startIndex = Math.max(0, count - 20);
      for (let i = count - 1; i >= startIndex; i--) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Delay to avoid rate limiting

          const historyResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: diceGameContractName,
            functionName: 'get-user-roll',
            functionArgs: [standardPrincipalCV(address), uintCV(i)],
            network,
            senderAddress: contractAddress,
          });

          const historyData = cvToJSON(historyResult);

          if (historyData.type !== 'none' && historyData.value) {
            const value = historyData.value.value || historyData.value;
            historyEntries.push({
              rollId: i,
              userChoice: parseInt(String(value['user-choice']?.value || value.userChoice?.value || '0')),
              diceResult: parseInt(String(value['dice-result']?.value || value.diceResult?.value || '0')),
              won: value.won?.value !== undefined ? value.won.value : value.won === true,
              points: parseInt(String(value.points?.value || value.points || '0')),
              timestamp: parseInt(String(value.timestamp?.value || value.timestamp || '0')),
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
          <h3 className="text-xl font-semibold text-gray-900">Histórico de Rolagens</h3>
          <p className="text-sm text-gray-500 mt-1">
            Total: {totalRolls} rolagens
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
          Nenhuma rolagem ainda. Faça sua primeira rolagem!
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="divide-y divide-gray-200">
          {history.map((entry) => (
            <div key={entry.rollId} className="py-3 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${entry.won ? '🎉' : '😔'}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Rolagem #{entry.rollId + 1}
                    </p>
                    <p className="text-sm text-gray-500">
                      Escolha: <span className="font-semibold">{entry.userChoice}</span> • 
                      Resultado: <span className="font-semibold">{entry.diceResult}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {entry.won ? (
                    <p className="font-semibold text-green-600">+{entry.points} pontos</p>
                  ) : (
                    <p className="text-gray-400">Perdeu</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

