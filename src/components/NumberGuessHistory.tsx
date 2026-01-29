import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { standardPrincipalCV, uintCV } from '@stacks/transactions';
import { contractAddress, numberGuessZenContractName } from '../utils/contract';

interface GameHistoryItem {
  gameId: number;
  secretNumber: number;
  attempts: number;
  won: boolean;
  hintUsed: boolean;
}

export function NumberGuessHistory() {
  const { isConnected, address } = useStacksWallet();
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameCount, setGameCount] = useState<number>(0);

  const fetchHistory = async () => {
    if (!isConnected || !address) {
      setHistory([]);
      return;
    }

    setIsLoading(true);
    try {
      const network = createNetwork('mainnet');

      const gameCountResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: numberGuessZenContractName,
        functionName: 'get-player-game-count',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const gameCountData = cvToJSON(gameCountResult);
      const totalGames = parseInt(gameCountData.value || '0');
      setGameCount(totalGames);

      const gamesToFetch = Math.min(totalGames, 10);
      const historyItems: GameHistoryItem[] = [];

      for (let i = 0; i < gamesToFetch; i++) {
        const gameId = totalGames - 1 - i;
        
        try {
          const historyResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: numberGuessZenContractName,
            functionName: 'get-game-history',
            functionArgs: [standardPrincipalCV(address), uintCV(gameId)],
            network,
            senderAddress: contractAddress,
          });

          const historyData = cvToJSON(historyResult);
          
          if (historyData.type !== 'none' && historyData.value) {
            const tupleValue = historyData.value.value || historyData.value;
            historyItems.push({
              gameId,
              secretNumber: parseInt(tupleValue['secret-number']?.value || '0'),
              attempts: parseInt(tupleValue['attempts']?.value || '0'),
              won: tupleValue['won']?.value === true || tupleValue['won'] === true,
              hintUsed: tupleValue['hint-used']?.value === true || tupleValue['hint-used'] === true,
            });
          }

          if (i < gamesToFetch - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Erro ao buscar histórico do jogo ${gameId}:`, error);
        }
      }

      setHistory(historyItems.reverse());
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para ver o histórico</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">📜 Histórico de Jogos</h3>
        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition disabled:opacity-50"
        >
          {isLoading ? '🔄' : '🔄 Atualizar'}
        </button>
      </div>

      {isLoading && history.length === 0 ? (
        <p className="text-center text-gray-500">Carregando histórico...</p>
      ) : history.length === 0 ? (
        <p className="text-center text-gray-500">Nenhum jogo encontrado. Comece a jogar!</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">Total de jogos: {gameCount}</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.gameId}
                className={`p-3 rounded-lg border ${
                  item.won
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">Jogo #{item.gameId}</span>
                      {item.won ? (
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Vitória</span>
                      ) : (
                        <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">Desistiu</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Número secreto: <span className="font-bold">{item.secretNumber}</span></p>
                      <p>Tentativas: <span className="font-bold">{item.attempts}</span></p>
                      {item.hintUsed && (
                        <p className="text-purple-600">💡 Dica usada</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
