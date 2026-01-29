import { NumberGuessProStats } from '../components/NumberGuessProStats';
import { UserNumberGuessProStats } from '../components/UserNumberGuessProStats';
import { NumberGuessProGame } from '../components/NumberGuessProGame';
import { NumberGuessProHistory } from '../components/NumberGuessProHistory';
import { NumberGuessProLeaderboard } from '../components/NumberGuessProLeaderboard';

export function NumberGuessPro() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎯 Number Guess Pro</h1>
          <p className="text-gray-600 mb-2">
            Modo desafio - exatamente 10 tentativas. Adivinhe um número entre 0-1000!
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>🎮 Sem taxas para palpites (apenas gas)</span>
            <span>💡 Dica opcional: 0.003 STX (consome 1 tentativa)</span>
            <span>🏆 Competitivo - ganhe pontos por vitórias rápidas</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <NumberGuessProStats />
          <UserNumberGuessProStats />
        </div>

        <div className="mb-6">
          <NumberGuessProGame />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <NumberGuessProHistory />
          <NumberGuessProLeaderboard />
        </div>
      </div>
    </div>
  );
}
