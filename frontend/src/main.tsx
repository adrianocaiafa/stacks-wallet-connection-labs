import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppConfig, UserSession } from '@stacks/connect';
import './index.css'
import App from './App.tsx'

const appConfig = new AppConfig(['store_write'], 'http://localhost:5173');
const userSession = new UserSession({ appConfig });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App userSession={userSession} />
  </StrictMode>,
)
