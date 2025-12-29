import { Link } from 'react-router-dom';
import { Card } from '../components/Card';

export function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Stacks Portal
        </h1>
        <p className="text-xl text-gray-600">
          Conecte sua carteira e explore funcionalidades da rede Stacks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/tip-jar">
          <Card
            title="Tip Jar"
            description="Envie tips em STX para criadores. Veja histórico e ranking de top tippers."
            icon="💰"
          />
        </Link>
        <Link to="/gas-meter">
          <Card
            title="Gas Meter"
            description="Mini-game de ações pagas. Execute ações repetíveis pagando pequenas taxas."
            icon="⚡"
          />
        </Link>
        <Link to="/raffle">
          <Card
            title="Raffle / Sorteio"
            description="Compre tickets e participe do sorteio on-chain. Alto engajamento e gamificação."
            icon="🎲"
          />
        </Link>
        <Link to="/quest-system">
          <Card
            title="Quest System"
            description="Complete quests, ganhe pontos e suba de nível. Sistema de missões on-chain com alto engajamento."
            icon="⚔️"
          />
        </Link>
        <Link to="/voting-system">
          <Card
            title="Voting System"
            description="Sistema de votação on-chain para decisões da comunidade. Cada voto gera uma transação."
            icon="🗳️"
          />
        </Link>
      </div>
    </div>
  );
}

