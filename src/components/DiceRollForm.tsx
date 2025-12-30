import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { createNetwork } from '@stacks/network';
import { makeContractCall, broadcastTransaction, AnchorMode, uintCV } from '@stacks/transactions';
import { contractAddress, diceGameContractName } from '../utils/contract';

export function DiceRollForm() {
  const { isConnected, address } = useAppKit();
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastResult, setLastResult] = useState<{
    userChoice: number;
    diceResult: number;
    won: boolean;
    pointsEarned: number;
    winStreak: number;
  } | null>(null);

  const DICE_FEE = 0.01; // 0.01 STX
  const DICE_NUMBERS = [1, 2, 3, 4, 5, 6];

  const handleRoll = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    if (selectedNumber === null) {
      setError('Por favor, escolha um número de 1 a 6');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSuccess(false);
    setLastResult(null);

    try {
      const network = createNetwork('mainnet');
      const feeMicroStx = Math.floor(DICE_FEE * 1000000);

      const transaction = await makeContractCall({
        contractAddress,
        contractName: diceGameContractName,
        functionName: 'roll-dice',
        functionArgs: [uintCV(selectedNumber), uintCV(feeMicroStx)],
        senderKey: address, // This will be replaced by wallet signing
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
      //   userChoice: selectedNumber,
      //   diceResult: result.diceResult,
      //   won: result.won,
      //   pointsEarned: result.pointsEarned,
      //   winStreak: result.winStreak,
      // });

      // setSuccess(true);
      // setTimeout(() => {
      //   setSuccess(false);
      //   setSelectedNumber(null);
      // }, 5000);
    } catch (err: any) {
      setError(err.message || 'Erro ao rolar o dado. Tente novamente.');
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
        <div className="text-5xl mb-4">🎲</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Rolar Dado</h3>
        <p className="text-gray-600 text-sm mb-4">
          Escolha um número de 1 a 6. Se o dado cair no seu número, você ganha 10 pontos!
        </p>
        <p className="text-lg font-bold text-blue-600 mb-6">{DICE_FEE} STX por rolagem</p>

        <div className="grid grid-cols-6 gap-2 mb-6">
          {DICE_NUMBERS.map((num) => (
            <button
              key={num}
              onClick={() => {
                setSelectedNumber(num);
                setError(null);
              }}
              disabled={isExecuting}
              className={`px-4 py-3 rounded-lg font-bold text-lg transition ${
                selectedNumber === num
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {num}
            </button>
          ))}
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
              <p>Resultado do dado: <span className="font-bold">{lastResult.diceResult}</span></p>
              {lastResult.won && (
                <p className="font-semibold">+{lastResult.pointsEarned} pontos ganhos!</p>
              )}
              <p>Sequência de vitórias: {lastResult.winStreak}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleRoll}
          disabled={isExecuting || selectedNumber === null}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
        >
          {isExecuting ? 'Rolando...' : 'Rolar Dado 🎲'}
        </button>
      </div>
    </div>
  );
}

