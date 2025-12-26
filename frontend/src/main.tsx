import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppConfig, UserSession } from '@stacks/connect';
import './index.css'
import App from './App.tsx'

const appConfig = new AppConfig(['store_write'], window.location.origin);
const userSession = new UserSession({ appConfig });

// Handle auth callback
if (userSession.isSignInPending()) {
  userSession.handlePendingSignIn().then(() => {
    window.location.href = '/';
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App userSession={userSession} />
  </StrictMode>,
)
