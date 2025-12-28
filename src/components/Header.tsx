import { Link } from 'react-router-dom';
import { WalletConnect } from './WalletConnect';

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
          <WalletConnect />
        </nav>
      </div>
    </header>
  );
}

