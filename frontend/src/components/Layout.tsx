import { ReactNode } from 'react';
import { UserSession } from '@stacks/connect';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  userSession: UserSession;
}

export function Layout({ children, userSession }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header userSession={userSession} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}

