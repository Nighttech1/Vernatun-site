import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LobbyPage } from './pages/LobbyPage';
import { RoomPage } from './pages/RoomPage';
import { loadSentinelPatternsFromApi } from './services/moderation/patternsStore';

export function App() {
  useEffect(() => {
    void loadSentinelPatternsFromApi();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/campus" replace />} />
      <Route path="/campus" element={<LobbyPage />} />
      <Route path="/lounge" element={<Navigate to="/campus" replace />} />
      <Route path="/lounge/" element={<Navigate to="/campus" replace />} />
      <Route path="/room" element={<RoomPage />} />
      <Route path="*" element={<Navigate to="/campus" replace />} />
    </Routes>
  );
}
