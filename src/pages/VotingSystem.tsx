import { useState } from 'react';
import { VotingStats } from '../components/VotingStats';
import { ActivePolls } from '../components/ActivePolls';
import { CreatePollForm } from '../components/CreatePollForm';
import { PollHistory } from '../components/PollHistory';

export function VotingSystem() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🗳️ Voting System</h1>
          <p className="text-gray-600 mb-2">
            Sistema de votação on-chain para decisões da comunidade. Cada voto gera uma transação.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>💰 Custo por voto: 0.01 STX</span>
            <span>📊 Mínimo 2 opções, máximo 10</span>
            <span>🔒 Apenas 1 voto por usuário</span>
          </div>
        </div>

        <div className="mb-6">
          <VotingStats />
        </div>

        <div className="mb-6">
          <ActivePolls />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            {showCreateForm ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Criar Enquete</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <CreatePollForm
                  onPollCreated={() => {
                    setShowCreateForm(false);
                    // Poll will refresh automatically
                  }}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">➕ Criar Nova Enquete</h3>
                <p className="text-gray-600 mb-4">
                  Crie uma nova enquete para a comunidade votar. Apenas o admin pode criar enquetes.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
                >
                  Criar Enquete
                </button>
              </div>
            )}
          </div>
          <div>
            {/* Espaço reservado para futuras funcionalidades */}
          </div>
        </div>

        <div className="mt-6">
          <PollHistory />
        </div>
      </div>
    </div>
  );
}

