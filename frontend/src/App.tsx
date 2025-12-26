import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserSession } from '@stacks/connect';
import { Home } from './pages/Home';
import { TipJar } from './pages/TipJar';
import { Layout } from './components/Layout';
import './App.css';

interface AppProps {
  userSession: UserSession;
}

function App({ userSession }: AppProps) {
  return (
    <Router>
      <Layout userSession={userSession}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tip-jar" element={<TipJar userSession={userSession} />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
