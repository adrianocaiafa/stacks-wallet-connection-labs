import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { createNetwork } from '@stacks/network';
import { makeContractCall, broadcastTransaction, AnchorMode, uintCV } from '@stacks/transactions';
import { contractAddress, rockPaperScissorsContractName } from '../utils/contract';

const CHOICES = [
  { value: 1, label: 'Pedra', icon: '🪨', emoji: '🪨' },
  { value: 2, label: 'Papel', icon: '📄', emoji: '📄' },
  { value: 3, label: 'Tesoura', icon: '✂️', emoji: '✂️' },
];

const CONTRACT_CHOICES: { [key: number]: string } = {
  1: 'Pedra 🪨',
  2: 'Papel 📄',
  3: 'Tesoura ✂️',
};

export function RPSGameForm() {
  const { isConnected, address } = useAppKit();
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastResult, setLastResult] = useState<{
    userChoice: number;
    contractChoice: number;
    result: string;
    pointsEarned: number;
    winStreak: number;
  } | null>(null);

  const GAME_FEE = 0.01; // 0.01 STX

  const handlePlay = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    if (selectedChoice === null) {
      setError('Por favor, escolha Pedra, Papel ou Tesoura');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSuccess(false);
    setLastResult(null);

    try {
      const network = createNetwork('mainnet');
      const feeMicroStx = Math.floor(GAME_FEE * 1000000);

      const transaction = await makeContractCall({
        contractAddress,
        contractName: rockPaperScissorsContractName,
        functionName: 'play-game',
        functionArgs: [uintCV(selectedChoice), uintCV(feeMicroStx)],
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
      //   userChoice: selectedChoice,
      //   contractChoice: result.contractChoice,
      //   result: result.result,
      //   pointsEarned: result.pointsEarned,
      //   winStreak: result.winStreak,
      // });

      // setSuccess(true);
      // setTimeout(() => {
      //   setSuccess(false);
      //   setSelectedChoice(null);
      // }, 5000);
    } catch (err: any) {
      setError(err.message || 'Erro ao jogar. Tente novamente.');
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

  const getResultMessage = (result: string) => {
    switch (result) {
      case 'win':
        return { text: '🎉 Você ganhou!', color: 'text-green-600' };
      case 'loss':
        return { text: '😔 Você perdeu', color: 'text-red-600' };
      case 'draw':
        return { text: '🤝 Empate!', color: 'text-yellow-600' };
      default:
        return { text: '', color: '' };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center">
        <div className="text-5xl mb-4">🪨📄✂️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Pedra, Papel, Tesoura</h3>
        <p className="text-gray-600 text-sm mb-4">
          Escolha sua jogada. Se ganhar, você ganha 10 pontos!
        </p>
        <p className="text-lg font-bold text-blue-600 mb-6">{GAME_FEE} STX por jogo</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {CHOICES.map((choice) => (
            <button
              key={choice.value}
              onClick={() => {
                setSelectedChoice(choice.value);
                setError(null);
              }}
              disabled={isExecuting}
              className={`px-4 py-6 rounded-lg font-bold text-lg transition ${
                selectedChoice === choice.value
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2`}
            >
              <span className="text-3xl">{choice.emoji}</span>
              <span>{choice.label}</span>
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
            <p className={`font-semibold mb-2 ${getResultMessage(lastResult.result).color}`}>
              {getResultMessage(lastResult.result).text}
            </p>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                Sua escolha: <span className="font-bold">{CONTRACT_CHOICES[lastResult.userChoice]}</span>
              </p>
              <p>
                Escolha do contrato: <span className="font-bold">{CONTRACT_CHOICES[lastResult.contractChoice]}</span>
              </p>
              {lastResult.result === 'win' && (
                <p className="font-semibold text-green-700">+{lastResult.pointsEarned} pontos ganhos!</p>
              )}
              <p>Sequência de vitórias: {lastResult.winStreak}</p>
            </div>
          </div>
        )}

        <button
          onClick={handlePlay}
          disabled={isExecuting || selectedChoice === null}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
        >
          {isExecuting ? 'Jogando...' : 'Jogar 🎮'}
        </button>
      </div>
    </div>
  );
}

