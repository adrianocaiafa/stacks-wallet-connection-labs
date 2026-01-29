import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { cvToJSON } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { standardPrincipalCV } from '@stacks/transactions';
import { contractAddress, numberGuessZenContractName } from '../utils/contract';

export function ActiveGameDisplay() {
  const { isConnected, address } = useStacksWallet();
  const [activeGame, setActiveGame] = useState<{
    gameId: number;
    attempts: number;
    hintUsed: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActiveGame = async () => {
    if (!isConnected || !address) {
      setActiveGame(null);
      return;
    }

    setIsLoading(true);
    try {
      const network = createNetwork('mainnet');

      const gameResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: numberGuessZenContractName,
        functionName: 'get-active-game',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const gameData = cvToJSON(gameResult);
      
      if (gameData.type !== 'none' && gameData.value) {
        const tupleValue = gameData.value.value || gameData.value;
        setActiveGame({
          gameId: parseInt(tupleValue['game-id']?.value || '0'),
          attempts: parseInt(tupleValue['attempts']?.value || '0'),
          hintUsed: tupleValue['hint-used']?.value === true || tupleValue['hint-used'] === true,
        });
      } else {
        setActiveGame(null);
      }
    } catch (error) {
      console.error('Erro ao buscar jogo ativo:', error);
      setActiveGame(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveGame();
  }, [isConnected, address]);

  if (!isConnected) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!activeGame) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6 border border-blue-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">🎮 Jogo Ativo</h3>
        <button
          onClick={fetchActiveGame}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-white hover:bg-gray-100 rounded transition disabled:opacity-50"
        >
          {isLoading ? '🔄' : '🔄 Atualizar'}
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">ID do Jogo:</span>
          <span className="font-semibold text-gray-900">#{activeGame.gameId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tentativas:</span>
          <span className="font-semibold text-blue-600">{activeGame.attempts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Dica Usada:</span>
          <span className={`font-semibold ${activeGame.hintUsed ? 'text-red-600' : 'text-green-600'}`}>
            {activeGame.hintUsed ? 'Sim' : 'Não'}
          </span>
        </div>
        <div className="mt-4 p-3 bg-white rounded border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>Objetivo:</strong> Adivinhe o número secreto entre 0 e 1000!
          </p>
        </div>
      </div>
    </div>
  );
}
