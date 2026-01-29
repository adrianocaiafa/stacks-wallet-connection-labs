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
        <Link to="/daily-check-in">
          <Card
            title="Daily Check-in"
            description="Sistema de check-in diário on-chain com rastreamento de sequências e recompensas."
            icon="✅"
          />
        </Link>
        <Link to="/dice-game">
          <Card
            title="Dice Game"
            description="Jogo de dados on-chain. Escolha um número de 1 a 6 e ganhe pontos se acertar!"
            icon="🎲"
          />
        </Link>
        <Link to="/rock-paper-scissors">
          <Card
            title="Rock Paper Scissors"
            description="Jogo clássico de Pedra, Papel e Tesoura on-chain. Escolha sua jogada e ganhe pontos!"
            icon="🪨📄✂️"
          />
        </Link>
        <Link to="/coin-flip">
          <Card
            title="Coin Flip"
            description="Jogo de cara ou coroa on-chain. Escolha Cara ou Coroa e ganhe pontos se acertar!"
            icon="🪙"
          />
        </Link>
        <Link to="/number-guess-zen">
          <Card
            title="Number Guess Zen"
            description="Adivinhe um número entre 0-1000! Modo infinito de tentativas, sem custo (apenas gas). Dica opcional disponível."
            icon="🎯"
          />
        </Link>
        <Link to="/number-guess-pro">
          <Card
            title="Number Guess Pro"
            description="Modo desafio - exatamente 10 tentativas. Adivinhe um número entre 0-1000! Sem taxas para palpites, dica opcional disponível."
            icon="🎯"
          />
        </Link>
        <Link to="/mastermind">
          <Card
            title="Mastermind"
            description="Jogo de quebra-código on-chain. Adivinhe o código de 5 dígitos (0-9) em até 10 tentativas. Exatas e parciais."
            icon="🔢"
          />
        </Link>
        <Link to="/multi-target">
          <Card
            title="Multi-Target"
            description="Adivinhe 3 números (0–100) que somam um total conhecido. 15 tentativas; exatos por valor e posição. Sem custo, apenas gas."
            icon="🎯"
          />
        </Link>
      </div>
    </div>
  );
}

