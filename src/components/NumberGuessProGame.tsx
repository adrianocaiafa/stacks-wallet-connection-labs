import { useState, useEffect } from 'react';
import { createNetwork } from '@stacks/network';
import { makeContractCall, fetchCallReadOnlyFunction, cvToJSON, AnchorMode, uintCV, standardPrincipalCV } from '@stacks/transactions';
import { contractAddress, numberGuessProContractName } from '../utils/contract';
import { useStacksWallet } from '../hooks/useStacksWallet';

interface ActiveGame {
  secretNumber: number;
  attemptsLeft: number;
  attemptsUsed: number;
  hintUsed: boolean;
  gameId: number;
}

interface GameResult {
  result: string;
  attemptsUsed: number;
  score: number;
  message: string;
  hintUsed: boolean;
  number?: number | null;
}

export function NumberGuessProGame() {
  const { isConnected, address } = useStacksWallet();
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [guessValue, setGuessValue] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [hintInfo, setHintInfo] = useState<{ parity: string; rangeStart: number; rangeEnd: number } | null>(null);
  const [canUseHint, setCanUseHint] = useState(false);
  const [loading, setLoading] = useState(false);

  const HINT_FEE = 0.003; // 0.003 STX
  const MIN_NUMBER = 0;
  const MAX_NUMBER = 1000;

  const fetchActiveGame = async () => {
    if (!isConnected || !address) {
      setActiveGame(null);
      setCanUseHint(false);
      return;
    }

    setLoading(true);
    try {
      const network = createNetwork('mainnet');

      const gameResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: numberGuessProContractName,
        functionName: 'get-active-game',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const gameData = cvToJSON(gameResult);

      if (gameData.type !== 'none' && gameData.value) {
        const value = gameData.value.value || gameData.value;
        const game: ActiveGame = {
          secretNumber: parseInt(String(value['secret-number']?.value || value.secretNumber?.value || '0')),
          attemptsLeft: parseInt(String(value['attempts-left']?.value || value.attemptsLeft?.value || '0')),
          attemptsUsed: parseInt(String(value['attempts-used']?.value || value.attemptsUsed?.value || '0')),
          hintUsed: value['hint-used']?.value === true || value.hintUsed === true,
          gameId: parseInt(String(value['game-id']?.value || value.gameId?.value || '0')),
        };
        setActiveGame(game);
        setHintInfo(null);

        // Check if can use hint
        const canHintResult = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName: numberGuessProContractName,
          functionName: 'can-use-hint',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        });
        const canHintData = cvToJSON(canHintResult);
        setCanUseHint(canHintData.value === true || canHintData === true);
      } else {
        setActiveGame(null);
        setCanUseHint(false);
      }
    } catch (err: any) {
      console.error('Erro ao buscar jogo ativo:', err);
      setActiveGame(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveGame();
  }, [isConnected, address]);

  const handleStartGame = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setGameResult(null);
    setHintInfo(null);

    try {
      const network = createNetwork('mainnet');

      const transaction = await makeContractCall({
        contractAddress,
        contractName: numberGuessProContractName,
        functionName: 'start-game',
        functionArgs: [],
        senderKey: address,
        network,
        anchorMode: AnchorMode.Any,
        fee: 1000,
      });

      setError('Assinatura de transação via AppKit será implementada. Por enquanto, o envio direto não está ativo.');
      setIsExecuting(false);
      return;
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar jogo. Tente novamente.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGuess = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    const guessNum = parseInt(guessValue);
    if (isNaN(guessNum) || guessNum < MIN_NUMBER || guessNum > MAX_NUMBER) {
      setError(`Por favor, digite um número entre ${MIN_NUMBER} e ${MAX_NUMBER}`);
      return;
    }

    setIsExecuting(true);
    setError(null);
    setGameResult(null);

    try {
      const network = createNetwork('mainnet');

      const transaction = await makeContractCall({
        contractAddress,
        contractName: numberGuessProContractName,
        functionName: 'guess',
        functionArgs: [uintCV(guessNum)],
        senderKey: address,
        network,
        anchorMode: AnchorMode.Any,
        fee: 1000,
      });

      setError('Assinatura de transação via AppKit será implementada. Por enquanto, o envio direto não está ativo.');
      setIsExecuting(false);
      return;
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer palpite. Tente novamente.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGetHint = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const network = createNetwork('mainnet');
      const feeMicroStx = Math.floor(HINT_FEE * 1000000);

      const transaction = await makeContractCall({
        contractAddress,
        contractName: numberGuessProContractName,
        functionName: 'get-hint',
        functionArgs: [uintCV(feeMicroStx)],
        senderKey: address,
        network,
        anchorMode: AnchorMode.Any,
        fee: 1000,
      });

      setError('Assinatura de transação via AppKit será implementada. Por enquanto, o envio direto não está ativo.');
      setIsExecuting(false);
      return;
    } catch (err: any) {
      setError(err.message || 'Erro ao obter dica. Tente novamente.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGiveUp = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const network = createNetwork('mainnet');

      const transaction = await makeContractCall({
        contractAddress,
        contractName: numberGuessProContractName,
        functionName: 'give-up',
        functionArgs: [],
        senderKey: address,
        network,
        anchorMode: AnchorMode.Any,
        fee: 1000,
      });

      setError('Assinatura de transação via AppKit será implementada. Por enquanto, o envio direto não está ativo.');
      setIsExecuting(false);
      return;
    } catch (err: any) {
      setError(err.message || 'Erro ao desistir. Tente novamente.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para jogar</p>
      </div>
    );
  }

  if (loading && !activeGame) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!activeGame) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Number Guess Pro</h3>
          <p className="text-gray-600 text-sm mb-4">
            Adivinhe um número entre {MIN_NUMBER} e {MAX_NUMBER} em exatamente 10 tentativas!
          </p>
          <p className="text-gray-500 text-xs mb-6">
            Sem taxas para palpites (apenas gas). Dica opcional disponível por {HINT_FEE} STX (consome 1 tentativa).
          </p>
          <button
            onClick={handleStartGame}
            disabled={isExecuting}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
          >
            {isExecuting ? 'Iniciando...' : '🎮 Iniciar Novo Jogo'}
          </button>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Jogo Ativo</h3>
        <button
          onClick={fetchActiveGame}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          🔄 Atualizar
        </button>
      </div>

      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{activeGame.attemptsLeft}</p>
            <p className="text-sm text-gray-600">Tentativas Restantes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{activeGame.attemptsUsed}</p>
            <p className="text-sm text-gray-600">Tentativas Usadas</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Faixa: <span className="font-semibold">{MIN_NUMBER} - {MAX_NUMBER}</span>
          </p>
        </div>
      </div>

      {hintInfo && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-semibold text-yellow-800 mb-2">💡 Dica Revelada:</p>
          <p className="text-sm text-yellow-700">
            O número é <span className="font-bold">{hintInfo.parity === 'even' ? 'PAR' : 'ÍMPAR'}</span> e está entre{' '}
            <span className="font-bold">{hintInfo.rangeStart} - {hintInfo.rangeEnd}</span>
          </p>
        </div>
      )}

      {gameResult && (
        <div className={`mb-4 p-4 rounded-lg border ${
          gameResult.result === 'correct' 
            ? 'bg-green-50 border-green-200' 
            : gameResult.result === 'game-over'
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`font-semibold mb-2 ${
            gameResult.result === 'correct' 
              ? 'text-green-800' 
              : gameResult.result === 'game-over'
              ? 'text-red-800'
              : 'text-blue-800'
          }`}>
            {gameResult.result === 'correct' && '🎉 Vitória!'}
            {gameResult.result === 'game-over' && '😔 Fim de Jogo'}
            {gameResult.result === 'lower' && '⬇️ Tente um número menor!'}
            {gameResult.result === 'higher' && '⬆️ Tente um número maior!'}
          </p>
          <p className="text-sm">
            {gameResult.message}
            {gameResult.number !== null && gameResult.number !== undefined && (
              <span className="font-bold"> Número: {gameResult.number}</span>
            )}
            {gameResult.score > 0 && (
              <span className="block mt-1">Pontuação: {gameResult.score} pontos</span>
            )}
          </p>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="guess-input" className="block text-sm font-medium text-gray-700 mb-2">
          Seu Palpite ({MIN_NUMBER} - {MAX_NUMBER}):
        </label>
        <input
          id="guess-input"
          type="number"
          min={MIN_NUMBER}
          max={MAX_NUMBER}
          value={guessValue}
          onChange={(e) => {
            setGuessValue(e.target.value);
            setError(null);
          }}
          disabled={isExecuting || activeGame.attemptsLeft === 0}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Digite seu palpite"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleGuess}
          disabled={isExecuting || activeGame.attemptsLeft === 0 || !guessValue}
          className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isExecuting ? 'Processando...' : '🎯 Fazer Palpite'}
        </button>
        {canUseHint && (
          <button
            onClick={handleGetHint}
            disabled={isExecuting || activeGame.attemptsLeft === 0}
            className="px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isExecuting ? 'Processando...' : `💡 Obter Dica (${HINT_FEE} STX)`}
          </button>
        )}
      </div>

      <button
        onClick={handleGiveUp}
        disabled={isExecuting}
        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExecuting ? 'Processando...' : '😔 Desistir'}
      </button>
    </div>
  );
}
