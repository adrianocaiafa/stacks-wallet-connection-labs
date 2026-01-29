import { MultiTargetStats } from '../components/MultiTargetStats';
import { UserMultiTargetStats } from '../components/UserMultiTargetStats';
import { MultiTargetStartGame } from '../components/MultiTargetStartGame';
import { MultiTargetGuessForm } from '../components/MultiTargetGuessForm';
import { MultiTargetGiveUp } from '../components/MultiTargetGiveUp';
import { MultiTargetAttemptHistory } from '../components/MultiTargetAttemptHistory';

export function MultiTarget() {
  const refresh = () => {
    window.dispatchEvent(new CustomEvent('multi-target-refresh'));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Multi-Target</h1>
          <p className="text-gray-600 mb-2">
            Adivinhe 3 números (0–100) cuja soma é um total conhecido. Até 15 tentativas; cada palpite revela quantos números estão exatos (valor + posição).
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>3 números • soma conhecida</span>
            <span>Exatos: valor e posição corretos</span>
            <span>Sem custo, apenas gas</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <MultiTargetStats />
          <UserMultiTargetStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <MultiTargetStartGame onStartSuccess={refresh} />
          <MultiTargetGuessForm onGuessSuccess={refresh} />
        </div>

        <div className="mb-6">
          <MultiTargetGiveUp onGiveUpSuccess={refresh} />
        </div>

        <div className="mb-6">
          <MultiTargetAttemptHistory />
        </div>
      </div>
    </div>
  );
}
