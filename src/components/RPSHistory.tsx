import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, rockPaperScissorsContractName } from '../utils/contract';

interface GameHistoryEntry {
  gameId: number;
  userChoice: number;
  contractChoice: number;
  result: string;
  points: number;
  timestamp: number;
}

const CHOICE_LABELS: { [key: number]: string } = {
  1: '🪨 Pedra',
  2: '📄 Papel',
  3: '✂️ Tesoura',
};

const RESULT_LABELS: { [key: string]: { text: string; color: string } } = {
  win: { text: 'Vitória', color: 'text-green-600' },
  loss: { text: 'Derrota', color: 'text-red-600' },
  draw: { text: 'Empate', color: 'text-yellow-600' },
};

export function RPSHistory() {
  const { isConnected, address } = useStacksWallet();
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalGames, setTotalGames] = useState(0);

  const fetchHistory = async () => {
    if (!isConnected || !address) {
      setHistory([]);
      return;
    }

    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      // Get user game count
      const countResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: rockPaperScissorsContractName,
        functionName: 'get-user-game-count',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const countData = cvToJSON(countResult);
      const count = parseInt(String(countData.value || '0'));
      setTotalGames(count);

      if (count === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      const historyEntries: GameHistoryEntry[] = [];

      // Fetch last 20 games (most recent first)
      const startIndex = Math.max(0, count - 20);
      for (let i = count - 1; i >= startIndex; i--) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Delay to avoid rate limiting

          const historyResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: rockPaperScissorsContractName,
            functionName: 'get-user-game',
            functionArgs: [standardPrincipalCV(address), uintCV(i)],
            network,
            senderAddress: contractAddress,
          });

          const historyData = cvToJSON(historyResult);

          if (historyData.type !== 'none' && historyData.value) {
            const value = historyData.value.value || historyData.value;
            const resultStr = value.result?.value || value.result || '';
            historyEntries.push({
              gameId: i,
              userChoice: parseInt(String(value['user-choice']?.value || value.userChoice?.value || '0')),
              contractChoice: parseInt(String(value['contract-choice']?.value || value.contractChoice?.value || '0')),
              result: resultStr,
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
          <h3 className="text-xl font-semibold text-gray-900">Histórico de Jogos</h3>
          <p className="text-sm text-gray-500 mt-1">
            Total: {totalGames} jogos
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
          Nenhum jogo ainda. Jogue sua primeira partida!
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="divide-y divide-gray-200">
          {history.map((entry) => {
            const resultInfo = RESULT_LABELS[entry.result] || { text: entry.result, color: 'text-gray-600' };
            return (
              <div key={entry.gameId} className="py-3 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {entry.result === 'win' ? '🎉' : entry.result === 'loss' ? '😔' : '🤝'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Jogo #{entry.gameId + 1}
                      </p>
                      <p className="text-sm text-gray-500">
                        Você: {CHOICE_LABELS[entry.userChoice]} • Contrato: {CHOICE_LABELS[entry.contractChoice]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${resultInfo.color}`}>{resultInfo.text}</p>
                    {entry.points > 0 && (
                      <p className="text-sm text-green-600">+{entry.points} pontos</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

