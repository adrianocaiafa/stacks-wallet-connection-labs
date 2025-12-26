import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@stacks/connect-react';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider
      appDetails={{
        name: 'Stacks Portal',
        icon: window.location.origin + '/vite.svg',
      }}
      redirectTo="/"
    >
      <App />
    </AuthProvider>
  </StrictMode>,
)
