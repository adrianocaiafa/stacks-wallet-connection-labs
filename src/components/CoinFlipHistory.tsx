import { useState, useEffect } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { standardPrincipalCV, uintCV } from '@stacks/transactions';
import { contractAddress, coinFlipContractName } from '../utils/contract';

interface FlipHistoryEntry {
  userChoice: number;
  coinResult: number;
  won: boolean;
  points: number;
  timestamp: number;
}

export function CoinFlipHistory() {
  const { isConnected, address } = useAppKit();
  const [history, setHistory] = useState<FlipHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [flipCount, setFlipCount] = useState<number>(0);

  const fetchHistory = async () => {
    if (!isConnected || !address) {
      setHistory([]);
      return;
    }

    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      // Get user flip count
      const countResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: coinFlipContractName,
        functionName: 'get-user-flip-count',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const countData = cvToJSON(countResult);
      const totalFlips = parseInt(String(countData.value || '0'));
      setFlipCount(totalFlips);

      if (totalFlips === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      // Fetch last 20 flips
      const flipsToFetch = Math.min(20, totalFlips);
      const historyEntries: FlipHistoryEntry[] = [];

      for (let i = totalFlips - 1; i >= Math.max(0, totalFlips - flipsToFetch); i--) {
        try {
          const flipResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: coinFlipContractName,
            functionName: 'get-user-flip',
            functionArgs: [standardPrincipalCV(address), uintCV(i)],
            network,
            senderAddress: contractAddress,
          });

          const flipData = cvToJSON(flipResult);

          if (flipData.value && typeof flipData.value === 'object' && 'value' in flipData.value) {
            const flipValue = flipData.value.value;
            historyEntries.push({
              userChoice: parseInt(String(flipValue['user-choice']?.value || '0')),
              coinResult: parseInt(String(flipValue['coin-result']?.value || '0')),
              won: flipValue.won?.value === true,
              points: parseInt(String(flipValue.points?.value || '0')),
              timestamp: parseInt(String(flipValue.timestamp?.value || '0')),
            });
          }

          // Small delay to avoid rate limiting
          if (i > Math.max(0, totalFlips - flipsToFetch)) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (err) {
          console.error(`Erro ao buscar flip ${i}:`, err);
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
        <h3 className="text-xl font-semibold text-gray-900">Histórico de Jogadas</h3>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
        >
          {loading ? '🔄 Carregando...' : '🔄 Atualizar'}
        </button>
      </div>

      {loading && history.length === 0 ? (
        <div className="text-center text-gray-500 py-8">Carregando histórico...</div>
      ) : history.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Nenhuma jogada ainda. Comece a jogar!
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((entry, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                entry.won
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {entry.userChoice === 0 ? '👤' : '🪙'}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">
                      {entry.userChoice === 0 ? 'Cara' : 'Coroa'} →{' '}
                      {entry.coinResult === 0 ? 'Cara' : 'Coroa'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Jogada #{flipCount - index}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {entry.won ? (
                    <div>
                      <p className="text-green-700 font-bold">✓ Ganhou</p>
                      <p className="text-green-600 text-sm">+{entry.points} pontos</p>
                    </div>
                  ) : (
                    <p className="text-red-700 font-bold">✗ Perdeu</p>
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
