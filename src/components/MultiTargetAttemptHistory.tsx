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
    const handler = () => fetchHistory();
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
        <h3 className="text-xl font-semibold text-gray-900">Tentativas do jogo atual</h3>
        <button
          onClick={fetchHistory}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          🔄 Atualizar
        </button>
      </div>

      {loading && attempts.length === 0 ? (
        <p className="text-center text-gray-500">Carregando...</p>
      ) : attempts.length === 0 ? (
        <p className="text-center text-gray-500">
          {attemptsUsed === 0 ? 'Nenhuma tentativa ainda. Faça um palpite.' : 'Nenhuma tentativa carregada.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {attempts.map((a) => (
            <li key={a.attemptNum} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-gray-600">#{a.attemptNum}</span>
              <span className="font-mono text-sm">
                [{a.guess[0]}, {a.guess[1]}, {a.guess[2]}] → soma {a.guess[0] + a.guess[1] + a.guess[2]}
              </span>
              <span className="text-indigo-600 font-semibold">{a.exactMatches} exatos</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
