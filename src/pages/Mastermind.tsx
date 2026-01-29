import { MastermindStats } from '../components/MastermindStats';
import { UserMastermindStats } from '../components/UserMastermindStats';
import { MastermindStartGame } from '../components/MastermindStartGame';
import { MastermindGuessForm } from '../components/MastermindGuessForm';
import { MastermindGiveUp } from '../components/MastermindGiveUp';
import { MastermindAttemptHistory } from '../components/MastermindAttemptHistory';
import { MastermindLeaderboard } from '../components/MastermindLeaderboard';

export function Mastermind() {
  const refresh = () => {
    window.dispatchEvent(new CustomEvent('mastermind-refresh'));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mastermind</h1>
          <p className="text-gray-600 mb-2">
            Jogo de quebra-código on-chain. Adivinhe o código secreto de 5 dígitos (0-9) em até 10 tentativas.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>Exatas: dígito e posição corretos</span>
            <span>Parciais: dígito certo em outra posição</span>
            <span>Sem custo, apenas gas</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <MastermindStats />
          <UserMastermindStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <MastermindStartGame onStartSuccess={refresh} />
          <MastermindGuessForm onGuessSuccess={refresh} />
        </div>

        <div className="mb-6">
          <MastermindGiveUp onGiveUpSuccess={refresh} />
        </div>

        <div className="mb-6">
          <MastermindAttemptHistory />
        </div>

        <div className="mt-6">
          <MastermindLeaderboard />
        </div>
      </div>
    </div>
  );
}
