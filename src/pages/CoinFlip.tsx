import { CoinFlipStats } from '../components/CoinFlipStats';
import { UserCoinFlipStats } from '../components/UserCoinFlipStats';
import { CoinFlipForm } from '../components/CoinFlipForm';
import { ClaimFlipRewardButton } from '../components/ClaimFlipRewardButton';
import { CoinFlipLeaderboard } from '../components/CoinFlipLeaderboard';
import { CoinFlipHistory } from '../components/CoinFlipHistory';

export function CoinFlip() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🪙 Coin Flip</h1>
          <p className="text-gray-600 mb-2">
            Jogo de cara ou coroa on-chain. Escolha sua aposta e ganhe pontos se acertar!
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>💰 Custo por jogada: 0.005 STX</span>
            <span>🎯 Ganhe 5 pontos por acerto</span>
            <span>🔥 Mantenha sua sequência de vitórias</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CoinFlipStats />
          <UserCoinFlipStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CoinFlipForm />
          <ClaimFlipRewardButton />
        </div>

        <div className="mb-6">
          <CoinFlipLeaderboard />
        </div>

        <div className="mt-6">
          <CoinFlipHistory />
        </div>
      </div>
    </div>
  );
}
