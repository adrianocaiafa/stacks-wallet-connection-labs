import { useState } from 'react';
import { UserSession } from '@stacks/connect';
import { TipForm } from '../components/TipForm';
import { TipHistory } from '../components/TipHistory';
import { TopTippers } from '../components/TopTippers';

interface TipJarProps {
  userSession: UserSession;
}

export function TipJar({ userSession }: TipJarProps) {
  const isSignedIn = userSession.isUserSignedIn();
  const [recipientAddress, setRecipientAddress] = useState('');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tip Jar</h1>
        <p className="text-gray-600 mb-4">
          Envie tips em STX para criadores e veja o histórico on-chain
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Endereço do Criador (Principal)
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="SP..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {!isSignedIn && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            Por favor, conecte sua carteira para enviar tips.
          </p>
        </div>
      )}

      {isSignedIn && recipientAddress && (
        <div className="mb-8">
          <TipForm recipientAddress={recipientAddress} userSession={userSession} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Histórico</h2>
          <TipHistory recipientAddress={recipientAddress} />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Top Tippers</h2>
          <TopTippers />
        </div>
      </div>
    </div>
  );
}

