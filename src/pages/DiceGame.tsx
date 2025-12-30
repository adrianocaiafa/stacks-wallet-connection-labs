import { DiceStats } from '../components/DiceStats';
import { UserDiceStats } from '../components/UserDiceStats';
import { DiceRollForm } from '../components/DiceRollForm';
import { ClaimRewardButton } from '../components/ClaimRewardButton';
import { DiceLeaderboard } from '../components/DiceLeaderboard';
import { DiceHistory } from '../components/DiceHistory';

export function DiceGame() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎲 Dice Game</h1>
          <p className="text-gray-600 mb-2">
            Jogo de dados on-chain. Escolha um número de 1 a 6 e ganhe pontos se acertar!
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>💰 Custo por rolagem: 0.01 STX</span>
            <span>🎯 Ganhe 10 pontos por acerto</span>
            <span>🔥 Mantenha sua sequência de vitórias</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DiceStats />
          <UserDiceStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DiceRollForm />
          <ClaimRewardButton />
        </div>

        <div className="mb-6">
          <DiceLeaderboard />
        </div>

        <div className="mt-6">
          <DiceHistory />
        </div>
      </div>
    </div>
  );
}

