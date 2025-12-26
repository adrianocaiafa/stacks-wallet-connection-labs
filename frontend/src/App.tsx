import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { TipJar } from './pages/TipJar';
import { Layout } from './components/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tip-jar" element={<TipJar />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
