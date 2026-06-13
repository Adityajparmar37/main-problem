import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from './routes/ProtectedLayout';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Setup from './features/voice/pages/Setup';
import Conversation from './features/voice/pages/Conversation';
import Report from './features/voice/pages/Report';
import Dashboard from './features/analytics/pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/voice/setup" replace />} />
          <Route path="/voice/setup" element={<Setup />} />
          <Route path="/voice/conversation" element={<Conversation />} />
          <Route path="/voice/report/:id" element={<Report />} />
          <Route path="/voice/report" element={<Report />} />
          <Route path="/analytics" element={<Dashboard />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
