import { NumberGuessStats } from '../components/NumberGuessStats';
import { UserNumberGuessStats } from '../components/UserNumberGuessStats';
import { ActiveGameDisplay } from '../components/ActiveGameDisplay';
import { StartGameButton } from '../components/StartGameButton';
import { GuessForm } from '../components/GuessForm';
import { HintButton } from '../components/HintButton';
import { GiveUpButton } from '../components/GiveUpButton';
import { NumberGuessHistory } from '../components/NumberGuessHistory';
import { NumberGuessLeaderboard } from '../components/NumberGuessLeaderboard';

export function NumberGuessZen() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎯 Number Guess Zen</h1>
          <p className="text-gray-600 mb-2">
            Modo infinito de tentativas - Jogabilidade casual. Adivinhe um número entre 0 e 1000!
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>✅ Sem custo, apenas gas</span>
            <span>💡 Dica opcional: 0.003 STX</span>
            <span>🔥 Rastreamento de sequências</span>
            <span>🏆 Leaderboard global</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <NumberGuessStats />
          <UserNumberGuessStats />
        </div>

        <div className="mb-6">
          <ActiveGameDisplay />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <StartGameButton />
          <div className="space-y-4">
            <GuessForm />
            <HintButton />
            <GiveUpButton />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <NumberGuessLeaderboard />
          <NumberGuessHistory />
        </div>
      </div>
    </div>
  );
}
