import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/auth.provider';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ProfileSetupPage from './pages/auth/ProfileSetupPage';
import ProfileViewPage from './pages/profile/ProfileViewPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/profile/setup" element={<ProfileSetupPage />} />
        <Route path="/profile" element={<ProfileViewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
