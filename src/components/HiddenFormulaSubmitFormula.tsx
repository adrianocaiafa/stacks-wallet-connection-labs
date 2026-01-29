import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { uintCV } from '@stacks/transactions';
import { contractAddress, hiddenFormulaContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

interface SubmitResult {
  correct: boolean;
  message: string;
  formula?: { a: number; b: number; c: number };
}

export function HiddenFormulaSubmitFormula({ onSubmitSuccess }: { onSubmitSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [guessA, setGuessA] = useState(0);
  const [guessB, setGuessB] = useState(0);
  const [guessC, setGuessC] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timer | null>(null);
  const [lastResult, setLastResult] = useState<SubmitResult | null>(null);

  const POLLING_INTERVAL = 10000; // 10 segundos

  // Função para parsear o resultado da transação
  const parseSubmitResult = (txResult: string): SubmitResult | null => {
    try {
      const correctMatch = txResult.match(/\(correct (true|false)\)/);
      const messageMatch = txResult.match(/\(message "([^"]+)"\)/);
      
      // Se ganhou, extrai a fórmula
      const aMatch = txResult.match(/\(a u(\d+)\)/);
      const bMatch = txResult.match(/\(b u(\d+)\)/);
      const cMatch = txResult.match(/\(c u(\d+)\)/);

      const result: SubmitResult = {
        correct: correctMatch ? correctMatch[1] === 'true' : false,
        message: messageMatch?.[1] || '',
      };

      if (aMatch && bMatch && cMatch) {
        result.formula = {
          a: parseInt(aMatch[1]),
          b: parseInt(bMatch[1]),
          c: parseInt(cMatch[1]),
        };
      }

      return result;
    } catch (error) {
      console.error('Erro ao parsear resultado:', error);
      return null;
    }
  };

  // Função para verificar o status da transação
  const checkTransactionStatus = async (txId: string): Promise<SubmitResult | null> => {
    try {
      const response = await fetch(
        `https://api.mainnet.hiro.so/extended/v1/tx/${txId}`
      );
      const txData = await response.json();

      if (txData.tx_status === 'pending') {
        return null;
      }

      if (txData.tx_status === 'success') {
        const result = parseSubmitResult(txData.tx_result.repr);
        return result;
      }

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
    stopPolling();
    setPendingTxId(txId);

    const interval = setInterval(async () => {
      try {
        const result = await checkTransactionStatus(txId);

        if (result) {
          clearInterval(interval);
          setPollingInterval(null);
          setPendingTxId(null);

          setLastResult(result);

          if (onSubmitSuccess) {
            setTimeout(() => {
              onSubmitSuccess();
            }, 1000);
          }

          setError(null);
        }
      } catch (error) {
        clearInterval(interval);
        setPollingInterval(null);
        setPendingTxId(null);
        setError('Erro ao verificar resultado da transação');
      }
    }, POLLING_INTERVAL);

    setPollingInterval(interval);
  };

  // Limpa o polling ao desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      setError('Conecte sua carteira primeiro');
      return;
    }
    setIsExecuting(true);
    setError(null);
    setLastResult(null);
    try {
      const network = createNetwork('mainnet');
      await openContractCall({
        contractAddress,
        contractName: hiddenFormulaContractName,
        functionName: 'submit-formula',
        functionArgs: [uintCV(guessA), uintCV(guessB), uintCV(guessC)],
        network,
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        onFinish: (data) => {
          console.log('Transaction submitted:', data.txId);
          setError('Palpite enviado! Verificando resultado...');
          setLastResult(null);

          startPolling(data.txId);
          setIsExecuting(false);
        },
        onCancel: () => {
          setError('Transação cancelada pelo usuário.');
          setIsExecuting(false);
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar palpite.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para enviar palpite</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Enviar Fórmula</h3>
        <p className="text-gray-600 text-sm mb-4">
          Palpite: f(x) = ax² + bx + c. a: 0–3, b: 0–5, c: 0–10.
        </p>
      </div>
      <div className="flex gap-2 items-center justify-center mb-4 flex-wrap">
        <label className="text-sm font-medium text-gray-700">a</label>
        <input
          type="number"
          min={0}
          max={3}
          value={guessA}
          onChange={(e) => setGuessA(Number(e.target.value))}
          disabled={isExecuting || pendingTxId !== null}
          className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-center disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label className="text-sm font-medium text-gray-700">b</label>
        <input
          type="number"
          min={0}
          max={5}
          value={guessB}
          onChange={(e) => setGuessB(Number(e.target.value))}
          disabled={isExecuting || pendingTxId !== null}
          className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-center disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label className="text-sm font-medium text-gray-700">c</label>
        <input
          type="number"
          min={0}
          max={10}
          value={guessC}
          onChange={(e) => setGuessC(Number(e.target.value))}
          disabled={isExecuting || pendingTxId !== null}
          className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-center disabled:opacity-50 disabled:cursor-not-allowed"
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
          lastResult.correct
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="text-center">
            <p className={`text-lg font-bold mb-2 ${
              lastResult.correct ? 'text-green-800' : 'text-red-800'
            }`}>
              {lastResult.correct ? '🎉 Parabéns! Você descobriu a fórmula!' : '❌ Fórmula incorreta'}
            </p>
            <p className="text-sm mb-3">{lastResult.message}</p>
            {lastResult.formula && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-sm font-semibold mb-2">Fórmula secreta:</p>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xl font-mono font-bold text-indigo-700">
                    f(x) = {lastResult.formula.a}x² + {lastResult.formula.b}x + {lastResult.formula.c}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isExecuting || pendingTxId !== null}
        className="w-full px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {isExecuting ? 'Enviando...' : pendingTxId ? 'Aguardando...' : 'Enviar Palpite (a, b, c)'}
      </button>
    </div>
  );
}
