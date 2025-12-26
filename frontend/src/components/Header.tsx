import { Link } from 'react-router-dom';
import { UserSession } from '@stacks/connect';
import { WalletConnect } from './WalletConnect';

interface HeaderProps {
  userSession: UserSession;
}

export function Header({ userSession }: HeaderProps) {
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
          <WalletConnect userSession={userSession} />
        </nav>
      </div>
    </header>
  );
}

