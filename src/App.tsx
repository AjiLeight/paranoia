import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './store/GameContext';
import Home from './pages/Home';
import Room from './pages/Room';
import Rules from './pages/Rules';

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500/30">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/rules" element={<Rules />} />
          </Routes>
        </div>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
