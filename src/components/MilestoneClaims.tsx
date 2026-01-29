import { useState, useEffect } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import { makeContractCall, broadcastTransaction, AnchorMode, uintCV, fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions';
import { contractAddress, dailyCheckInContractName } from '../utils/contract';

const MILESTONES = [
  { days: 7, label: '7 Dias', icon: '🥉' },
  { days: 30, label: '30 Dias', icon: '🥈' },
  { days: 100, label: '100 Dias', icon: '🥇' },
];

export function MilestoneClaims() {
  const { isConnected, address } = useStacksWallet();
  const [claimedMilestones, setClaimedMilestones] = useState<Set<number>>(new Set());
  const [userStreak, setUserStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  const CHECK_IN_FEE = 0.01; // 0.01 STX

  const fetchMilestoneStatus = async () => {
    if (!isConnected || !address) {
      return;
    }

    setLoading(true);
    try {
      const network = createNetwork('mainnet');

      // Get user stats to check current streak
      const statsResult = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: dailyCheckInContractName,
        functionName: 'get-user-stats',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: contractAddress,
      });

      const statsData = cvToJSON(statsResult);
      if (statsData.type !== 'none' && statsData.value) {
        const value = statsData.value.value || statsData.value;
        setUserStreak(parseInt(String(value['current-streak']?.value || value.currentStreak?.value || '0')));
      }

      // Check which milestones are claimed
      const claimed = new Set<number>();
      for (const milestone of MILESTONES) {
        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName: dailyCheckInContractName,
          functionName: 'is-milestone-claimed',
          functionArgs: [standardPrincipalCV(address), uintCV(milestone.days)],
          network,
          senderAddress: contractAddress,
        });

        const data = cvToJSON(result);
        if (data.value === true) {
          claimed.add(milestone.days);
        }
      }
      setClaimedMilestones(claimed);
    } catch (err: any) {
      console.error('Erro ao buscar status dos milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestoneStatus();
  }, [isConnected, address]);

  const handleClaim = async (milestoneDays: number) => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    if (userStreak < milestoneDays) {
      setError(`Você precisa de uma sequência de ${milestoneDays} dias para reivindicar esta recompensa!`);
      return;
    }

    if (claimedMilestones.has(milestoneDays)) {
      setError('Esta recompensa já foi reivindicada!');
      return;
    }

    setExecuting(milestoneDays);
    setError(null);
    setSuccess(null);

    try {
      const network = createNetwork('mainnet');
      const feeMicroStx = Math.floor(CHECK_IN_FEE * 1000000);

      const transaction = await makeContractCall({
        contractAddress,
        contractName: dailyCheckInContractName,
        functionName: 'claim-milestone-reward',
        functionArgs: [uintCV(milestoneDays), uintCV(feeMicroStx)],
        senderKey: address, // This will be replaced by wallet signing
        network,
        anchorMode: AnchorMode.Any,
        fee: 1000,
      });

      // TODO: Integrate with AppKit's signTransaction method
      setError('Assinatura de transação via AppKit será implementada. Por enquanto, o envio direto não está ativo.');
      setExecuting(null);
      return;

      // const signedTx = await signTransaction(transaction);
      // const broadcastResponse = await broadcastTransaction(signedTx, network);

      // if (broadcastResponse.error) {
      //   throw new Error(broadcastResponse.error);
      // }

      // setSuccess(milestoneDays);
      // setClaimedMilestones(new Set([...claimedMilestones, milestoneDays]));
      // setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao reivindicar recompensa. Tente novamente.');
    } finally {
      setExecuting(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recompensas de Milestone</h3>
        <p className="text-center text-gray-500">Conecte sua carteira para ver suas recompensas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Recompensas de Milestone</h3>
        <button
          onClick={fetchMilestoneStatus}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          🔄 Atualizar
        </button>
      </div>

      {loading && (
        <div className="text-center text-gray-500">Carregando...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success !== null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-800 text-sm">Recompensa reivindicada com sucesso! 🎉</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MILESTONES.map((milestone) => {
          const isClaimed = claimedMilestones.has(milestone.days);
          const canClaim = userStreak >= milestone.days && !isClaimed;
          const isExecutingThis = executing === milestone.days;

          return (
            <div
              key={milestone.days}
              className={`border rounded-lg p-4 ${
                isClaimed
                  ? 'bg-green-50 border-green-200'
                  : canClaim
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{milestone.icon}</div>
                <h4 className="font-semibold text-gray-900 mb-1">{milestone.label}</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Sequência: {milestone.days} dias
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Sua sequência: {userStreak} dias
                </p>
                {isClaimed ? (
                  <div className="text-green-600 font-semibold text-sm">✓ Reivindicado</div>
                ) : (
                  <button
                    onClick={() => handleClaim(milestone.days)}
                    disabled={!canClaim || isExecutingThis}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                  >
                    {isExecutingThis
                      ? 'Processando...'
                      : canClaim
                      ? 'Reivindicar'
                      : 'Indisponível'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

