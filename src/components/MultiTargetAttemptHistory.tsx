import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, multiTargetContractName } from '../utils/contract';

interface AttemptEntry {
  attemptNum: number;
  guess: number[];
  exactMatches: number;
}

export function MultiTargetAttemptHistory() {
  const { isConnected, address } = useStacksWallet();
  const [attempts, setAttempts] = useState<AttemptEntry[]>([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!isConnected || !address) {
      setAttempts([]);
      setAttemptsUsed(0);
      return;
    }

    setLoading(true);

    try {
      const network = createNetwork('mainnet');

      const activeResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: multiTargetContractName,
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
        setAttempts([]);
        setLoading(false);
        return;
      }

      const entries: AttemptEntry[] = [];

      for (let i = 0; i < used; i++) {
        try {
          await new Promise((r) => setTimeout(r, 80));
          const attemptResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: multiTargetContractName,
            functionName: 'get-attempt',
            functionArgs: [standardPrincipalCV(address), uintCV(i)],
            network,
            senderAddress: contractAddress,
          });

          const attemptData = cvToJSON(attemptResult);

          if (attemptData.type !== 'none' && attemptData.value) {
            const val = attemptData.value.value || attemptData.value;
            const guessRaw = val.guess?.value ?? val.guess;
            const guessList = Array.isArray(guessRaw)
              ? guessRaw
              : (guessRaw && typeof guessRaw === 'object' && 'list' in guessRaw
                  ? (guessRaw as { list: unknown[] }).list
                  : []);
            const guess = guessList.map((c: unknown) =>
              parseInt(String((c as { value?: string })?.value ?? c ?? '0'), 10)
            );
            const exact = parseInt(String(val['exact-matches']?.value ?? val.exactMatches?.value ?? '0'));
            entries.push({
              attemptNum: i + 1,
              guess: guess.length === 3 ? guess : [0, 0, 0],
              exactMatches: exact,
            });
          }
        } catch {
          continue;
        }
      }

      setAttempts(entries);
    } catch (err: unknown) {
      console.error('Erro ao buscar histórico de tentativas Multi-Target:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isConnected, address]);

  useEffect(() => {
    const handler = () => {
      console.log('Multi-Target refresh event received, updating history...');
      fetchHistory();
    };
    window.addEventListener('multi-target-refresh', handler);
    return () => window.removeEventListener('multi-target-refresh', handler);
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
        <h3 className="text-xl font-semibold text-gray-900">
          Tentativas do jogo atual
          {loading && attempts.length > 0 && (
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

      {loading && attempts.length === 0 ? (
        <p className="text-center text-gray-500">Carregando...</p>
      ) : attempts.length === 0 ? (
        <p className="text-center text-gray-500">
          {attemptsUsed === 0 ? 'Nenhuma tentativa ainda. Faça um palpite.' : 'Nenhuma tentativa carregada.'}
        </p>
      ) : (
        <div className="space-y-3">
          {attempts.map((a, index) => {
            const isLatest = index === attempts.length - 1;
            const sum = a.guess[0] + a.guess[1] + a.guess[2];
            return (
              <div
                key={a.attemptNum}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isLatest
                    ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className={`font-medium ${isLatest ? 'text-indigo-700' : 'text-gray-700'}`}>
                  #{a.attemptNum}
                  {isLatest && <span className="ml-2 text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full">Última</span>}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {a.guess.map((num, i) => (
                      <div
                        key={i}
                        className={`w-12 h-10 flex items-center justify-center rounded font-mono font-bold ${
                          isLatest ? 'bg-indigo-200 text-indigo-900' : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    Σ = {sum}
                  </span>
                </div>
                <span className={`font-semibold ${
                  a.exactMatches === 3 ? 'text-green-600' :
                  a.exactMatches > 0 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {a.exactMatches === 3 && '🎉 '}
                  {a.exactMatches} exato{a.exactMatches !== 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
