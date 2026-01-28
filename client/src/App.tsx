import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/auth.provider';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ProfileSetupPage from './pages/auth/ProfileSetupPage';
import ProfileViewPage from './pages/profile/ProfileViewPage';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import PostJobPage from './pages/employer/PostJobPage';
import CompanyOnboardingPage from './pages/onboarding/CompanyOnboardingPage';
import JobSearchPage from './pages/JobSearchPage';

import MainLayout from './components/layout/MainLayout';

function App() {
  return (
    <AuthProvider>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobSearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile/setup" element={<ProfileSetupPage />} />
          <Route path="/profile" element={<ProfileViewPage />} />
          <Route path="/employer/dashboard" element={<EmployerDashboard />} />
          <Route path="/jobs/post" element={<PostJobPage />} />
          <Route path="/onboarding/company-profile" element={<CompanyOnboardingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MainLayout>
    </AuthProvider>
  );
}

export default App;
