import { useState, useEffect } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, numberGuessProContractName } from '../utils/contract';

interface GameHistoryItem {
  secretNumber: number;
  attemptsUsed: number;
  won: boolean;
  score: number;
  hintUsed: boolean;
}

export function NumberGuessProHistory() {
  const { isConnected, address } = useAppKit();
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [gameCount, setGameCount] = useState<number>(0);

  const fetchHistory = async () => {
    if (!isConnected || !address) {
      setHistory([]);
      return;
    }

    setLoading(true);
    try {
      const network = createNetwork('mainnet');

      const gameCountResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: numberGuessProContractName,
        functionName: 'get-player-game-count',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const countData = cvToJSON(gameCountResult);
      const totalGames = parseInt(String(countData.value || '0'));
      setGameCount(totalGames);

      const gamesToFetch = Math.min(totalGames, 10);
      const historyItems: GameHistoryItem[] = [];

      for (let i = totalGames - 1; i >= Math.max(0, totalGames - gamesToFetch); i--) {
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          const historyResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: numberGuessProContractName,
            functionName: 'get-game-history',
            functionArgs: [standardPrincipalCV(address), uintCV(i)],
            network,
            senderAddress: contractAddress,
          });

          const historyData = cvToJSON(historyResult);
          if (historyData.type !== 'none' && historyData.value) {
            const value = historyData.value.value || historyData.value;
            historyItems.push({
              secretNumber: parseInt(String(value['secret-number']?.value || value.secretNumber?.value || '0')),
              attemptsUsed: parseInt(String(value['attempts-used']?.value || value.attemptsUsed?.value || '0')),
              won: value.won?.value === true || value.won === true,
              score: parseInt(String(value.score?.value || value.score || '0')),
              hintUsed: value['hint-used']?.value === true || value.hintUsed === true,
            });
          }
        } catch (err) {
          console.error(`Erro ao buscar histórico do jogo ${i}:`, err);
        }
      }

      setHistory(historyItems.reverse());
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
        <h3 className="text-xl font-semibold text-gray-900">Histórico de Jogos</h3>
        <button
          onClick={fetchHistory}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          🔄 Atualizar
        </button>
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Carregando histórico...</div>
      ) : history.length === 0 ? (
        <p className="text-gray-600 text-center">Nenhum jogo encontrado. Inicie seu primeiro jogo!</p>
      ) : (
        <div className="space-y-3">
          {history.map((game, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                game.won
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className={`font-semibold ${game.won ? 'text-green-800' : 'text-red-800'}`}>
                    {game.won ? '✅ Vitória' : '❌ Derrota'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Número: <span className="font-semibold">{game.secretNumber}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Tentativas: <span className="font-semibold">{game.attemptsUsed}/10</span>
                  </p>
                  {game.hintUsed && (
                    <p className="text-xs text-yellow-600 mt-1">💡 Dica usada</p>
                  )}
                </div>
                {game.won && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{game.score}</p>
                    <p className="text-xs text-gray-600">pontos</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
