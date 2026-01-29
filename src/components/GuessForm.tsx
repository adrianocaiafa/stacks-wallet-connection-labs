import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import {uintCV} from '@stacks/transactions';
import { contractAddress, numberGuessZenContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

interface GuessResult {
  result: 'correct' | 'higher' | 'lower';
  attempts: number;
  message: string;
  number?: number | null;
}

export function GuessForm({ onGuessSuccess }: { onGuessSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [guess, setGuess] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timer | null>(null);

  const POLLING_INTERVAL = 5000; // 5 segundos

  // Função para parsear o resultado da transação
  const parseGuessResult = (txResult: string): GuessResult | null => {
    try {
      // Extrai os dados usando regex
      const resultMatch = txResult.match(/\(result "([^"]+)"\)/);
      const messageMatch = txResult.match(/\(message "([^"]+)"\)/);
      const attemptsMatch = txResult.match(/\(attempts u(\d+)\)/);
      const numberMatch = txResult.match(/\(number u(\d+)\)/);

      if (!resultMatch) return null;

      return {
        result: resultMatch[1] as 'correct' | 'higher' | 'lower',
        message: messageMatch?.[1] || '',
        attempts: parseInt(attemptsMatch?.[1] || '0'),
        number: numberMatch ? parseInt(numberMatch[1]) : null,
      };
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

    // Inicia o polling a cada 5 segundos
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

          // Limpa o campo de input se acertou
          if (result.result === 'correct') {
            setGuess('');
          }

          // Chama callback de sucesso
          if (onGuessSuccess) {
            onGuessSuccess();
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

  const handleGuess = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    const guessNumber = parseInt(guess);
    if (isNaN(guessNumber) || guessNumber < 0 || guessNumber > 1000) {
      setError('Por favor, digite um número entre 0 e 1000');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setLastResult(null);

    try {
      const network = createNetwork('mainnet');

      await openContractCall({
  contractAddress,
  contractName: numberGuessZenContractName,
  functionName: 'guess',
  functionArgs: [uintCV(guessNumber)],
  network: network,
  appDetails: {
    name: 'Stacks Portal',
    icon: window.location.origin + '/vite.svg',
  },
  onFinish: (data) => {
    console.log('Transaction submitted:', data.txId);
    setError('Palpite enviado! Verificando resultado...');
    setGuess('');
    setLastResult(null);

    // Inicia o polling para verificar o resultado
    startPolling(data.txId);
    setIsExecuting(false);
  },
  onCancel: () => {
    console.log('Transaction cancelled');
    setError('Transação cancelada pelo usuário.');
    setIsExecuting(false);
  },
});
      

      // const signedTx = await signTransaction(transaction);
      // const broadcastResponse = await broadcastTransaction(signedTx, network);

      // if (broadcastResponse.error) {
      //   throw new Error(broadcastResponse.error);
      // }

      // // Parse result
      // const result = broadcastResponse.result;
      // setLastResult({
      //   result: result.result,
      //   attempts: result.attempts,
      //   message: result.message,
      //   number: result.number,
      // });

      // if (result.result === 'correct') {
      //   setGuess('');
      //   if (onGuessSuccess) {
      //     setTimeout(() => {
      //       onGuessSuccess();
      //     }, 2000);
      //   }
      // }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer tentativa. Tente novamente.');
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">🎯 Fazer Tentativa</h3>
        <p className="text-gray-600 text-sm mb-4">
          Digite um número entre 0 e 1000. Sem custo, apenas gas!
        </p>
      </div>

      <div className="mb-4">
        <input
          type="number"
          min="0"
          max="1000"
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value);
            setError(null);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleGuess();
            }
          }}
          disabled={isExecuting || pendingTxId !== null}
          placeholder="Digite um número (0-1000)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-center text-lg font-semibold"
        />
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
                Verificando resultado a cada 5 segundos
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
        <div className={`border rounded-lg p-4 mb-4 ${
          lastResult.result === 'correct' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`font-semibold mb-2 ${
            lastResult.result === 'correct' ? 'text-green-800' : 'text-blue-800'
          }`}>
            {lastResult.result === 'correct' ? '🎉 Parabéns! Você acertou!' : 
             lastResult.result === 'higher' ? '⬆️ Tente um número maior!' : 
             '⬇️ Tente um número menor!'}
          </p>
          <div className="text-sm space-y-1">
            <p>Tentativas: <span className="font-bold">{lastResult.attempts}</span></p>
            {lastResult.number !== undefined && (
              <p>Número secreto: <span className="font-bold">{lastResult.number}</span></p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleGuess}
        disabled={isExecuting || !guess || pendingTxId !== null}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
      >
        {isExecuting ? 'Processando...' : pendingTxId ? 'Aguardando...' : 'Fazer Tentativa 🎯'}
      </button>
    </div>
  );
}
