import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { listCV, uintCV } from '@stacks/transactions';
import { contractAddress, mastermindContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

const CHOICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface GuessResult {
  exactMatches: number;
  partialMatches: number;
  attemptsUsed: number;
  gameWon: boolean;
  message?: string;
  secretCode?: number[];
}

export function MastermindGuessForm({ onGuessSuccess }: { onGuessSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [code, setCode] = useState<number[]>([0, 0, 0, 0, 0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timer | null>(null);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);

  const POLLING_INTERVAL = 10000; // 10 segundos

  // Função para parsear o resultado da transação
  const parseGuessResult = (txResult: string): GuessResult | null => {
    try {
      // Extrai os dados usando regex
      const exactMatch = txResult.match(/\(exact-matches u(\d+)\)/);
      const partialMatch = txResult.match(/\(partial-matches u(\d+)\)/);
      const attemptsMatch = txResult.match(/\(attempts-used u(\d+)\)/);
      const gameWonMatch = txResult.match(/\(game-won (true|false)\)/);
      const messageMatch = txResult.match(/\(message "([^"]+)"\)/);
      
      // Extrai o código secreto se o jogo foi ganho ou perdido
      const secretCodeMatch = txResult.match(/\(secret-code \(list u(\d+) u(\d+) u(\d+) u(\d+) u(\d+)\)\)/);

      const result: GuessResult = {
        exactMatches: exactMatch ? parseInt(exactMatch[1]) : 0,
        partialMatches: partialMatch ? parseInt(partialMatch[1]) : 0,
        attemptsUsed: attemptsMatch ? parseInt(attemptsMatch[1]) : 0,
        gameWon: gameWonMatch ? gameWonMatch[1] === 'true' : false,
        message: messageMatch?.[1],
      };

      if (secretCodeMatch) {
        result.secretCode = [
          parseInt(secretCodeMatch[1]),
          parseInt(secretCodeMatch[2]),
          parseInt(secretCodeMatch[3]),
          parseInt(secretCodeMatch[4]),
          parseInt(secretCodeMatch[5]),
        ];
      }

      return result;
    } catch (error) {
      console.error('Erro ao parsear resultado:', error);
      return null;
    }
  };

  // Função para verificar o status da transação
  const checkTransactionStatus = async (txId: string): Promise<GuessResult | null> => {
    try {
      const response = await fetch(
        `https://api.mainnet.hiro.so/extended/v1/tx/${txId}`
      );
      const txData = await response.json();

      // Verifica se ainda está pendente
      if (txData.tx_status === 'pending') {
        return null; // Continua o polling
      }

      // Verifica se teve sucesso
      if (txData.tx_status === 'success') {
        const result = parseGuessResult(txData.tx_result.repr);
        return result;
      }

      // Se falhou
      if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
        throw new Error('Transação falhou: ' + (txData.tx_result?.repr || 'Erro desconhecido'));
      }

      return null;
    } catch (error) {
      console.error('Erro ao verificar transação:', error);
      throw error;
    }
  };

  // Função para parar o polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setPendingTxId(null);
    }
  };

  // Função para iniciar o polling
  const startPolling = (txId: string) => {
    // Para qualquer polling anterior
    stopPolling();

    setPendingTxId(txId);

    // Inicia o polling a cada 10 segundos
    const interval = setInterval(async () => {
      try {
        const result = await checkTransactionStatus(txId);

        if (result) {
          // Encontrou o resultado! Para o polling usando a referência local
          clearInterval(interval);
          setPollingInterval(null);
          setPendingTxId(null);

          // Atualiza a UI com o resultado
          setLastResult(result);

          // Chama callback de sucesso após um pequeno delay para garantir que o histórico tenha os dados
          if (onGuessSuccess) {
            setTimeout(() => {
              onGuessSuccess();
            }, 1000);
          }

          setError(null);
        }
      } catch (error) {
        // Para o polling usando a referência local
        clearInterval(interval);
        setPollingInterval(null);
        setPendingTxId(null);
        setError('Erro ao verificar resultado da transação');
      }
    }, POLLING_INTERVAL);

    setPollingInterval(interval);
  };

  // Limpa o polling ao desmontar o componente
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const setDigit = (index: number, value: number) => {
    const next = [...code];
    next[index] = value;
    setCode(next);
    setError(null);
  };

  const handleGuess = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const network = createNetwork('mainnet');
      const codeCV = listCV([
        uintCV(code[0]),
        uintCV(code[1]),
        uintCV(code[2]),
        uintCV(code[3]),
        uintCV(code[4]),
      ]);

      await openContractCall({
        contractAddress,
        contractName: mastermindContractName,
        functionName: 'guess',
        functionArgs: [codeCV],
        network,
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        onFinish: (data) => {
          console.log('Transaction submitted:', data.txId);
          setError('Tentativa enviada! Verificando resultado...');
          setLastResult(null);

          // Inicia o polling para verificar o resultado
          startPolling(data.txId);
          setIsExecuting(false);
        },
        onCancel: () => {
          setError('Transação cancelada pelo usuário.');
          setIsExecuting(false);
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar tentativa.');
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Sua Tentativa</h3>
        <p className="text-gray-600 text-sm mb-4">
          Escolha 5 digitos (0-9). Exatas = posicao certa, parciais = digito certo em outra posicao.
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-4 flex-wrap">
        {code.map((d, i) => (
          <select
            key={i}
            value={d}
            onChange={(e) => setDigit(i, parseInt(e.target.value, 10))}
            disabled={isExecuting || pendingTxId !== null}
            className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
          >
            {CHOICES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        ))}
      </div>

      {error && !pendingTxId && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {pendingTxId && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800 mb-1">
                ⏳ Aguardando confirmação na blockchain...
              </p>
              <p className="text-xs text-blue-600">
                Verificando resultado a cada 10 segundos
              </p>
              <a
                href={`https://explorer.hiro.so/txid/${pendingTxId}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-700 underline mt-1 inline-block"
              >
                Ver transação no explorer →
              </a>
            </div>
          </div>
        </div>
      )}

      {lastResult && (
        <div className={`mb-4 p-4 rounded-lg border ${
          lastResult.gameWon
            ? 'bg-green-50 border-green-200'
            : lastResult.exactMatches === 0 && lastResult.partialMatches === 0
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="text-center">
            <p className={`text-lg font-bold mb-2 ${
              lastResult.gameWon
                ? 'text-green-800'
                : lastResult.exactMatches === 0 && lastResult.partialMatches === 0
                ? 'text-red-800'
                : 'text-amber-800'
            }`}>
              {lastResult.gameWon && '🎉 Parabéns! Você decifrou o código!'}
              {!lastResult.gameWon && lastResult.exactMatches === 0 && lastResult.partialMatches === 0 && '❌ Nenhum acerto'}
              {!lastResult.gameWon && (lastResult.exactMatches > 0 || lastResult.partialMatches > 0) && '🎯 Continue tentando!'}
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <div>
                <span className="font-semibold text-green-700">Exatos:</span>{' '}
                <span className="font-bold text-lg">{lastResult.exactMatches}</span>
              </div>
              <div>
                <span className="font-semibold text-amber-700">Parciais:</span>{' '}
                <span className="font-bold text-lg">{lastResult.partialMatches}</span>
              </div>
            </div>
            {lastResult.message && (
              <p className="text-xs mt-2 text-gray-600">{lastResult.message}</p>
            )}
            {lastResult.secretCode && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-sm font-semibold mb-2">Código secreto:</p>
                <div className="flex justify-center gap-2">
                  {lastResult.secretCode.map((digit, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-lg font-bold text-lg"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleGuess}
        disabled={isExecuting || pendingTxId !== null}
        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-amber-500 text-white rounded-lg hover:from-indigo-600 hover:to-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
      >
        {isExecuting ? 'Enviando...' : pendingTxId ? 'Aguardando...' : 'Enviar Tentativa'}
      </button>
    </div>
  );
}
