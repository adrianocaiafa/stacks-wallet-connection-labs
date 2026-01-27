import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { TipJar } from './pages/TipJar';
import { GasMeter } from './pages/GasMeter';
import { Raffle } from './pages/Raffle';
import { QuestSystem } from './pages/QuestSystem';
import { VotingSystem } from './pages/VotingSystem';
import { DailyCheckIn } from './pages/DailyCheckIn';
import { DiceGame } from './pages/DiceGame';
import { RockPaperScissors } from './pages/RockPaperScissors';
import { CoinFlip } from './pages/CoinFlip';
import { Layout } from './components/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tip-jar" element={<TipJar />} />
          <Route path="/gas-meter" element={<GasMeter />} />
          <Route path="/raffle" element={<Raffle />} />
          <Route path="/quest-system" element={<QuestSystem />} />
          <Route path="/voting-system" element={<VotingSystem />} />
          <Route path="/daily-check-in" element={<DailyCheckIn />} />
          <Route path="/dice-game" element={<DiceGame />} />
          <Route path="/rock-paper-scissors" element={<RockPaperScissors />} />
          <Route path="/coin-flip" element={<CoinFlip />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
