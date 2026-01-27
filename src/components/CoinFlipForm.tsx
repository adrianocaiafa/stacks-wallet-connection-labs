import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { createNetwork } from '@stacks/network';
import { makeContractCall, broadcastTransaction, AnchorMode, uintCV } from '@stacks/transactions';
import { contractAddress, coinFlipContractName } from '../utils/contract';

export function CoinFlipForm() {
  const { isConnected, address } = useAppKit();
  const [selectedChoice, setSelectedChoice] = useState<'heads' | 'tails' | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastResult, setLastResult] = useState<{
    userChoice: string;
    coinResult: string;
    won: boolean;
    pointsEarned: number;
    winStreak: number;
  } | null>(null);

  const FLIP_FEE = 0.005; // 0.005 STX
  const HEADS = 0;
  const TAILS = 1;

  const handleFlip = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    if (selectedChoice === null) {
      setError('Por favor, escolha Cara ou Coroa');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSuccess(false);
    setLastResult(null);

    try {
      const network = createNetwork('mainnet');
      const feeMicroStx = Math.floor(FLIP_FEE * 1000000);
      const userChoice = selectedChoice === 'heads' ? HEADS : TAILS;

      const transaction = await makeContractCall({
        contractAddress,
        contractName: coinFlipContractName,
        functionName: 'flip-coin',
        functionArgs: [uintCV(userChoice), uintCV(feeMicroStx)],
        senderKey: address,
        network,
        anchorMode: AnchorMode.Any,
        fee: 1000,
      });

      // TODO: Integrate with AppKit's signTransaction method
      setError('Assinatura de transação via AppKit será implementada. Por enquanto, o envio direto não está ativo.');
      setIsExecuting(false);
      return;

      // const signedTx = await signTransaction(transaction);
      // const broadcastResponse = await broadcastTransaction(signedTx, network);

      // if (broadcastResponse.error) {
      //   throw new Error(broadcastResponse.error);
      // }

      // // Parse result from transaction
      // const result = broadcastResponse.result;
      // setLastResult({
      //   userChoice: selectedChoice === 'heads' ? 'Cara' : 'Coroa',
      //   coinResult: result.coinResult === 0 ? 'Cara' : 'Coroa',
      //   won: result.won,
      //   pointsEarned: result.pointsEarned,
      //   winStreak: result.winStreak,
      // });

      // setSuccess(true);
      // setTimeout(() => {
      //   setSuccess(false);
      //   setSelectedChoice(null);
      // }, 5000);
    } catch (err: any) {
      setError(err.message || 'Erro ao jogar a moeda. Tente novamente.');
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
      <div className="text-center">
        <div className="text-5xl mb-4">🪙</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Jogar Moeda</h3>
        <p className="text-gray-600 text-sm mb-4">
          Escolha Cara ou Coroa. Se acertar, você ganha 5 pontos!
        </p>
        <p className="text-lg font-bold text-blue-600 mb-6">{FLIP_FEE} STX por jogada</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => {
              setSelectedChoice('heads');
              setError(null);
            }}
            disabled={isExecuting}
            className={`px-6 py-8 rounded-lg font-bold text-xl transition ${
              selectedChoice === 'heads'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="text-4xl mb-2">👤</div>
            <div>Cara</div>
          </button>
          <button
            onClick={() => {
              setSelectedChoice('tails');
              setError(null);
            }}
            disabled={isExecuting}
            className={`px-6 py-8 rounded-lg font-bold text-xl transition ${
              selectedChoice === 'tails'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="text-4xl mb-2">🪙</div>
            <div>Coroa</div>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && lastResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-semibold mb-2">
              {lastResult.won ? '🎉 Você ganhou!' : '😔 Você perdeu'}
            </p>
            <div className="text-sm text-green-700 space-y-1">
              <p>Sua escolha: <span className="font-bold">{lastResult.userChoice}</span></p>
              <p>Resultado da moeda: <span className="font-bold">{lastResult.coinResult}</span></p>
              {lastResult.won && (
                <p className="font-semibold">+{lastResult.pointsEarned} pontos ganhos!</p>
              )}
              <p>Sequência de vitórias: {lastResult.winStreak}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleFlip}
          disabled={isExecuting || selectedChoice === null}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
        >
          {isExecuting ? 'Jogando...' : 'Jogar Moeda 🪙'}
        </button>
      </div>
    </div>
  );
}
