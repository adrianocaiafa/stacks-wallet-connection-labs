import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { ActionButton } from '../components/ActionButton';
import { UserStats } from '../components/UserStats';
import { Leaderboard } from '../components/Leaderboard';
import { ActionStats } from '../components/ActionStats';

export function GasMeter() {
  const { isConnected, address } = useAppKit();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Gas Meter</h1>
        <p className="text-gray-600 mb-4">
          Mini-game de ações pagas. Execute ações repetíveis pagando pequenas taxas em STX.
        </p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            Por favor, conecte sua carteira para executar ações.
          </p>
        </div>
      )}

      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <ActionButton
            action="cast-spell"
            label="Cast Spell"
            fee={0.01}
            description="Lance um feitiço mágico"
            icon="✨"
            onActionSelect={setSelectedAction}
          />
          <ActionButton
            action="upgrade"
            label="Upgrade"
            fee={0.05}
            description="Melhore suas habilidades"
            icon="⬆️"
            onActionSelect={setSelectedAction}
          />
          <ActionButton
            action="claim-daily"
            label="Claim Daily"
            fee={0.02}
            description="Reivindique sua recompensa diária"
            icon="🎁"
            onActionSelect={setSelectedAction}
          />
        </div>
      )}

      {isConnected && address && (
        <div className="mb-8">
          <UserStats userAddress={address} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Estatísticas por Ação</h2>
          <ActionStats />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Leaderboard</h2>
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}

