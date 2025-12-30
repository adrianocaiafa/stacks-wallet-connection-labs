import { RPSStats } from '../components/RPSStats';
import { UserRPSStats } from '../components/UserRPSStats';
import { RPSGameForm } from '../components/RPSGameForm';
import { ClaimGameRewardButton } from '../components/ClaimGameRewardButton';
import { RPSLeaderboard } from '../components/RPSLeaderboard';
import { RPSHistory } from '../components/RPSHistory';

export function RockPaperScissors() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🪨📄✂️ Rock Paper Scissors</h1>
          <p className="text-gray-600 mb-2">
            Jogo clássico de Pedra, Papel e Tesoura on-chain. Escolha sua jogada e ganhe pontos se vencer!
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>💰 Custo por jogo: 0.01 STX</span>
            <span>🎯 Ganhe 10 pontos por vitória</span>
            <span>🔥 Mantenha sua sequência de vitórias</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RPSStats />
          <UserRPSStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RPSGameForm />
          <ClaimGameRewardButton />
        </div>

        <div className="mb-6">
          <RPSLeaderboard />
        </div>

        <div className="mt-6">
          <RPSHistory />
        </div>
      </div>
    </div>
  );
}

