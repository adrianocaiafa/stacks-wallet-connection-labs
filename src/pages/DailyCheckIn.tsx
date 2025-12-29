import { CheckInStats } from '../components/CheckInStats';
import { UserCheckInStats } from '../components/UserCheckInStats';
import { CheckInButton } from '../components/CheckInButton';
import { MilestoneClaims } from '../components/MilestoneClaims';
import { CheckInLeaderboard } from '../components/CheckInLeaderboard';
import { CheckInHistory } from '../components/CheckInHistory';

export function DailyCheckIn() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✅ Daily Check-in</h1>
          <p className="text-gray-600 mb-2">
            Sistema de check-in diário on-chain com rastreamento de sequências e recompensas.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>💰 Custo por check-in: 0.01 STX</span>
            <span>🔥 Mantenha sua sequência diária</span>
            <span>🏆 Recompensas em 7, 30 e 100 dias</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CheckInStats />
          <UserCheckInStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CheckInButton />
          <MilestoneClaims />
        </div>

        <div className="mb-6">
          <CheckInLeaderboard />
        </div>

        <div className="mt-6">
          <CheckInHistory />
        </div>
      </div>
    </div>
  );
}

