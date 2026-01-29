import { useState } from 'react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { createNetwork } from '@stacks/network';
import {uintCV} from '@stacks/transactions';
import { contractAddress, coinFlipContractName } from '../utils/contract';
import { openContractCall } from '@stacks/connect';

export function ClaimFlipRewardButton() {
  const { isConnected, address } = useStacksWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rewardData, setRewardData] = useState<{
    totalPoints: number;
    totalFlips: number;
    wins: number;
    winStreak: number;
    longestStreak: number;
  } | null>(null);

  const CLAIM_FEE = 0.005; // 0.005 STX

  const handleClaim = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSuccess(false);
    setRewardData(null);

    try {
      const network = createNetwork('mainnet');
      const feeMicroStx = Math.floor(CLAIM_FEE * 1000000);

      await openContractCall({
  contractAddress,
  contractName: coinFlipContractName,
  functionName: 'claim-flip-reward',
  functionArgs: [uintCV(feeMicroStx)],
  network: network,
  appDetails: {
    name: 'Stacks Portal',
    icon: window.location.origin + '/vite.svg',
  },
  onFinish: (data) => {
    console.log('Transaction submitted:', data.txId);
    setSuccess(true);


              },
  onCancel: () => {
    console.log('Transaction cancelled');
    setIsExecuting(false);
  },
});
      

      // const signedTx = await signTransaction(transaction);
      // const broadcastResponse = await broadcastTransaction(signedTx, network);

      // if (broadcastResponse.error) {
      //   throw new Error(broadcastResponse.error);
      // }

      // // Parse result from transaction
      // const result = broadcastResponse.result;
      // setRewardData({
      //   totalPoints: result.totalPoints,
      //   totalFlips: result.totalFlips,
      //   wins: result.wins,
      //   winStreak: result.winStreak,
      //   longestStreak: result.longestStreak,
      // });

      // setSuccess(true);
      // setTimeout(() => {
      //   setSuccess(false);
      //   setRewardData(null);
      // }, 5000);
    } catch (err: any) {
      setError(err.message || 'Erro ao reivindicar recompensa. Tente novamente.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Conecte sua carteira para reivindicar recompensas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center">
        <div className="text-5xl mb-4">🎁</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Reivindicar Recompensa</h3>
        <p className="text-gray-600 text-sm mb-4">
          Reivindique suas estatísticas e pontos acumulados no jogo.
        </p>
        <p className="text-lg font-bold text-blue-600 mb-6">{CLAIM_FEE} STX</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && rewardData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-semibold mb-2">🎉 Recompensa reivindicada!</p>
            <div className="text-sm text-green-700 space-y-1">
              <p>Total de pontos: <span className="font-bold">{rewardData.totalPoints}</span></p>
              <p>Total de jogadas: <span className="font-bold">{rewardData.totalFlips}</span></p>
              <p>Vitórias: <span className="font-bold">{rewardData.wins}</span></p>
              <p>Sequência atual: <span className="font-bold">{rewardData.winStreak}</span></p>
              <p>Maior sequência: <span className="font-bold">{rewardData.longestStreak}</span></p>
            </div>
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={isExecuting}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
        >
          {isExecuting ? 'Processando...' : 'Reivindicar Recompensa 🎁'}
        </button>
      </div>
    </div>
  );
}
