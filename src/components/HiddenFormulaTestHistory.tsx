import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, hiddenFormulaContractName } from '../utils/contract';

interface TestEntry {
  testNum: number;
  input: number;
  output: number;
}

export function HiddenFormulaTestHistory() {
  const { isConnected, address } = useStacksWallet();
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [entries, setEntries] = useState<TestEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!isConnected || !address) {
      setAttemptsUsed(0);
      setEntries([]);
      return;
    }
    setLoading(true);
    try {
      const network = createNetwork('mainnet');
      const activeResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: hiddenFormulaContractName,
        functionName: 'get-active-game',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });
      const activeData = cvToJSON(activeResult);
      let used = 0;
      if (activeData.type !== 'none' && activeData.value) {
        const v = activeData.value.value || activeData.value;
        used = parseInt(String(v['attempts-used']?.value ?? v.attemptsUsed?.value ?? '0'));
      }
      setAttemptsUsed(used);
      if (used === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }
      const list: TestEntry[] = [];
      for (let i = 1; i <= used; i++) {
        await new Promise((r) => setTimeout(r, 80));
        const testResult = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName: hiddenFormulaContractName,
          functionName: 'get-test',
          functionArgs: [standardPrincipalCV(address), uintCV(i)],
          network,
          senderAddress: contractAddress,
        });
        const testData = cvToJSON(testResult);
        if (testData.type !== 'none' && testData.value) {
          const val = testData.value.value || testData.value;
          const input = parseInt(String(val.input?.value ?? val.input ?? '0'));
          const output = parseInt(String(val.output?.value ?? val.output ?? '0'));
          list.push({ testNum: i, input, output });
        }
      }
      setEntries(list);
    } catch (err) {
      console.error('Erro ao buscar histórico de testes:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isConnected, address]);

  useEffect(() => {
    const handler = () => {
      console.log('Hidden Formula refresh event received, updating history...');
      fetchHistory();
    };
    window.addEventListener('hidden-formula-refresh', handler);
    return () => window.removeEventListener('hidden-formula-refresh', handler);
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para ver o histórico de testes</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Histórico de Testes
          {loading && entries.length > 0 && (
            <span className="ml-2 text-sm text-gray-500">(atualizando...)</span>
          )}
        </h3>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳' : '🔄'} Atualizar
        </button>
      </div>
      {loading && entries.length === 0 ? (
        <p className="text-center text-gray-500">Carregando...</p>
      ) : entries.length === 0 ? (
        <p className="text-center text-gray-500">
          {attemptsUsed === 0 ? 'Inicie um jogo e teste entradas para ver o histórico.' : 'Nenhum teste registrado.'}
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((e, idx) => {
            const isLatest = idx === entries.length - 1;
            return (
              <div
                key={e.testNum}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isLatest
                    ? 'bg-teal-50 border-teal-300 shadow-sm'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className={`font-medium ${isLatest ? 'text-teal-700' : 'text-gray-700'}`}>
                  #{e.testNum}
                  {isLatest && <span className="ml-2 text-xs bg-teal-200 text-teal-800 px-2 py-1 rounded-full">Último</span>}
                </span>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded font-mono text-sm ${
                    isLatest ? 'bg-teal-200 text-teal-900' : 'bg-gray-200 text-gray-800'
                  }`}>
                    x = {e.input}
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className={`px-3 py-1 rounded font-mono text-sm ${
                    isLatest ? 'bg-teal-200 text-teal-900' : 'bg-gray-200 text-gray-800'
                  }`}>
                    f(x) = {e.output}
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
