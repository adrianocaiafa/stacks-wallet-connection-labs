import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Connect } from '@stacks/connect-react';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Connect
      authOptions={{
        appDetails: {
          name: 'Stacks Portal',
          icon: window.location.origin + '/vite.svg',
        },
        redirectTo: '/',
      }}
    >
      <App />
    </Connect>
  </StrictMode>,
)
