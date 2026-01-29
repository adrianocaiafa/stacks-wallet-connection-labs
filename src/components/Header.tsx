import { Link } from 'react-router-dom';
import { StacksWalletConnect } from './StacksWalletConnect';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-900">
          Stacks Portal
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link to="/" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Home
          </Link>
          <Link to="/tip-jar" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Tip Jar
          </Link>
          <Link to="/gas-meter" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Gas Meter
          </Link>
          <Link to="/raffle" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Raffle
          </Link>
          <Link to="/quest-system" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Quests
          </Link>
          <Link to="/voting-system" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Voting
          </Link>
          <Link to="/daily-check-in" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Check-in
          </Link>
          <Link to="/dice-game" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Dice
          </Link>
          <Link to="/rock-paper-scissors" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            RPS
          </Link>
          <Link to="/coin-flip" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Coin Flip
          </Link>
          <Link to="/number-guess-zen" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Number Guess
          </Link>
          <Link to="/number-guess-pro" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Number Pro
          </Link>
          <Link to="/mastermind" className="text-sm sm:text-base text-gray-600 hover:text-gray-900 px-2 py-1">
            Mastermind
          </Link>
          <StacksWalletConnect />
        </nav>
      </div>
    </header>
  );
}

