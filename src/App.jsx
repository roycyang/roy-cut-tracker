import { Routes, Route, Navigate } from 'react-router-dom';
import { useData } from './context/DataContext';
import { useAuth } from './context/AuthContext';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsScreen from './screens/TermsScreen';
import TodayScreen from './screens/TodayScreen';
import ProgressScreen from './screens/ProgressScreen';
import BadgesScreen from './screens/BadgesScreen';
import SupplementsScreen from './screens/SupplementsScreen';
import SettingsScreen from './screens/SettingsScreen';
import CoachScreen from './screens/CoachScreen';
import FeedScreen from './screens/FeedScreen';
import ProgressPhotosScreen from './screens/ProgressPhotosScreen';


export default function App() {
  const { loading: dataLoading } = useData();
  const { loading: authLoading, user } = useAuth();

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginScreen />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/privacy" element={<PrivacyPolicyScreen />} />
      <Route path="/terms" element={<TermsScreen />} />

      {/* Authenticated routes with bottom nav */}
      {/* During migration: allow access even without auth (legacy mode) */}
      <Route element={<AuthenticatedLayout />}>
        <Route index element={<TodayScreen />} />
        <Route path="progress" element={<ProgressScreen />} />
        <Route path="badges" element={<BadgesScreen />} />
        <Route path="supplements" element={<SupplementsScreen />} />
        <Route path="photos" element={<ProgressPhotosScreen />} />
        <Route path="feed" element={<FeedScreen />} />
        <Route path="coach" element={<CoachScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
