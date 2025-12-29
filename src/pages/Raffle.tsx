import { RaffleStatus } from '../components/RaffleStatus';
import { BuyTicketForm } from '../components/BuyTicketForm';
import { RaffleHistory } from '../components/RaffleHistory';

export function Raffle() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎲 Raffle / Sorteio</h1>
          <p className="text-gray-600">
            Compre tickets e participe do sorteio! Cada compra gera uma transação on-chain.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RaffleStatus />
          <BuyTicketForm />
        </div>

        <div className="mt-6">
          <RaffleHistory />
        </div>
      </div>
    </div>
  );
}

