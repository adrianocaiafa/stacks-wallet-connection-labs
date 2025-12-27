import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { TipJar } from './pages/TipJar';
import { GasMeter } from './pages/GasMeter';
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
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
