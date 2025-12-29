import { QuestStats } from '../components/QuestStats';
import { UserQuestStats } from '../components/UserQuestStats';
import { QuestCard } from '../components/QuestCard';
import { QuestLeaderboard } from '../components/QuestLeaderboard';

export function QuestSystem() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">⚔️ Quest System</h1>
          <p className="text-gray-600 mb-2">
            Complete quests, ganhe pontos e suba de nível! Cada quest gera uma transação on-chain.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>📅 Daily: 0.01 STX • 10 pts</span>
            <span>📆 Weekly: 0.05 STX • 50 pts</span>
            <span>⭐ Special: 0.02 STX • 20 pts</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <QuestStats />
          <UserQuestStats />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <QuestCard
            questType="daily"
            title="Daily Quest"
            description="Complete esta quest diariamente para ganhar pontos"
            fee={0.01}
            points={10}
            icon="📅"
          />
          <QuestCard
            questType="weekly"
            title="Weekly Quest"
            description="Complete esta quest semanalmente para ganhar mais pontos"
            fee={0.05}
            points={50}
            icon="📆"
          />
          <QuestCard
            questType="special"
            title="Special Quest"
            description="Quest especial sem cooldown, complete quando quiser"
            fee={0.02}
            points={20}
            icon="⭐"
          />
        </div>

        <div className="mt-6">
          <QuestLeaderboard />
        </div>
      </div>
    </div>
  );
}

