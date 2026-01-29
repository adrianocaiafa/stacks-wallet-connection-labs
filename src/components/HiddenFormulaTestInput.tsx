import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { uintCV } from '@stacks/transactions';
import { contractAddress, hiddenFormulaContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

const MAX_INPUT = 20;

interface TestResult {
  input: number;
  output: number;
  attemptsLeft: number;
}

export function HiddenFormulaTestInput({ onTestSuccess }: { onTestSuccess?: () => void }) {
  const { isConnected, address } = useStacksWallet();
  const [x, setX] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timer | null>(null);

  const POLLING_INTERVAL = 10000; // 10 segundos

  // Função para parsear o resultado da transação
  const parseTestResult = (txResult: string): TestResult | null => {
    try {
      const outputMatch = txResult.match(/\(output u(\d+)\)/);
      const inputMatch = txResult.match(/\(input u(\d+)\)/);
      const attemptsMatch = txResult.match(/\(attempts-left u(\d+)\)/);

      if (!outputMatch) return null;

      return {
        input: inputMatch ? parseInt(inputMatch[1]) : x,
        output: parseInt(outputMatch[1]),
        attemptsLeft: attemptsMatch ? parseInt(attemptsMatch[1]) : 0,
      };
    } catch (error) {
      console.error('Erro ao parsear resultado:', error);
      return null;
    }
  };

  // Função para verificar o status da transação
  const checkTransactionStatus = async (txId: string): Promise<TestResult | null> => {
    try {
      const response = await fetch(
        `https://api.mainnet.hiro.so/extended/v1/tx/${txId}`
      );
      const txData = await response.json();

      if (txData.tx_status === 'pending') {
        return null;
      }

      if (txData.tx_status === 'success') {
        const result = parseTestResult(txData.tx_result.repr);
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
  const startPolling = (txId: string, inputValue: number) => {
    stopPolling();
    setPendingTxId(txId);

    const interval = setInterval(async () => {
      try {
        const result = await checkTransactionStatus(txId);

        if (result) {
          clearInterval(interval);
          setPollingInterval(null);
          setPendingTxId(null);

          setLastResult({ ...result, input: inputValue });

          if (onTestSuccess) {
            setTimeout(() => {
              onTestSuccess();
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

  const handleTest = async () => {
    if (!isConnected || !address) {
      setError('Conecte sua carteira primeiro');
      return;
    }
    if (x < 0 || x > MAX_INPUT) {
      setError(`Entrada deve ser entre 0 e ${MAX_INPUT}`);
      return;
    }
    setIsExecuting(true);
    setError(null);
    setLastResult(null);
    try {
      const network = createNetwork('mainnet');
      const inputValue = x;
      await openContractCall({
        contractAddress,
        contractName: hiddenFormulaContractName,
        functionName: 'test-input',
        functionArgs: [uintCV(x)],
        network,
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        onFinish: (data) => {
          console.log('Transaction submitted:', data.txId);
          setError('Teste enviado! Verificando resultado...');
          setLastResult(null);
          
          startPolling(data.txId, inputValue);
          setIsExecuting(false);
        },
        onCancel: () => {
          setError('Transação cancelada pelo usuário.');
          setIsExecuting(false);
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao testar entrada.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para testar entradas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Testar Entrada</h3>
        <p className="text-gray-600 text-sm mb-4">
          Digite um valor x (0–{MAX_INPUT}) e veja o resultado f(x). Usa uma tentativa.
        </p>
      </div>
      <div className="flex gap-3 items-center mb-4">
        <label className="text-sm font-medium text-gray-700">x =</label>
        <input
          type="number"
          min={0}
          max={MAX_INPUT}
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
          disabled={isExecuting || pendingTxId !== null}
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleTest}
          disabled={isExecuting || pendingTxId !== null}
          className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isExecuting ? 'Enviando...' : pendingTxId ? 'Aguardando...' : 'Testar f(x)'}
        </button>
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
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="text-center">
            <p className="text-lg font-bold text-teal-800 mb-2">
              🧪 Resultado do Teste
            </p>
            <div className="flex justify-center items-center gap-4 mb-3">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Entrada</p>
                <p className="text-2xl font-bold text-teal-700">x = {lastResult.input}</p>
              </div>
              <span className="text-2xl text-gray-400">→</span>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Saída</p>
                <p className="text-2xl font-bold text-teal-700">f(x) = {lastResult.output}</p>
              </div>
            </div>
            <p className="text-sm text-teal-700">
              Tentativas restantes: <span className="font-bold">{lastResult.attemptsLeft}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
